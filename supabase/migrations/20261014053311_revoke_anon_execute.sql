/*
# Revoke anon execute on booking functions

Explicitly revoke EXECUTE from the anon role on both SECURITY DEFINER functions
so unauthenticated requests cannot call them. Authenticated users retain access
since these are the legitimate booking creation and cancellation entry points.
*/

REVOKE EXECUTE ON FUNCTION public.create_booking(uuid, text, date, time, integer, jsonb, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.cancel_booking(uuid) FROM anon;
