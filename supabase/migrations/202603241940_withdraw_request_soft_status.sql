-- ============================================================
-- ShareNest - Withdraw request as soft status (no DELETE)
-- 2026-03-24
-- ============================================================

CREATE OR REPLACE FUNCTION public.withdraw_request(
  p_request_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req public.requests%ROWTYPE;
  v_conv_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT *
    INTO v_req
  FROM public.requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  IF auth.uid() <> v_req.requester_id THEN
    RAISE EXCEPTION 'Only requester can withdraw request';
  END IF;

  IF v_req.status::text NOT IN ('pending', 'invited', 'offered') THEN
    RAISE EXCEPTION 'Request cannot be withdrawn from current state';
  END IF;

  UPDATE public.requests
  SET
    status = 'denied'
  WHERE id = p_request_id;

  SELECT id
    INTO v_conv_id
  FROM public.conversations
  WHERE request_id = p_request_id
  LIMIT 1;

  IF v_conv_id IS NOT NULL THEN
    INSERT INTO public.messages (conversation_id, sender_id, content, is_system)
    VALUES (
      v_conv_id,
      auth.uid(),
      'Solicitud retirada por el buscador.',
      true
    );
  END IF;

  RETURN COALESCE(v_conv_id, '00000000-0000-0000-0000-000000000000'::uuid);
END;
$$;

REVOKE ALL ON FUNCTION public.withdraw_request(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.withdraw_request(uuid) TO authenticated, service_role;

