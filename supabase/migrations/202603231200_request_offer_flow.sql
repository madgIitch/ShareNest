-- ============================================================
-- ShareNest - Request offer flow (pending -> offered -> accepted -> assigned)
-- 2026-03-23
-- ============================================================

-- 1) Request status evolution
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'request_status') THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'request_status' AND e.enumlabel = 'offered'
    ) THEN
      ALTER TYPE public.request_status ADD VALUE 'offered';
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'request_status' AND e.enumlabel = 'assigned'
    ) THEN
      ALTER TYPE public.request_status ADD VALUE 'assigned';
    END IF;
  ELSE
    ALTER TABLE public.requests
      DROP CONSTRAINT IF EXISTS requests_status_check;

    ALTER TABLE public.requests
      ADD CONSTRAINT requests_status_check
        CHECK (status IN ('pending', 'invited', 'offered', 'accepted', 'assigned', 'denied'));
  END IF;
END
$$;

-- 2) Requests columns for formal offer + double confirmation
ALTER TABLE public.requests
  ADD COLUMN IF NOT EXISTS offered_at timestamptz,
  ADD COLUMN IF NOT EXISTS offer_terms jsonb,
  ADD COLUMN IF NOT EXISTS requester_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS owner_confirmed_at timestamptz;

-- 3) Active slots view (only pending/invited consume a free slot)
CREATE OR REPLACE VIEW public.active_requests_count AS
  SELECT
    requester_id,
    COUNT(*) AS active_count
  FROM public.requests
  WHERE status::text IN ('pending', 'invited')
  GROUP BY requester_id;

-- 4) Indexes for request lifecycle queries
CREATE INDEX IF NOT EXISTS requests_status_idx ON public.requests (status);
CREATE INDEX IF NOT EXISTS requests_listing_status_idx ON public.requests (listing_id, status);

-- 5) Lock down direct client updates to requests: all state transitions go through RPC
DROP POLICY IF EXISTS "requests_update" ON public.requests;
DROP POLICY IF EXISTS "requests_no_direct_update" ON public.requests;
CREATE POLICY "requests_no_direct_update"
  ON public.requests
  FOR UPDATE
  USING (false)
  WITH CHECK (false);

-- 6) RPC: send_offer (owner -> offered)
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
  v_status_offered text := 'offered';
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

  IF v_req.status::text <> 'pending' THEN
    RAISE EXCEPTION 'Request must be pending to send offer';
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
    status = v_status_offered,
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

-- 7) RPC: accept_offer (requester -> accepted + requester confirmation)
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
  v_status_accepted text := 'accepted';
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
    status = v_status_accepted,
    requester_confirmed_at = COALESCE(requester_confirmed_at, now())
  WHERE id = p_request_id;

  INSERT INTO public.messages (conversation_id, sender_id, content)
  VALUES (
    v_conv_id,
    auth.uid(),
    'Oferta aceptada. Falta la confirmacion final para completar la asignacion.'
  );

  RETURN v_conv_id;
END;
$$;

-- 8) RPC: deny_request (owner -> denied)
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
  v_status_denied text := 'denied';
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
  SET status = v_status_denied
  WHERE id = p_request_id;

  SELECT id
    INTO v_conv_id
  FROM public.conversations
  WHERE request_id = p_request_id
  LIMIT 1;

  IF v_conv_id IS NOT NULL THEN
    INSERT INTO public.messages (conversation_id, sender_id, content)
    VALUES (
      v_conv_id,
      auth.uid(),
      'Solicitud rechazada.'
    );
  END IF;
END;
$$;

-- 9) RPC: confirm_assignment (owner/requester, closes flow when both confirmed)
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
  v_status_assigned text := 'assigned';
  v_status_rented text := 'rented';
  v_status_denied text := 'denied';
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
    SET status = v_status_assigned
    WHERE id = p_request_id;

    UPDATE public.listings
    SET status = v_status_rented
    WHERE id = v_req.listing_id;

    UPDATE public.requests
    SET status = v_status_denied
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
      INSERT INTO public.households (listing_id, name, created_by)
      VALUES (
        v_req.listing_id,
        'Piso en listing ' || v_req.listing_id::text,
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

GRANT EXECUTE ON FUNCTION public.send_offer(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_offer(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deny_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_assignment(uuid) TO authenticated;

