-- ============================================================
-- ShareNest - Guardrail: free users can own only one property
-- 2026-03-23
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

DROP TRIGGER IF EXISTS trg_enforce_free_one_property ON public.properties;

CREATE TRIGGER trg_enforce_free_one_property
BEFORE INSERT ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.fn_enforce_free_one_property();

