-- Public media gallery support: associate media with events and let the public
-- read files explicitly marked is_public.
--
-- Staged 2026-06-16. Apply via Supabase SQL editor or CLI (db push) — see user_feedback.md.
--
-- The `media` storage bucket is already public (URLs go through /api/media). This
-- migration only opens row-level READ on the media_files metadata table for public
-- files, and adds an optional event association so the gallery can group photos
-- into per-event albums.

ALTER TABLE media_files ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_media_files_event ON media_files(event_id);
CREATE INDEX IF NOT EXISTS idx_media_files_public ON media_files(is_public) WHERE is_public = true;

-- Allow anyone (including anonymous visitors) to read public media metadata.
-- Admin-only management policies from 012_create_media_system.sql remain in force
-- for INSERT/UPDATE/DELETE.
DROP POLICY IF EXISTS "Public can view public media" ON media_files;
CREATE POLICY "Public can view public media" ON media_files
  FOR SELECT
  USING (is_public = true);
