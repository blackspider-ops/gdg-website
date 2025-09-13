-- Add linking columns to track relationships between members and team_members
-- This will help handle name changes and maintain sync integrity

-- Add member_id to team_members table to track the relationship
ALTER TABLE team_members 
ADD COLUMN member_id UUID REFERENCES members(id) ON DELETE SET NULL;

-- Add team_member_id to members table to track the relationship
ALTER TABLE members 
ADD COLUMN team_member_id UUID REFERENCES team_members(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX idx_team_members_member_id ON team_members(member_id);
CREATE INDEX idx_members_team_member_id ON members(team_member_id);

-- Add comments for documentation
COMMENT ON COLUMN team_members.member_id IS 'Links to corresponding member record for sync';
COMMENT ON COLUMN members.team_member_id IS 'Links to corresponding team member record for sync';

-- Show the updated table structures
SELECT 
    'team_members columns:' as table_info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'team_members' 
ORDER BY ordinal_position;

SELECT 
    'members columns:' as table_info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'members' 
ORDER BY ordinal_position;