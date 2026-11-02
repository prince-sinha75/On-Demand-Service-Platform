/*
# Complete provider status access

The provider workflow needs rejected bookings and provider-owned booking visibility.

## Modified tables
- `bookings`
  - Extends the existing status check to include `rejected`.
  - Adds a policy allowing an assigned provider to read their assigned bookings.

## Security
- Assigned providers can read only bookings linked to their own provider profile.
- Providers still cannot directly change booking status or provider assignment.
- Status changes remain restricted to SECURITY DEFINER functions.
*/

ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_status_check
  CHECK (status = ANY (ARRAY['requested'::text, 'confirmed'::text, 'cancelled'::text, 'completed'::text, 'rejected'::text]));

DROP POLICY IF EXISTS "Assigned providers can view bookings" ON public.bookings;
CREATE POLICY "Assigned providers can view bookings" ON public.bookings
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.provider_profiles
      WHERE provider_profiles.id = bookings.provider_id
        AND provider_profiles.user_id = auth.uid()
    )
  );
