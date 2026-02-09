-- Add team_section column to members table for custom categorization
-- This allows admins to manually assign members to sections like "Leadership Team", "Advisors", "Active Members", etc.

-- Add the team_section column
ALTER TABLE members ADD COLUMN IF NOT EXISTS team_section TEXT;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_members_team_section ON members(team_section);

-- Update existing members based on their category
-- Map old categories to new sections
UPDATE members SET team_section = CASE
    WHEN category IN ('founder', 'lead') THEN 'Leadership Team'
    WHEN category = 'organizer' THEN 'Advisors'
    WHEN category IN ('active', 'member') THEN 'Active Members'
    WHEN category = 'alumni' THEN 'Alumni'
    ELSE 'Active Members'
END WHERE team_section IS NULL;

-- Set default for new members
ALTER TABLE members ALTER COLUMN team_section SET DEFAULT 'Active Members';

-- Add comment
COMMENT ON COLUMN members.team_section IS 'Custom team section for grouping members on the team page. Can be any value like "Leadership Team", "Advisors", "Active Members", etc.';
