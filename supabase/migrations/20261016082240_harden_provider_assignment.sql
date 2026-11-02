/*
# Harden provider assignment and booking history

This migration strengthens the provider workflow without changing existing booking data.

## Changes
- `assign_provider` locks the provider row while checking availability and conflicts,
  serializing concurrent assignments to the same provider.
- `create_booking` records the initial `requested` status in booking_status_history
  after the booking is inserted.

## Security
- Both functions remain SECURITY DEFINER with a fixed search_path.
- Only authenticated users can execute them.
- The caller identity is always derived from auth.uid().
*/

CREATE OR REPLACE FUNCTION public.assign_provider(
  p_booking_id uuid,
  p_provider_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking record;
  v_provider record;
  v_ok boolean;
  v_weekday smallint;
  v_booking_end time;
BEGIN
  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id AND user_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  IF v_booking.status NOT IN ('requested', 'confirmed') THEN
    RAISE EXCEPTION 'This booking can no longer be assigned';
  END IF;

  SELECT * INTO v_provider
  FROM public.provider_profiles
  WHERE id = p_provider_id AND is_approved = true AND is_active = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Provider is not available';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.provider_services
    WHERE provider_id = p_provider_id AND service_id = v_booking.service_id
  ) INTO v_ok;

  IF NOT v_ok THEN
    RAISE EXCEPTION 'Provider does not offer this service';
  END IF;

  v_weekday := extract(dow FROM v_booking.scheduled_date)::smallint;
  v_booking_end := v_booking.start_time + (v_booking.duration_hours || ' hours')::interval;

  SELECT EXISTS(
    SELECT 1 FROM public.provider_availability
    WHERE provider_id = p_provider_id
      AND is_active = true
      AND weekday = v_weekday
      AND start_time <= v_booking.start_time
      AND end_time >= v_booking_end
  ) INTO v_ok;

  IF NOT v_ok THEN
    RAISE EXCEPTION 'Provider is not available at the requested time';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.bookings
    WHERE provider_id = p_provider_id
      AND id <> p_booking_id
      AND status = 'confirmed'
      AND scheduled_date = v_booking.scheduled_date
      AND (
        (start_time, start_time + (duration_hours || ' hours')::interval)
        OVERLAPS
        (v_booking.start_time, v_booking_end)
      )
  ) INTO v_ok;

  IF v_ok THEN
    RAISE EXCEPTION 'Provider has a scheduling conflict';
  END IF;

  UPDATE public.bookings
  SET provider_id = p_provider_id,
      status = 'confirmed',
      confirmed_at = now(),
      updated_at = now()
  WHERE id = p_booking_id;

  INSERT INTO public.booking_status_history (booking_id, previous_status, new_status, changed_by, note)
  VALUES (p_booking_id, v_booking.status, 'confirmed', auth.uid(), 'Provider assigned');

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_booking(
  p_service_id uuid,
  p_location text,
  p_scheduled_date date,
  p_start_time time,
  p_duration_hours integer,
  p_details jsonb DEFAULT '{}'::jsonb,
  p_request_key uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking_id uuid;
  v_hourly_rate numeric(10, 2);
  v_currency text;
  v_estimated_total numeric(10, 2);
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_request_key IS NOT NULL THEN
    SELECT id INTO v_booking_id
    FROM public.bookings
    WHERE user_id = auth.uid() AND request_key = p_request_key;
    IF v_booking_id IS NOT NULL THEN
      RETURN v_booking_id;
    END IF;
  END IF;

  SELECT hourly_rate, currency INTO v_hourly_rate, v_currency
  FROM public.service_categories
  WHERE id = p_service_id AND active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Service unavailable';
  END IF;

  IF p_scheduled_date < current_date THEN
    RAISE EXCEPTION 'Booking date must be today or later';
  END IF;

  IF p_start_time < time '08:00' OR p_start_time > time '19:00' OR extract(minute FROM p_start_time) <> 0 THEN
    RAISE EXCEPTION 'Invalid start time';
  END IF;

  IF p_duration_hours IS NULL OR p_duration_hours < 1 OR p_duration_hours > 24 THEN
    RAISE EXCEPTION 'Invalid duration';
  END IF;

  IF p_location IS NULL OR char_length(btrim(p_location)) < 3 OR char_length(p_location) > 500 THEN
    RAISE EXCEPTION 'Invalid location';
  END IF;

  IF p_details IS NULL OR jsonb_typeof(p_details) <> 'object' THEN
    RAISE EXCEPTION 'Invalid booking details';
  END IF;

  IF v_hourly_rate IS NOT NULL THEN
    v_estimated_total := v_hourly_rate * p_duration_hours;
  END IF;

  INSERT INTO public.bookings (
    user_id, service_id, location, scheduled_date, start_time, duration_hours,
    details, request_key, hourly_rate, currency, estimated_total
  ) VALUES (
    auth.uid(), p_service_id, btrim(p_location), p_scheduled_date, p_start_time,
    p_duration_hours, p_details, p_request_key, v_hourly_rate, v_currency, v_estimated_total
  )
  RETURNING id INTO v_booking_id;

  INSERT INTO public.booking_status_history (booking_id, previous_status, new_status, changed_by, note)
  VALUES (v_booking_id, NULL, 'requested', auth.uid(), 'Booking request created');

  RETURN v_booking_id;
EXCEPTION
  WHEN unique_violation THEN
    SELECT id INTO v_booking_id
    FROM public.bookings
    WHERE user_id = auth.uid() AND request_key = p_request_key;
    IF v_booking_id IS NOT NULL THEN
      RETURN v_booking_id;
    END IF;
    RAISE;
END;
$$;

REVOKE ALL ON FUNCTION public.assign_provider(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_booking(uuid, text, date, time, integer, jsonb, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assign_provider(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_booking(uuid, text, date, time, integer, jsonb, uuid) TO authenticated;
