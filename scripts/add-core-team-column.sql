-- Add is_core_team column to members table
-- This allows tracking which members are part of the core organizing team

-- Add the column with default value false
ALTER TABLE members 
ADD COLUMN is_core_team BOOLEAN DEFAULT FALSE;

-- Update existing members based on their category
-- Founders, organizers, and leads are typically core team members
UPDATE members 
SET is_core_team = TRUE 
WHERE category IN ('founder', 'organizer', 'lead');

-- Add comment for documentation
COMMENT ON COLUMN members.is_core_team IS 'Indicates if the member is part of the core organizing team';

-- Create index for better query performance
CREATE INDEX idx_members_is_core_team ON members(is_core_team);

-- Verify the changes
SELECT 
    category,
    is_core_team,
    COUNT(*) as count
FROM members 
GROUP BY category, is_core_team 
ORDER BY category, is_core_team;