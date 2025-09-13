-- Establish links between existing members and team members
-- This creates the relationships for existing data

-- First, show current unlinked records
SELECT 
    'Unlinked team members:' as status,
    COUNT(*) as count
FROM team_members 
WHERE member_id IS NULL;

SELECT 
    'Unlinked core team members:' as status,
    COUNT(*) as count
FROM members 
WHERE is_core_team = TRUE AND team_member_id IS NULL;

-- Update team_members with member_id for matching names
UPDATE team_members 
SET member_id = members.id
FROM members 
WHERE LOWER(TRIM(team_members.name)) = LOWER(TRIM(members.name))
  AND members.is_core_team = TRUE
  AND team_members.member_id IS NULL;

-- Update members with team_member_id for matching names
UPDATE members 
SET team_member_id = team_members.id
FROM team_members 
WHERE LOWER(TRIM(members.name)) = LOWER(TRIM(team_members.name))
  AND members.is_core_team = TRUE
  AND members.team_member_id IS NULL;

-- Show results after linking
SELECT 
    'After linking - Unlinked team members:' as status,
    COUNT(*) as count
FROM team_members 
WHERE member_id IS NULL;

SELECT 
    'After linking - Unlinked core team members:' as status,
    COUNT(*) as count
FROM members 
WHERE is_core_team = TRUE AND team_member_id IS NULL;

-- Show the established links
SELECT 
    'ESTABLISHED LINKS:' as section,
    m.name as member_name,
    m.category,
    tm.name as team_name,
    tm.role
FROM members m
JOIN team_members tm ON m.team_member_id = tm.id
WHERE m.is_core_team = TRUE
ORDER BY m.name;