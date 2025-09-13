-- Test if sync is working by showing current state
-- This helps debug sync issues

-- Show current members and their team member links
SELECT 
    'MEMBERS WITH TEAM LINKS:' as section,
    m.name as member_name,
    m.category,
    m.is_core_team,
    m.team_member_id,
    tm.name as linked_team_name,
    tm.role as linked_team_role
FROM members m
LEFT JOIN team_members tm ON m.team_member_id = tm.id
WHERE m.is_core_team = TRUE
ORDER BY m.name;

-- Show team members and their member links
SELECT 
    'TEAM MEMBERS WITH MEMBER LINKS:' as section,
    tm.name as team_name,
    tm.role,
    tm.member_id,
    m.name as linked_member_name,
    m.category as linked_member_category
FROM team_members tm
LEFT JOIN members m ON tm.member_id = m.id
ORDER BY tm.name;

-- Show unlinked core team members
SELECT 
    'UNLINKED CORE TEAM MEMBERS:' as section,
    name,
    category,
    email
FROM members 
WHERE is_core_team = TRUE 
  AND (team_member_id IS NULL OR team_member_id = '')
ORDER BY name;

-- Show unlinked team members
SELECT 
    'UNLINKED TEAM MEMBERS:' as section,
    name,
    role,
    email
FROM team_members 
WHERE (member_id IS NULL OR member_id = '')
ORDER BY name;

-- Summary counts
SELECT 
    'SUMMARY:' as info,
    (SELECT COUNT(*) FROM members WHERE is_core_team = TRUE) as core_members,
    (SELECT COUNT(*) FROM team_members) as team_members,
    (SELECT COUNT(*) FROM members WHERE is_core_team = TRUE AND team_member_id IS NOT NULL) as linked_members,
    (SELECT COUNT(*) FROM team_members WHERE member_id IS NOT NULL) as linked_team_members;