-- Add external_attendees column to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS external_attendees INTEGER DEFAULT 0;

-- Update existing events to have 0 external attendees
UPDATE events SET external_attendees = 0 WHERE external_attendees IS NULL;