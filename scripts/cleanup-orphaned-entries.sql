-- Clean up orphaned entries between members and team_members tables
-- This script helps identify and optionally clean up inconsistencies

-- Show orphaned team members (team members without corresponding core team members)
SELECT 
    'ORPHANED TEAM MEMBERS (no corresponding core team member):' as section,
    tm.name as team_member_name,
    tm.role,
    tm.email,
    tm.is_active
FROM team_members tm
LEFT JOIN members m ON (
    LOWER(TRIM(tm.name)) = LOWER(TRIM(m.name)) AND m.is_core_team = TRUE
)
WHERE m.id IS NULL
ORDER BY tm.name;

-- Show core team members without team entries
SELECT 
    'CORE TEAM MEMBERS WITHOUT TEAM ENTRIES:' as section,
    m.name as member_name,
    m.category,
    m.email,
    m.is_active
FROM members m
LEFT JOIN team_members tm ON LOWER(TRIM(m.name)) = LOWER(TRIM(tm.name))
WHERE m.is_core_team = TRUE AND tm.id IS NULL
ORDER BY m.name;

-- Count summary
SELECT 
    'SUMMARY:' as info,
    (SELECT COUNT(*) FROM team_members) as total_team_members,
    (SELECT COUNT(*) FROM members WHERE is_core_team = TRUE) as total_core_team_members,
    (SELECT COUNT(*) FROM team_members tm 
     LEFT JOIN members m ON LOWER(TRIM(tm.name)) = LOWER(TRIM(m.name)) AND m.is_core_team = TRUE
     WHERE m.id IS NULL) as orphaned_team_members,
    (SELECT COUNT(*) FROM members m 
     LEFT JOIN team_members tm ON LOWER(TRIM(m.name)) = LOWER(TRIM(tm.name))
     WHERE m.is_core_team = TRUE AND tm.id IS NULL) as core_members_without_team;

-- OPTIONAL: Uncomment the following sections to actually clean up orphaned entries

-- Option 1: Remove orphaned team members (team members without corresponding core team members)
-- DELETE FROM team_members 
-- WHERE id IN (
--     SELECT tm.id 
--     FROM team_members tm
--     LEFT JOIN members m ON (
--         LOWER(TRIM(tm.name)) = LOWER(TRIM(m.name)) AND m.is_core_team = TRUE
--     )
--     WHERE m.id IS NULL
-- );

-- Option 2: Create team entries for core team members without them
-- INSERT INTO team_members (name, role, email, bio, order_index, is_active, created_at, updated_at)
-- SELECT 
--     m.name,
--     CASE m.category
--         WHEN 'founder' THEN 'Chapter Lead'
--         WHEN 'organizer' THEN 'Organizer'
--         WHEN 'lead' THEN 'Team Lead'
--         ELSE 'Team Member'
--     END as role,
--     m.email,
--     COALESCE(m.major || ' - ' || m.year, m.major || ' student', 'Team member') as bio,
--     999 as order_index,
--     m.is_active,
--     NOW(),
--     NOW()
-- FROM members m
-- LEFT JOIN team_members tm ON LOWER(TRIM(m.name)) = LOWER(TRIM(tm.name))
-- WHERE m.is_core_team = TRUE AND tm.id IS NULL;

-- Option 3: Remove core team status from members without team entries
-- UPDATE members 
-- SET is_core_team = FALSE, updated_at = NOW()
-- WHERE is_core_team = TRUE 
--   AND id NOT IN (
--       SELECT m.id 
--       FROM members m
--       JOIN team_members tm ON LOWER(TRIM(m.name)) = LOWER(TRIM(tm.name))
--       WHERE m.is_core_team = TRUE
--   );