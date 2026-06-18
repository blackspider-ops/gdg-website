-- Add event columns referenced by the app but missing from the tracked schema.
--
-- The frontend (AdminEvents create/update payload and the Events / EventDetailsModal
-- read paths) uses these fields via `(event as any).x`. Several were never present in
-- migration files. Some may already exist in the live DB (added manually); every
-- statement uses IF NOT EXISTS so this migration is safe to run regardless.
--
-- Staged 2026-06-16. Apply via Supabase SQL editor or CLI (db push) — see user_feedback.md.

-- Write-path fields (sent by AdminEvents on create/update)
ALTER TABLE events ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'Workshop';
ALTER TABLE events ADD COLUMN IF NOT EXISTS google_form_url TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS google_event_url TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS registration_type TEXT DEFAULT 'both';
ALTER TABLE events ADD COLUMN IF NOT EXISTS max_participants INTEGER;
ALTER TABLE events ADD COLUMN IF NOT EXISTS registration_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/New_York';

-- Read-path detail fields (shown on the event details modal)
ALTER TABLE events ADD COLUMN IF NOT EXISTS time TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS room TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS prerequisites TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS what_youll_learn TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS what_to_bring TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS schedule TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS additional_info TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS contact_info TEXT;
