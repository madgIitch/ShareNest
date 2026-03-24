-- ============================================================
-- ShareNest - Allow send_offer from invited status
-- 2026-03-24
-- ============================================================

CREATE OR REPLACE FUNCTION public.send_offer(
  p_request_id uuid,
  p_offer_terms jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req requests%ROWTYPE;
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
    RAISE EXCEPTION 'Only owner can send offer';
  END IF;

  IF v_req.status::text NOT IN ('pending', 'invited') THEN
    RAISE EXCEPTION 'Request must be pending/invited to send offer';
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
  SET
    status = 'offered',
    offered_at = now(),
    offer_terms = COALESCE(p_offer_terms, '{}'::jsonb),
    owner_confirmed_at = NULL,
    requester_confirmed_at = NULL
  WHERE id = p_request_id;

  INSERT INTO public.messages (conversation_id, sender_id, content)
  VALUES (
    v_conv_id,
    auth.uid(),
    'Oferta enviada. Revisa los terminos y responde desde el chat.'
  );

  RETURN v_conv_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.send_offer(uuid, jsonb) TO authenticated;
