/*
# Create the authenticated service booking system

This migration creates the first persistent marketplace data model for Hourhand.
It keeps the public service catalogue readable to visitors while restricting booking
records to the signed-in customer who created them.

## 1. New tables
- `service_categories`
  - `id`: stable UUID identifier.
  - `slug`: URL-safe service identifier used by booking links.
  - `name`: customer-facing service name.
  - `description`: short service explanation.
  - `kind`: conditional form type (`driver`, `home`, or `companionship`).
  - `active`: controls whether the service can be booked.
  - `created_at`, `updated_at`: audit timestamps.
- `bookings`
  - `id`: stable UUID identifier.
  - `user_id`: authenticated customer owner, filled from the session.
  - `service_id`: selected active service.
  - `location`: primary service or meeting address.
  - `scheduled_date`, `start_time`, `duration_hours`: requested schedule.
  - `details`: validated service-specific details stored as JSON.
  - `status`: server-controlled booking lifecycle state.
  - `created_at`, `updated_at`: audit timestamps.

## 2. Security
- Row-level security is enabled on every new table.
- Anyone may read active service categories; only authenticated users can read their own bookings.
- Booking creation and cancellation use SECURITY DEFINER functions that verify the caller,
  active service, date, duration, and current booking state on the database server.
- Direct booking inserts, updates, and deletes are revoked from authenticated clients so
  users cannot forge status, ownership, or other protected fields.

## 3. Important notes
1. Email/password authentication is used by the frontend and relies on Supabase Auth.
2. Booking requests are stored as `requested`; provider matching and payments remain a later phase.
3. No destructive operations are performed by this migration.
*/

CREATE TABLE IF NOT EXISTS public.service_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('driver', 'home', 'companionship')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.service_categories(id),
  location text NOT NULL CHECK (char_length(btrim(location)) BETWEEN 3 AND 500),
  scheduled_date date NOT NULL,
  start_time time NOT NULL,
  duration_hours integer NOT NULL CHECK (duration_hours BETWEEN 1 AND 24),
  details jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(details) = 'object'),
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'confirmed', 'cancelled', 'completed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bookings_user_created_idx ON public.bookings (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS bookings_schedule_idx ON public.bookings (scheduled_date, start_time);
CREATE INDEX IF NOT EXISTS service_categories_active_idx ON public.service_categories (active, name);

ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active services" ON public.service_categories;
CREATE POLICY "Anyone can view active services"
ON public.service_categories FOR SELECT
TO anon, authenticated
USING (active = true);

DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
CREATE POLICY "Users can view own bookings"
ON public.bookings FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own bookings" ON public.bookings;
CREATE POLICY "Users can insert own bookings"
ON public.bookings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;
CREATE POLICY "Users can update own bookings"
ON public.bookings FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own bookings" ON public.bookings;
CREATE POLICY "Users can delete own bookings"
ON public.bookings FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

REVOKE INSERT, UPDATE, DELETE ON public.bookings FROM authenticated;
GRANT SELECT ON public.bookings TO authenticated;
GRANT SELECT ON public.service_categories TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_booking(
  p_service_id uuid,
  p_location text,
  p_scheduled_date date,
  p_start_time time,
  p_duration_hours integer,
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.service_categories
    WHERE id = p_service_id AND active = true
  ) THEN
    RAISE EXCEPTION 'Service unavailable';
  END IF;

  IF p_scheduled_date < current_date THEN
    RAISE EXCEPTION 'Booking date must be today or later';
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

  INSERT INTO public.bookings (
    user_id, service_id, location, scheduled_date, start_time, duration_hours, details
  ) VALUES (
    auth.uid(), p_service_id, btrim(p_location), p_scheduled_date, p_start_time, p_duration_hours, p_details
  )
  RETURNING id INTO v_booking_id;

  RETURN v_booking_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_booking(p_booking_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  UPDATE public.bookings
  SET status = 'cancelled', updated_at = now()
  WHERE id = p_booking_id
    AND user_id = auth.uid()
    AND status IN ('requested', 'confirmed');

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated = 1;
END;
$$;

REVOKE ALL ON FUNCTION public.create_booking(uuid, text, date, time, integer, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_booking(uuid, text, date, time, integer, jsonb) TO authenticated;
REVOKE ALL ON FUNCTION public.cancel_booking(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_booking(uuid) TO authenticated;

INSERT INTO public.service_categories (slug, name, description, kind)
VALUES
  ('personal-driver', 'Personal Driver', 'A professional drives your own vehicle by the hour.', 'driver'),
  ('home-plumbing', 'Home Plumbing', 'Plumbing repairs, leak fixes, and household plumbing tasks.', 'home'),
  ('electrical-repair', 'Electrical Repair', 'Electrical troubleshooting and eligible repair services.', 'home'),
  ('appliance-maintenance', 'Appliance Maintenance', 'Maintenance and repair assistance for household appliances.', 'home'),
  ('home-assistance', 'Home Assistance', 'Carpentry, painting, cleaning, and household help.', 'home'),
  ('social-companionship', 'Social Companionship', 'Consensual, non-sexual company for public outings.', 'companionship')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  kind = EXCLUDED.kind,
  updated_at = now();
