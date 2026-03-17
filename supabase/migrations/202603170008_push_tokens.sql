-- ─── Sprint 8: Push tokens + notification preferences ─────────────────────────

-- 1. Push tokens table (replaces profiles.push_token)
CREATE TABLE push_tokens (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token      text        NOT NULL,
  platform   text        NOT NULL CHECK (platform IN ('ios', 'android')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, token)
);

CREATE INDEX idx_push_tokens_user ON push_tokens(user_id);

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_tokens_own" ON push_tokens
  FOR ALL USING (auth.uid() = user_id);

-- 2. Notification preferences on profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS notif_messages boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notif_requests boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notif_friendz  boolean NOT NULL DEFAULT true;
