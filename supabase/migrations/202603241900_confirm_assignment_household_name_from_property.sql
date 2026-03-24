-- ============================================================
-- ShareNest - confirm_assignment uses property name/address
-- 2026-03-24
-- ============================================================

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

    INSERT INTO public.messages (conversation_id, sender_id, content)
    VALUES (
      v_conv_id,
      auth.uid(),
      'Asignacion completada. Household creado y anuncio marcado como alquilado.'
    );
  ELSE
    INSERT INTO public.messages (conversation_id, sender_id, content)
    VALUES (
      v_conv_id,
      auth.uid(),
      'Confirmacion registrada. Falta la confirmacion de la otra parte.'
    );
  END IF;

  RETURN QUERY SELECT v_conv_id, v_household_id, v_completed;
END;
$$;

GRANT EXECUTE ON FUNCTION public.confirm_assignment(uuid) TO authenticated;

