-- ============================================================
-- ShareNest - Accept chat without creating offer
-- 2026-03-24
-- ============================================================

CREATE OR REPLACE FUNCTION public.accept_request_chat(
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

  IF auth.uid() <> v_req.owner_id THEN
    RAISE EXCEPTION 'Only owner can accept chat';
  END IF;

  IF v_req.status::text <> 'pending' THEN
    RAISE EXCEPTION 'Request must be pending to accept chat';
  END IF;

  SELECT id
    INTO v_conv_id
  FROM public.conversations
  WHERE request_id = p_request_id
  LIMIT 1;

  IF v_conv_id IS NULL THEN
    INSERT INTO public.conversations (listing_id, request_id, participant_a, participant_b)
    VALUES (v_req.listing_id, v_req.id, v_req.owner_id, v_req.requester_id)
    RETURNING id INTO v_conv_id;
  END IF;

  UPDATE public.requests
  SET status = 'invited'
  WHERE id = p_request_id;

  INSERT INTO public.messages (conversation_id, sender_id, content)
  VALUES (
    v_conv_id,
    auth.uid(),
    'Chat aceptado. Podemos hablar antes de enviar una oferta formal.'
  );

  RETURN v_conv_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_request_chat(uuid) TO authenticated;
