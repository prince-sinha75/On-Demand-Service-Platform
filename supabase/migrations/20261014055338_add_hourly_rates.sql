/*
# Add hourly rates and price snapshot to bookings

This migration adds real, server-side pricing to the booking system.

## 1. Modified tables
- `service_categories`
  - Adds `hourly_rate` (numeric, nullable) — the per-hour price in the platform's currency.
  - Adds `currency` (text, default 'GBP') — ISO 4217 currency code for display.
  - If hourly_rate is NULL, the service is still bookable but shows "Price to be confirmed".
- `bookings`
  - Adds `hourly_rate` (numeric, nullable) — snapshot of the service's rate at booking time.
  - Adds `currency` (text, default 'GBP') — snapshot of the currency at booking time.
  - Adds `estimated_total` (numeric, nullable) — server-calculated estimate (hourly_rate × duration_hours).
  - These snapshot columns ensure future rate changes do not alter existing bookings.

## 2. Updated function
- `create_booking` now fetches hourly_rate and currency from the service_categories row,
  calculates estimated_total server-side, and stores all three values in the booking row.
  The browser never sends a price — it is always computed from trusted database values.

## 3. Seed rates
- Sets reasonable placeholder rates for existing services. These are starting values
  that the platform operator can adjust at any time.

## 4. Security
- No new RLS policies needed — hourly_rate and currency on service_categories are
  covered by the existing SELECT policy (anyone can view active services).
- Snapshot columns on bookings are covered by the existing owner-scoped SELECT policy.
- The create_booking function still runs as SECURITY DEFINER and validates all inputs.
- No destructive operations are performed.
*/

ALTER TABLE public.service_categories
  ADD COLUMN IF NOT EXISTS hourly_rate numeric(10, 2),
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'GBP';

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS hourly_rate numeric(10, 2),
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'GBP',
  ADD COLUMN IF NOT EXISTS estimated_total numeric(10, 2);

UPDATE public.service_categories SET hourly_rate = 25.00, currency = 'GBP' WHERE slug = 'personal-driver' AND hourly_rate IS NULL;
UPDATE public.service_categories SET hourly_rate = 35.00, currency = 'GBP' WHERE slug = 'home-plumbing' AND hourly_rate IS NULL;
UPDATE public.service_categories SET hourly_rate = 40.00, currency = 'GBP' WHERE slug = 'electrical-repair' AND hourly_rate IS NULL;
UPDATE public.service_categories SET hourly_rate = 30.00, currency = 'GBP' WHERE slug = 'appliance-maintenance' AND hourly_rate IS NULL;
UPDATE public.service_categories SET hourly_rate = 22.00, currency = 'GBP' WHERE slug = 'home-assistance' AND hourly_rate IS NULL;
UPDATE public.service_categories SET hourly_rate = 18.00, currency = 'GBP' WHERE slug = 'social-companionship' AND hourly_rate IS NULL;

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

  v_estimated_total := NULL;
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

REVOKE ALL ON FUNCTION public.create_booking(uuid, text, date, time, integer, jsonb, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_booking(uuid, text, date, time, integer, jsonb, uuid) TO authenticated;
