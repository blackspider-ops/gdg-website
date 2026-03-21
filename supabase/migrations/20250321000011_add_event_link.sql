-- Add event_link column to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_link TEXT;

COMMENT ON COLUMN events.event_link IS 'External link/website for the event';
