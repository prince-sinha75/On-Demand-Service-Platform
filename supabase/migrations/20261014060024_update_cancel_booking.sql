/*
# Update cancel_booking to delegate to reject_booking

The original cancel_booking function is replaced with a thin wrapper that
calls the new reject_booking function, which also records status history
and handles the provider_id cleanup. This ensures all status changes go
through the same audited path.
*/

CREATE OR REPLACE FUNCTION public.cancel_booking(
  p_booking_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.reject_booking(p_booking_id, 'cancelled');
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_booking(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.cancel_booking(uuid) TO authenticated;
