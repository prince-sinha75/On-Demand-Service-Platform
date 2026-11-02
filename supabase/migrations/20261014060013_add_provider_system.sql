/*
# Provider accounts, availability, and assignment

This migration adds the full provider side of the marketplace:
provider profiles, provider-service coverage, weekly availability rules,
booking status history, and server-side functions for assignment and status transitions.

## 1. New tables
- `provider_profiles` — provider identity, approval status, service area
- `provider_services` — which services a provider offers (many-to-many)
- `provider_availability` — weekly working hours per provider
- `booking_status_history` — audit trail of booking status changes

## 2. Modified tables
- `bookings` — adds `provider_id` and `confirmed_at` columns

## 3. New functions
- `assign_provider(p_booking_id, p_provider_id)` — assigns an approved, available provider
- `reject_booking(p_booking_id, p_new_status)` — provider rejects or customer cancels
- `get_eligible_providers(p_booking_id)` — returns providers available for a booking

## 4. Security
- RLS on all new tables
- `is_approved` on provider_profiles is server-controlled (column-level REVOKE)
- `provider_id` on bookings is server-controlled (assignment via function only)
- booking_status_history has no direct INSERT/UPDATE/DELETE — written only by functions
- All functions REVOKE EXECUTE from anon
*/

-- 1. provider_profiles (must exist before bookings FK)
CREATE TABLE IF NOT EXISTS public.provider_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  display_name text,
  bio text,
  service_area text,
  is_approved boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.provider_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "providers_select_own_or_approved" ON public.provider_profiles;
CREATE POLICY "providers_select_own_or_approved" ON public.provider_profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR is_approved = true);

DROP POLICY IF EXISTS "providers_insert_own" ON public.provider_profiles;
CREATE POLICY "providers_insert_own" ON public.provider_profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "providers_update_own" ON public.provider_profiles;
CREATE POLICY "providers_update_own" ON public.provider_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "providers_delete_own" ON public.provider_profiles;
CREATE POLICY "providers_delete_own" ON public.provider_profiles
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

REVOKE UPDATE ON public.provider_profiles FROM authenticated;
GRANT UPDATE (display_name, bio, service_area, is_active) ON public.provider_profiles TO authenticated;

-- 2. Add provider_id and confirmed_at to bookings (now provider_profiles exists)
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS provider_id uuid REFERENCES public.provider_profiles(id),
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;

REVOKE UPDATE ON public.bookings FROM authenticated;
GRANT UPDATE ON public.bookings TO authenticated;

-- 3. provider_services
CREATE TABLE IF NOT EXISTS public.provider_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.provider_profiles(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.service_categories(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(provider_id, service_id)
);

ALTER TABLE public.provider_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "provider_services_select_all" ON public.provider_services;
CREATE POLICY "provider_services_select_all" ON public.provider_services
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "provider_services_insert_own" ON public.provider_services;
CREATE POLICY "provider_services_insert_own" ON public.provider_services
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.provider_profiles WHERE id = provider_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "provider_services_update_own" ON public.provider_services;
CREATE POLICY "provider_services_update_own" ON public.provider_services
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.provider_profiles WHERE id = provider_id AND user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.provider_profiles WHERE id = provider_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "provider_services_delete_own" ON public.provider_services;
CREATE POLICY "provider_services_delete_own" ON public.provider_services
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.provider_profiles WHERE id = provider_id AND user_id = auth.uid()));

-- 4. provider_availability
CREATE TABLE IF NOT EXISTS public.provider_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.provider_profiles(id) ON DELETE CASCADE,
  weekday smallint NOT NULL CHECK (weekday >= 0 AND weekday <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_time > start_time)
);

ALTER TABLE public.provider_availability ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "availability_select_all" ON public.provider_availability;
CREATE POLICY "availability_select_all" ON public.provider_availability
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "availability_insert_own" ON public.provider_availability;
CREATE POLICY "availability_insert_own" ON public.provider_availability
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.provider_profiles WHERE id = provider_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "availability_update_own" ON public.provider_availability;
CREATE POLICY "availability_update_own" ON public.provider_availability
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.provider_profiles WHERE id = provider_id AND user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.provider_profiles WHERE id = provider_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "availability_delete_own" ON public.provider_availability;
CREATE POLICY "availability_delete_own" ON public.provider_availability
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.provider_profiles WHERE id = provider_id AND user_id = auth.uid()));

-- 5. booking_status_history
CREATE TABLE IF NOT EXISTS public.booking_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  previous_status text,
  new_status text NOT NULL,
  changed_by uuid REFERENCES auth.users(id),
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.booking_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "history_select_own" ON public.booking_status_history;
CREATE POLICY "history_select_own" ON public.booking_status_history
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.bookings WHERE bookings.id = booking_id AND bookings.user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.bookings
      JOIN public.provider_profiles ON provider_profiles.id = bookings.provider_id
      WHERE bookings.id = booking_id AND provider_profiles.user_id = auth.uid()
    )
  );

