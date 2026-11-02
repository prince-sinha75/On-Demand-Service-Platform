/*
# Protect provider moderation fields

Provider profiles contain approval-controlled fields. This migration prevents a provider
from setting approval state or ownership fields during profile creation.

## Security changes
- Authenticated users may insert only display_name, bio, service_area, and is_active.
- user_id defaults from auth.uid(); is_approved defaults to false.
- Direct writes to booking status history are revoked; history remains function-only.
*/

REVOKE INSERT ON public.provider_profiles FROM authenticated;
GRANT INSERT (display_name, bio, service_area, is_active) ON public.provider_profiles TO authenticated;

REVOKE INSERT, UPDATE, DELETE ON public.booking_status_history FROM authenticated;
