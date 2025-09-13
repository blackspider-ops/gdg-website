-- Clean up duplicate entries created by name changes
-- This helps identify and remove duplicates

-- Show potential duplicates in team_members (similar names or roles)
SELECT 
    'POTENTIAL TEAM MEMBER DUPLICATES:' as section,
    tm1.name as name1,
    tm1.role as role1,
    tm1.created_at as created1,
    tm2.name as name2,
    tm2.role as role2,
    tm2.created_at as created2
FROM team_members tm1
JOIN team_members tm2 ON (
    tm1.id < tm2.id AND (
        SIMILARITY(tm1.name, tm2.name) > 0.7 OR
        (tm1.role = tm2.role AND tm1.name != tm2.name)
    )
)
ORDER BY tm1.name;

-- Show potential duplicates in members (similar names or emails)
SELECT 
    'POTENTIAL MEMBER DUPLICATES:' as section,
    m1.name as name1,
    m1.email as email1,
    m1.created_at as created1,
    m2.name as name2,
    m2.email as email2,
    m2.created_at as created2
FROM members m1
JOIN members m2 ON (
    m1.id < m2.id AND (
        SIMILARITY(m1.name, m2.name) > 0.7 OR
        m1.email = m2.email
    )
)
ORDER BY m1.name;

-- Show team members without corresponding members
SELECT 
    'ORPHANED TEAM MEMBERS:' as section,
    tm.name,
    tm.role,
    tm.created_at,
    'No corresponding member' as status
FROM team_members tm
LEFT JOIN members m ON LOWER(TRIM(tm.name)) = LOWER(TRIM(m.name)) AND m.is_core_team = TRUE
WHERE m.id IS NULL
ORDER BY tm.created_at DESC;

-- Show recent team members (likely duplicates from name changes)
SELECT 
    'RECENT TEAM MEMBERS (last 24 hours):' as section,
    name,
    role,
    email,
    created_at
FROM team_members 
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- MANUAL CLEANUP COMMANDS (uncomment to use):
-- 
-- Delete the most recent duplicate team member (adjust the name as needed):
-- DELETE FROM team_members 
-- WHERE name = 'NEW_NAME_HERE' 
--   AND created_at >= NOW() - INTERVAL '24 hours';
--
-- Or delete by ID if you know the specific duplicate:
-- DELETE FROM team_members WHERE id = 'DUPLICATE_ID_HERE';