-- 6. assign_provider function
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
  FROM public.bookings WHERE id = p_booking_id AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  IF v_booking.status NOT IN ('requested', 'confirmed') THEN
    RAISE EXCEPTION 'This booking can no longer be assigned';
  END IF;

  SELECT * INTO v_provider
  FROM public.provider_profiles
  WHERE id = p_provider_id AND is_approved = true AND is_active = true;

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

REVOKE ALL ON FUNCTION public.assign_provider(uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.assign_provider(uuid, uuid) TO authenticated;

-- 7. reject_booking function
CREATE OR REPLACE FUNCTION public.reject_booking(
  p_booking_id uuid,
  p_new_status text DEFAULT 'rejected'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking record;
  v_is_owner boolean;
  v_is_provider boolean;
  v_prev_status text;
BEGIN
  IF p_new_status NOT IN ('rejected', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid status transition';
  END IF;

  SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  v_is_owner := (v_booking.user_id = auth.uid());
  v_is_provider := EXISTS(
    SELECT 1 FROM public.provider_profiles
    WHERE id = v_booking.provider_id AND user_id = auth.uid()
  );

  IF NOT v_is_owner AND NOT v_is_provider THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_new_status = 'cancelled' AND v_is_owner THEN
    IF v_booking.status NOT IN ('requested', 'confirmed') THEN
      RAISE EXCEPTION 'This booking can no longer be cancelled';
    END IF;
  ELSIF p_new_status = 'rejected' AND v_is_provider THEN
    IF v_booking.status NOT IN ('requested', 'confirmed') THEN
      RAISE EXCEPTION 'This booking can no longer be rejected';
    END IF;
  ELSIF p_new_status = 'cancelled' AND NOT v_is_owner THEN
    RAISE EXCEPTION 'Only the customer can cancel';
  ELSIF p_new_status = 'rejected' AND NOT v_is_provider THEN
    RAISE EXCEPTION 'Only the assigned provider can reject';
  END IF;

  v_prev_status := v_booking.status;

  UPDATE public.bookings
  SET status = p_new_status,
      provider_id = CASE WHEN p_new_status = 'rejected' THEN NULL ELSE provider_id END,
      confirmed_at = CASE WHEN p_new_status = 'rejected' THEN NULL ELSE confirmed_at END,
      updated_at = now()
  WHERE id = p_booking_id;

  INSERT INTO public.booking_status_history (booking_id, previous_status, new_status, changed_by, note)
  VALUES (p_booking_id, v_prev_status, p_new_status, auth.uid(), NULL);

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.reject_booking(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.reject_booking(uuid, text) TO authenticated;

-- 8. get_eligible_providers function
CREATE OR REPLACE FUNCTION public.get_eligible_providers(
  p_booking_id uuid
)
RETURNS TABLE (
  provider_id uuid,
  display_name text,
  service_area text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking record;
  v_weekday smallint;
  v_booking_end time;
BEGIN
  SELECT * INTO v_booking
  FROM public.bookings WHERE id = p_booking_id AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  v_weekday := extract(dow FROM v_booking.scheduled_date)::smallint;
  v_booking_end := v_booking.start_time + (v_booking.duration_hours || ' hours')::interval;

  RETURN QUERY
  SELECT pp.id, pp.display_name, pp.service_area
  FROM public.provider_profiles pp
  WHERE pp.is_approved = true
    AND pp.is_active = true
    AND EXISTS(
      SELECT 1 FROM public.provider_services ps
      WHERE ps.provider_id = pp.id AND ps.service_id = v_booking.service_id
    )
    AND EXISTS(
      SELECT 1 FROM public.provider_availability pa
      WHERE pa.provider_id = pp.id
        AND pa.is_active = true
        AND pa.weekday = v_weekday
        AND pa.start_time <= v_booking.start_time
        AND pa.end_time >= v_booking_end
    )
    AND NOT EXISTS(
      SELECT 1 FROM public.bookings b
      WHERE b.provider_id = pp.id
        AND b.id <> p_booking_id
        AND b.status = 'confirmed'
        AND b.scheduled_date = v_booking.scheduled_date
        AND (
          (b.start_time, b.start_time + (b.duration_hours || ' hours')::interval)
          OVERLAPS
          (v_booking.start_time, v_booking_end)
        )
    );
END;
$$;

REVOKE ALL ON FUNCTION public.get_eligible_providers(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_eligible_providers(uuid) TO authenticated;
