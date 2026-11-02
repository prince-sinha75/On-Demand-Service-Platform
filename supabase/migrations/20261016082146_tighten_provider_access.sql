/*
# Tighten provider access

This migration removes inherited public and anonymous privileges from the provider system.

## Security changes
- Revokes table privileges from anon on all provider tables and booking history.
- Removes direct booking UPDATE access from authenticated users; booking changes use secure functions.
- Revokes function EXECUTE from PUBLIC and anon, then grants only authenticated access.
- Provider moderation and booking assignment remain server-controlled.
*/

REVOKE ALL ON public.provider_profiles FROM anon;
REVOKE ALL ON public.provider_services FROM anon;
REVOKE ALL ON public.provider_availability FROM anon;
REVOKE ALL ON public.booking_status_history FROM anon;
REVOKE UPDATE ON public.bookings FROM authenticated;

REVOKE ALL ON FUNCTION public.assign_provider(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_eligible_providers(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reject_booking(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assign_provider(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_eligible_providers(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_booking(uuid, text) TO authenticated;
