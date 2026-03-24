-- ============================================================
-- ShareNest - Piso/household schema updates
-- 2026-03-24
-- ============================================================

-- 1) expense_splits: track who confirmed settlement
ALTER TABLE public.expense_splits
  ADD COLUMN IF NOT EXISTS settled_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Backfill existing settled rows where actor is unknown.
-- We assume the split owner confirmed it historically.
UPDATE public.expense_splits
SET settled_by = user_id
WHERE is_settled = true
  AND settled_by IS NULL;

-- Settlement consistency:
-- - settled => both settled_at and settled_by present
-- - not settled => both fields null
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'expense_splits_settlement_consistency_chk'
  ) THEN
    ALTER TABLE public.expense_splits
      ADD CONSTRAINT expense_splits_settlement_consistency_chk
      CHECK (
        (is_settled = true  AND settled_at IS NOT NULL AND settled_by IS NOT NULL) OR
        (is_settled = false AND settled_at IS NULL     AND settled_by IS NULL)
      );
  END IF;
END $$;

DROP POLICY IF EXISTS "member settles own split" ON public.expense_splits;
CREATE POLICY "member settles own split"
  ON public.expense_splits
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND (
      (is_settled = false AND settled_at IS NULL AND settled_by IS NULL) OR
      (is_settled = true  AND settled_at IS NOT NULL AND settled_by = auth.uid())
    )
  );

-- 2) household_members: capture planned departures for free-room banner
ALTER TABLE public.household_members
  ADD COLUMN IF NOT EXISTS leaving_date date,
  ADD COLUMN IF NOT EXISTS leaving_reason text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'household_members_leaving_reason_chk'
  ) THEN
    ALTER TABLE public.household_members
      ADD CONSTRAINT household_members_leaving_reason_chk
      CHECK (leaving_reason IS NULL OR leaving_reason IN ('contract_end', 'manual'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_household_members_leaving_date
  ON public.household_members (household_id, leaving_date)
  WHERE leaving_date IS NOT NULL;
