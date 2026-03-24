-- ============================================================
-- ShareNest - Fix race condition in free one-property guard
-- 2026-03-24
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_enforce_free_one_property()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_has_active_sub boolean;
  v_current_count integer;
BEGIN
  -- Allow service/admin contexts where auth.uid() may be null.
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Defensive check: only user can create rows for self.
  IF NEW.owner_id <> auth.uid() THEN
    RAISE EXCEPTION 'owner_id must match auth.uid()';
  END IF;

  -- Serialize concurrent inserts per owner_id in this transaction.
  -- This removes the race where two inserts see count=0 simultaneously.
  PERFORM pg_advisory_xact_lock(
    hashtext('free_one_property_guard'),
    hashtext(NEW.owner_id::text)
  );

  SELECT EXISTS (
    SELECT 1
    FROM public.subscriptions s
    WHERE s.user_id = NEW.owner_id
      AND s.status::text = 'active'
      AND (s.expires_at IS NULL OR s.expires_at > now())
  )
  INTO v_has_active_sub;

  IF v_has_active_sub THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*)
  INTO v_current_count
  FROM public.properties p
  WHERE p.owner_id = NEW.owner_id;

  IF v_current_count >= 1 THEN
    RAISE EXCEPTION 'Plan free: solo puedes tener 1 piso como owner';
  END IF;

  RETURN NEW;
END;
$$;

