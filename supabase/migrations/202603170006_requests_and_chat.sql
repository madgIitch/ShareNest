-- ─── Sprint 6: Requests + Conversations + Messages ───────────────────────────

-- ─── 0. Push token on profiles ────────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS push_token text;

-- ─── 1. Enums ─────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE request_status AS ENUM ('pending', 'accepted', 'denied');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── 2. requests ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS requests (
  id           uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id   uuid         NOT NULL REFERENCES listings(id)  ON DELETE CASCADE,
  requester_id uuid         NOT NULL REFERENCES profiles(id)  ON DELETE CASCADE,
  owner_id     uuid         NOT NULL REFERENCES profiles(id)  ON DELETE CASCADE,
  status       request_status NOT NULL DEFAULT 'pending',
  message      text,
  created_at   timestamptz  NOT NULL DEFAULT now(),
  UNIQUE (listing_id, requester_id)   -- one active request per listing per user
);

ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "requests_select" ON requests FOR SELECT
  USING (requester_id = auth.uid() OR owner_id = auth.uid());

CREATE POLICY "requests_insert" ON requests FOR INSERT
  WITH CHECK (
    requester_id = auth.uid()
    AND requester_id != owner_id   -- can't request your own listing
  );

CREATE POLICY "requests_update" ON requests FOR UPDATE
  USING (owner_id = auth.uid());   -- only owner can accept / deny

-- ─── 3. conversations ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id                   uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id           uuid  REFERENCES listings(id)  ON DELETE SET NULL,
  request_id           uuid  UNIQUE REFERENCES requests(id) ON DELETE SET NULL,
  participant_a        uuid  NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  participant_b        uuid  NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_message_at      timestamptz,
  last_message_preview text,
  created_at           timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversations_participant" ON conversations FOR ALL
  USING (participant_a = auth.uid() OR participant_b = auth.uid())
  WITH CHECK (participant_a = auth.uid() OR participant_b = auth.uid());

-- ─── 4. messages ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id              uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid  NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       uuid  NOT NULL REFERENCES profiles(id)      ON DELETE CASCADE,
  content         text  NOT NULL,
  read_at         timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Helper: check if calling user is a participant of the given conversation
CREATE OR REPLACE FUNCTION is_participant(conv_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM conversations
    WHERE id = conv_id
      AND (participant_a = auth.uid() OR participant_b = auth.uid())
  );
$$;

CREATE POLICY "messages_select" ON messages FOR SELECT
  USING (is_participant(conversation_id));

CREATE POLICY "messages_insert" ON messages FOR INSERT
  WITH CHECK (sender_id = auth.uid() AND is_participant(conversation_id));

CREATE POLICY "messages_update_read" ON messages FOR UPDATE
  USING (is_participant(conversation_id))
  WITH CHECK (is_participant(conversation_id));

-- ─── 5. Trigger: keep conversations.last_message_* up-to-date ────────────────
CREATE OR REPLACE FUNCTION fn_sync_conversation_last_message()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE conversations
  SET
    last_message_at      = NEW.created_at,
    last_message_preview = left(NEW.content, 100)
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_conversation_last_message
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION fn_sync_conversation_last_message();

-- ─── 6. Realtime ──────────────────────────────────────────────────────────────
-- Enables postgres_changes events for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE requests;

-- ─── 7. Indexes ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS requests_requester_idx ON requests (requester_id);
CREATE INDEX IF NOT EXISTS requests_owner_idx     ON requests (owner_id);
CREATE INDEX IF NOT EXISTS requests_listing_idx   ON requests (listing_id);
CREATE INDEX IF NOT EXISTS messages_conv_idx      ON messages (conversation_id, created_at);
CREATE INDEX IF NOT EXISTS conversations_a_idx    ON conversations (participant_a);
CREATE INDEX IF NOT EXISTS conversations_b_idx    ON conversations (participant_b);
