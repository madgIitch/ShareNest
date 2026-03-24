-- ============================================================
-- ShareNest - Validate required offer fields in send_offer
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
  v_price numeric;
  v_available_from date;
  v_bills_mode text;
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

  v_price := NULLIF(trim(COALESCE(p_offer_terms ->> 'price', '')), '')::numeric;
  IF v_price IS NULL OR v_price <= 0 THEN
    RAISE EXCEPTION 'Offer price is required and must be greater than 0';
  END IF;

  v_available_from := NULLIF(trim(COALESCE(p_offer_terms ->> 'available_from', '')), '')::date;
  IF v_available_from IS NULL THEN
    RAISE EXCEPTION 'Offer available_from is required';
  END IF;

  v_bills_mode := COALESCE(p_offer_terms ->> 'bills_mode', 'extra');
  IF v_bills_mode NOT IN ('included', 'extra', 'none') THEN
    RAISE EXCEPTION 'Invalid bills_mode';
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
    offer_terms = jsonb_build_object(
      'price', v_price,
      'available_from', v_available_from,
      'min_stay_months', COALESCE(NULLIF(trim(COALESCE(p_offer_terms ->> 'min_stay_months', '')), '')::smallint, NULL),
      'bills_mode', v_bills_mode
    ),
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
