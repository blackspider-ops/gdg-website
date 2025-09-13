-- Check which team members are not in the members table
-- This will help identify team members that need to be synced

-- Show all team members
SELECT 'All Team Members' as section, name, role, email, is_active
FROM team_members 
ORDER BY name;

-- Show team members that don't have corresponding member entries
SELECT 
    'Team Members NOT in Members Table' as section,
    tm.name,
    tm.role,
    tm.email,
    tm.is_active
FROM team_members tm
LEFT JOIN members m ON LOWER(TRIM(tm.name)) = LOWER(TRIM(m.name))
WHERE m.id IS NULL
ORDER BY tm.name;

-- Show members that are marked as core team
SELECT 
    'Members Marked as Core Team' as section,
    m.name,
    m.category,
    m.is_core_team,
    m.email
FROM members m
WHERE m.is_core_team = TRUE
ORDER BY m.name;

-- Show the sync status summary
SELECT 
    COUNT(tm.id) as total_team_members,
    COUNT(m.id) as synced_members,
    COUNT(tm.id) - COUNT(m.id) as unsynced_team_members
FROM team_members tm
LEFT JOIN members m ON LOWER(TRIM(tm.name)) = LOWER(TRIM(m.name));