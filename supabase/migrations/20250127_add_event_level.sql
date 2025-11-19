-- Add level column to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS level VARCHAR(20) 
CHECK (level IN ('beginner', 'intermediate', 'advanced', 'open_for_all')) 
DEFAULT 'open_for_all';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_events_level ON events(level);

-- Update existing events to have default level
UPDATE events SET level = 'open_for_all' WHERE level IS NULL;