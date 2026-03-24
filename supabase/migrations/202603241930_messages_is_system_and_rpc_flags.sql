-- ============================================================
-- ShareNest - System messages with explicit is_system flag
-- 2026-03-24
-- ============================================================

ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS is_system boolean NOT NULL DEFAULT false;

-- Optional backfill for existing historical system messages.
UPDATE public.messages
SET is_system = true
WHERE is_system = false
  AND (
    lower(content) LIKE 'oferta enviada.%'
    OR lower(content) LIKE 'oferta retirada.%'
    OR lower(content) LIKE 'chat aceptado.%'
    OR lower(content) LIKE 'solicitud rechazada.%'
    OR lower(content) LIKE 'oferta aceptada.%'
    OR lower(content) LIKE 'asignacion completada.%'
    OR lower(content) LIKE 'confirmacion registrada.%'
  );

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

  INSERT INTO public.messages (conversation_id, sender_id, content, is_system)
  VALUES (
    v_conv_id,
    auth.uid(),
    'Chat aceptado. Podemos hablar antes de enviar una oferta formal.',
    true
  );

  RETURN v_conv_id;
END;
$$;

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

  INSERT INTO public.messages (conversation_id, sender_id, content, is_system)
  VALUES (
    v_conv_id,
    auth.uid(),
    'Oferta enviada. Revisa los terminos y responde desde el chat.',
    true
  );

  RETURN v_conv_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_offer(
  p_request_id uuid
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

  IF auth.uid() <> v_req.requester_id THEN
    RAISE EXCEPTION 'Only requester can accept offer';
  END IF;

  IF v_req.status::text <> 'offered' THEN
    RAISE EXCEPTION 'Request must be offered to accept';
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
    status = 'accepted',
    requester_confirmed_at = COALESCE(requester_confirmed_at, now())
  WHERE id = p_request_id;

  INSERT INTO public.messages (conversation_id, sender_id, content, is_system)
  VALUES (
    v_conv_id,
    auth.uid(),
    'Oferta aceptada. Falta la confirmacion final para completar la asignacion.',
    true
  );

  RETURN v_conv_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.deny_request(
  p_request_id uuid
)
RETURNS void
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
    RAISE EXCEPTION 'Only owner can deny request';
  END IF;

  IF v_req.status::text NOT IN ('pending', 'invited', 'offered') THEN
    RAISE EXCEPTION 'Request cannot be denied from current state';
  END IF;

  UPDATE public.requests
  SET status = 'denied'
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
      'Solicitud rechazada.',
      true
    );
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.rollback_offer_to_invited(
  p_request_id uuid,
  p_actor_id uuid DEFAULT null
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req public.requests%ROWTYPE;
  v_conv_id uuid;
  v_actor_id uuid;
BEGIN
  v_actor_id := COALESCE(auth.uid(), p_actor_id);

  IF v_actor_id IS NULL THEN
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

  IF v_actor_id <> v_req.owner_id THEN
    RAISE EXCEPTION 'Only owner can rollback offer';
  END IF;

  IF v_req.status::text <> 'offered' THEN
    RAISE EXCEPTION 'Request must be offered';
  END IF;

  IF v_req.owner_confirmed_at IS NOT NULL OR v_req.requester_confirmed_at IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot rollback a confirmed offer';
  END IF;

  UPDATE public.requests
  SET
    status = 'invited',
    offered_at = null,
    offer_terms = null
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
      v_actor_id,
      'Oferta retirada. Chat aceptado sin oferta formal.',
      true
    );
  END IF;

  RETURN COALESCE(v_conv_id, '00000000-0000-0000-0000-000000000000'::uuid);
END;
$$;

CREATE OR REPLACE FUNCTION public.confirm_assignment(
  p_request_id uuid
)
RETURNS TABLE (
  conversation_id uuid,
  household_id uuid,
  assignment_completed boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req requests%ROWTYPE;
  v_listing listings%ROWTYPE;
  v_conv_id uuid;
  v_household_id uuid;
  v_household_name text;
  v_completed boolean := false;
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

  IF auth.uid() <> v_req.owner_id AND auth.uid() <> v_req.requester_id THEN
    RAISE EXCEPTION 'Only participants can confirm assignment';
  END IF;

  IF v_req.status::text NOT IN ('accepted', 'assigned') THEN
    RAISE EXCEPTION 'Request must be accepted/assigned to confirm';
  END IF;

  SELECT *
    INTO v_listing
  FROM public.listings
  WHERE id = v_req.listing_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not found';
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

  IF auth.uid() = v_req.owner_id THEN
    UPDATE public.requests
    SET owner_confirmed_at = COALESCE(owner_confirmed_at, now())
    WHERE id = p_request_id;
  ELSE
    UPDATE public.requests
    SET requester_confirmed_at = COALESCE(requester_confirmed_at, now())
    WHERE id = p_request_id;
  END IF;

  SELECT *
    INTO v_req
  FROM public.requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF v_req.owner_confirmed_at IS NOT NULL AND v_req.requester_confirmed_at IS NOT NULL THEN
    v_completed := true;

    UPDATE public.requests
    SET status = 'assigned'
    WHERE id = p_request_id;

    UPDATE public.listings
    SET status = 'rented'
    WHERE id = v_req.listing_id;

    UPDATE public.requests
    SET status = 'denied'
    WHERE listing_id = v_req.listing_id
      AND id <> v_req.id
      AND status::text IN ('pending', 'invited', 'offered');

    SELECT h.id
      INTO v_household_id
    FROM public.households h
    WHERE h.listing_id = v_req.listing_id
    ORDER BY h.created_at ASC
    LIMIT 1
    FOR UPDATE;

    IF v_household_id IS NULL THEN
      SELECT COALESCE(
        NULLIF(BTRIM(p.name), ''),
        NULLIF(BTRIM(p.address), ''),
        'Mi piso'
      )
      INTO v_household_name
      FROM public.properties p
      WHERE p.id = v_listing.property_id
      LIMIT 1;

      IF v_household_name IS NULL OR BTRIM(v_household_name) = '' THEN
        v_household_name := 'Mi piso';
      END IF;

      INSERT INTO public.households (listing_id, name, created_by)
      VALUES (
        v_req.listing_id,
        v_household_name,
        v_req.owner_id
      )
      RETURNING id INTO v_household_id;
    END IF;

    INSERT INTO public.household_members (household_id, user_id, role)
    VALUES
      (v_household_id, v_req.owner_id, 'admin'),
      (v_household_id, v_req.requester_id, 'member')
    ON CONFLICT (household_id, user_id) DO NOTHING;

    UPDATE public.properties
    SET household_id = v_household_id
    WHERE id = v_listing.property_id
      AND (household_id IS NULL OR household_id = v_household_id);

    INSERT INTO public.messages (conversation_id, sender_id, content, is_system)
    VALUES (
      v_conv_id,
      auth.uid(),
      'Asignacion completada. Household creado y anuncio marcado como alquilado.',
      true
    );
  ELSE
    INSERT INTO public.messages (conversation_id, sender_id, content, is_system)
    VALUES (
      v_conv_id,
      auth.uid(),
      'Confirmacion registrada. Falta la confirmacion de la otra parte.',
      true
    );
  END IF;

  RETURN QUERY SELECT v_conv_id, v_household_id, v_completed;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_request_chat(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_offer(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_offer(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deny_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rollback_offer_to_invited(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.confirm_assignment(uuid) TO authenticated;

