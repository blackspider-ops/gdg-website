-- Collaborative whiteboards (infinite canvas) for the admin panel.
-- Each board stores a tldraw store snapshot as JSONB. Live collaboration is done
-- via Supabase Realtime on this table (last-write-wins snapshot sync).
--
-- Staged 2026-06-16. Apply via Supabase SQL editor or CLI (db push) — see user_feedback.md.
--
-- RLS note: same as channels — FOR ALL USING (true) + app-layer auth, because the
-- site uses a custom admin session, not Supabase Auth. Access to /admin/whiteboard
-- is permission-gated in-app.

CREATE TABLE IF NOT EXISTS whiteboards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL DEFAULT 'Untitled board',
    document JSONB,
    created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whiteboards_updated ON whiteboards(updated_at DESC);

ALTER TABLE whiteboards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on whiteboards" ON whiteboards;
CREATE POLICY "Allow all on whiteboards" ON whiteboards FOR ALL USING (true);

-- Enable realtime so collaborators see each other's saved changes.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'whiteboards'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE whiteboards;
  END IF;
END $$;
