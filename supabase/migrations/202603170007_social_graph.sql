-- ─── Sprint 7: Social graph ────────────────────────────────────────────────────

-- 1. Enum
CREATE TYPE connection_status AS ENUM ('pending', 'accepted');

-- 2. Connections table
CREATE TABLE connections (
  id           uuid             PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid             NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  addressee_id uuid             NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status       connection_status NOT NULL DEFAULT 'pending',
  created_at   timestamptz      NOT NULL DEFAULT now(),
  UNIQUE (requester_id, addressee_id),
  CHECK (requester_id <> addressee_id)
);

CREATE INDEX idx_connections_requester ON connections(requester_id);
CREATE INDEX idx_connections_addressee ON connections(addressee_id);
CREATE INDEX idx_connections_status    ON connections(status);

-- 3. RLS
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

-- Both parties can read their own connections
CREATE POLICY "connections_select" ON connections
  FOR SELECT USING (auth.uid() IN (requester_id, addressee_id));

-- Only the requester can create
CREATE POLICY "connections_insert" ON connections
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

-- Only the addressee can update (accept / reject)
CREATE POLICY "connections_update" ON connections
  FOR UPDATE USING (auth.uid() = addressee_id);

-- Either party can remove the connection
CREATE POLICY "connections_delete" ON connections
  FOR DELETE USING (auth.uid() IN (requester_id, addressee_id));

-- 4. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE connections;

-- ─── RPCs ──────────────────────────────────────────────────────────────────────

-- 4a. Mutual friends between two users
CREATE OR REPLACE FUNCTION get_mutual_friends(p_user_a uuid, p_user_b uuid)
RETURNS TABLE(
  id          uuid,
  full_name   text,
  avatar_url  text,
  username    text,
  verified_at timestamptz
)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  WITH friends_a AS (
    SELECT CASE WHEN requester_id = p_user_a THEN addressee_id ELSE requester_id END AS friend_id
    FROM connections
    WHERE (requester_id = p_user_a OR addressee_id = p_user_a) AND status = 'accepted'
  ),
  friends_b AS (
    SELECT CASE WHEN requester_id = p_user_b THEN addressee_id ELSE requester_id END AS friend_id
    FROM connections
    WHERE (requester_id = p_user_b OR addressee_id = p_user_b) AND status = 'accepted'
  ),
  mutual AS (
    SELECT fa.friend_id
    FROM friends_a fa
    INNER JOIN friends_b fb ON fa.friend_id = fb.friend_id
    WHERE fa.friend_id <> p_user_a AND fa.friend_id <> p_user_b
  )
  SELECT p.id, p.full_name, p.avatar_url, p.username, p.verified_at
  FROM profiles p
  INNER JOIN mutual m ON p.id = m.friend_id;
$$;

-- 4b. Connection degree: 1 = direct friend, 2 = friend-of-friend, NULL = no link
CREATE OR REPLACE FUNCTION get_connection_degree(p_viewer uuid, p_target uuid)
RETURNS int LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT CASE
    WHEN EXISTS (
      SELECT 1 FROM connections
      WHERE ((requester_id = p_viewer AND addressee_id = p_target)
          OR (requester_id = p_target AND addressee_id = p_viewer))
        AND status = 'accepted'
    ) THEN 1
    WHEN EXISTS (
      SELECT 1
      FROM connections c1
      JOIN connections c2 ON (
        CASE WHEN c1.requester_id = p_viewer THEN c1.addressee_id ELSE c1.requester_id END =
        CASE WHEN c2.requester_id = p_target THEN c2.addressee_id ELSE c2.requester_id END
      )
      WHERE (c1.requester_id = p_viewer OR c1.addressee_id = p_viewer) AND c1.status = 'accepted'
        AND (c2.requester_id = p_target OR c2.addressee_id = p_target) AND c2.status = 'accepted'
    ) THEN 2
    ELSE NULL
  END;
$$;

-- 4c. Search users by name / username (excludes self)
CREATE OR REPLACE FUNCTION search_users(p_query text, p_limit int DEFAULT 20)
RETURNS TABLE(
  id          uuid,
  full_name   text,
  avatar_url  text,
  username    text,
  verified_at timestamptz,
  city        text
)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT p.id, p.full_name, p.avatar_url, p.username, p.verified_at, p.city
  FROM profiles p
  WHERE p.id <> auth.uid()
    AND (
      p.full_name ILIKE '%' || p_query || '%'
      OR p.username ILIKE '%' || p_query || '%'
    )
  ORDER BY p.full_name
  LIMIT p_limit;
$$;
