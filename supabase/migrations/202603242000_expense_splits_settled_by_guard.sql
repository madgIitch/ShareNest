-- ============================================================
-- ShareNest - Harden expense_splits settled_by integrity
-- 2026-03-24
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_guard_expense_split_settlement()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_household_id uuid;
BEGIN
  -- Apply only to settled rows; consistency for nulls is enforced by existing CHECK.
  IF NEW.is_settled THEN
    IF NEW.settled_by IS NULL OR NEW.settled_at IS NULL THEN
      RAISE EXCEPTION 'Settled split must include settled_by and settled_at';
    END IF;

    -- In authenticated client context, actor must match settled_by.
    -- service_role/admin contexts may have auth.uid() = null and are allowed.
    IF auth.uid() IS NOT NULL AND NEW.settled_by <> auth.uid() THEN
      RAISE EXCEPTION 'settled_by must match auth.uid()';
    END IF;

    SELECT e.household_id
      INTO v_household_id
    FROM public.expenses e
    WHERE e.id = NEW.expense_id;

    IF v_household_id IS NULL THEN
      RAISE EXCEPTION 'Expense not found for split';
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM public.household_members hm
      WHERE hm.household_id = v_household_id
        AND hm.user_id = NEW.settled_by
    ) THEN
      RAISE EXCEPTION 'settled_by must be a member of the household';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_expense_split_settlement ON public.expense_splits;

CREATE TRIGGER trg_guard_expense_split_settlement
BEFORE INSERT OR UPDATE OF is_settled, settled_at, settled_by, expense_id
ON public.expense_splits
FOR EACH ROW
EXECUTE FUNCTION public.fn_guard_expense_split_settlement();

