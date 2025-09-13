-- Add registration settings to events table
-- This allows admins to control registration types and capacity

-- Add registration type field (external, internal, both)
ALTER TABLE events ADD COLUMN registration_type TEXT DEFAULT 'both' CHECK (registration_type IN ('external', 'internal', 'both'));

-- Add maximum participants field
ALTER TABLE events ADD COLUMN max_participants INTEGER;

-- Add registration enabled flag
ALTER TABLE events ADD COLUMN registration_enabled BOOLEAN DEFAULT TRUE;

-- Create index for better performance
CREATE INDEX idx_events_registration_type ON events(registration_type);
CREATE INDEX idx_events_registration_enabled ON events(registration_enabled);