-- Add scheduling columns to team_announcements
-- These columns support the announcement scheduling feature

-- Add scheduled_for column for future-dated announcements
ALTER TABLE team_announcements 
ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE;

-- Add is_published column to track if announcement is visible
ALTER TABLE team_announcements 
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT TRUE;

-- Create index for efficient querying of scheduled announcements
CREATE INDEX IF NOT EXISTS idx_team_announcements_scheduled 
ON team_announcements(scheduled_for) 
WHERE scheduled_for IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_team_announcements_published 
ON team_announcements(is_published);

-- Update existing announcements to be published
UPDATE team_announcements SET is_published = TRUE WHERE is_published IS NULL;
