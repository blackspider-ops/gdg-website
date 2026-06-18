-- Org-wide communication channels (topic rooms not tied to a single team).
-- Distinct from team_messages (which is per-team). Any admin can see and post to
-- non-archived channels.
--
-- Staged 2026-06-16. Apply via Supabase SQL editor or CLI (db push) — see user_feedback.md.
--
-- NOTE on RLS: like team_messages, these use FOR ALL USING (true) and rely on the
-- application layer (PageAccessGuard + custom admin session) for authorization. The
-- site uses a custom admin auth system, not Supabase Auth, so there is no auth.uid()
-- to gate on at the row level. Access to /admin/channels is permission-gated in-app.

CREATE TABLE IF NOT EXISTS channels (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_channels_archived ON channels(is_archived);

CREATE TABLE IF NOT EXISTS channel_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image', 'link')),
    attachment_url TEXT,
    reply_to_id UUID REFERENCES channel_messages(id) ON DELETE SET NULL,
    is_pinned BOOLEAN DEFAULT FALSE,
    read_by UUID[] DEFAULT '{}',
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_channel_messages_channel ON channel_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_messages_sender ON channel_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_channel_messages_created ON channel_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_channel_messages_pinned ON channel_messages(is_pinned) WHERE is_pinned = true;

ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on channels" ON channels;
CREATE POLICY "Allow all on channels" ON channels FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all on channel_messages" ON channel_messages;
CREATE POLICY "Allow all on channel_messages" ON channel_messages FOR ALL USING (true);

-- Enable realtime so the chat updates live (idempotent guard).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'channel_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE channel_messages;
  END IF;
END $$;

-- Seed a default general channel
INSERT INTO channels (name, description)
SELECT 'general', 'Org-wide general discussion'
WHERE NOT EXISTS (SELECT 1 FROM channels WHERE name = 'general');
