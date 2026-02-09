-- Add team_section column to team_members table for custom categorization
-- This allows admins to manually assign team members to sections

-- Add the team_section column
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS team_section TEXT;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_team_members_team_section ON team_members(team_section);

-- Update existing team members based on their role
-- Map roles to sections
UPDATE team_members SET team_section = CASE
    WHEN role ILIKE '%lead%' OR role ILIKE '%president%' OR role ILIKE '%chair%' THEN 'Leadership Team'
    WHEN role ILIKE '%advisor%' OR role ILIKE '%mentor%' OR role ILIKE '%faculty%' THEN 'Advisors'
    WHEN role ILIKE '%alumni%' THEN 'Alumni'
    ELSE 'Active Members'
END WHERE team_section IS NULL;

-- Set default for new team members
ALTER TABLE team_members ALTER COLUMN team_section SET DEFAULT 'Active Members';

-- Add comment
COMMENT ON COLUMN team_members.team_section IS 'Custom team section for grouping members on the team page. Can be any value like "Leadership Team", "Advisors", "Active Members", etc.';
