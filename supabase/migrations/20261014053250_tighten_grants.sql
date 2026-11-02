/*
# Clean up stale function grants and table privileges

This migration tightens the security posture by:
1. Revoking EXECUTE on the old create_booking overload (without p_request_key) from all roles.
2. Revoking INSERT, UPDATE, DELETE from anon on service_categories and bookings.
3. Revoking INSERT, UPDATE, DELETE from authenticated on service_categories.

No user data is modified. No tables are dropped or renamed.
*/

REVOKE ALL ON FUNCTION public.create_booking(uuid, text, date, time, integer, jsonb) FROM anon;
REVOKE ALL ON FUNCTION public.create_booking(uuid, text, date, time, integer, jsonb) FROM authenticated;

REVOKE INSERT, UPDATE, DELETE ON public.service_categories FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.service_categories FROM authenticated;

REVOKE INSERT, UPDATE, DELETE ON public.bookings FROM anon;
