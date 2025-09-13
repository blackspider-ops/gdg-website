-- Manual sync script for team members to members table
-- Run this if you have existing team members that aren't showing in members section

-- Step 1: Check current state
SELECT 
    'Current team members count:' as info,
    COUNT(*) as count
FROM team_members;

SELECT 
    'Current members marked as core team:' as info,
    COUNT(*) as count
FROM members 
WHERE is_core_team = TRUE;

-- Step 2: Show team members that need syncing
SELECT 
    'Team members missing from members table:' as info,
    tm.name,
    tm.role,
    tm.email,
    tm.is_active
FROM team_members tm
LEFT JOIN members m ON (
    LOWER(TRIM(tm.name)) = LOWER(TRIM(m.name)) OR
    (tm.email IS NOT NULL AND tm.email = m.email)
)
WHERE m.id IS NULL
ORDER BY tm.name;

-- Step 3: Create the missing member entries
-- This handles various edge cases like name variations and email matching
WITH team_to_sync AS (
    SELECT 
        tm.id as team_id,
        tm.name,
        tm.role,
        tm.email,
        tm.is_active,
        tm.created_at as team_created_at
    FROM team_members tm
    LEFT JOIN members m ON (
        LOWER(TRIM(tm.name)) = LOWER(TRIM(m.name)) OR
        (tm.email IS NOT NULL AND tm.email = m.email)
    )
    WHERE m.id IS NULL
)
INSERT INTO members (
    name,
    email,
    phone,
    year,
    major,
    category,
    interests,
    is_active,
    is_core_team,
    join_date,
    last_active,
    created_at,
    updated_at
)
SELECT 
    name,
    CASE 
        WHEN email IS NOT NULL AND email != '' THEN email
        ELSE LOWER(REPLACE(REPLACE(name, ' ', '.'), '''', '')) || '@team.placeholder.com'
    END as email,
    '' as phone,
    '' as year,
    '' as major,
    CASE 
        WHEN role ILIKE '%lead%' OR role ILIKE '%president%' OR role ILIKE '%founder%' THEN 'founder'
        WHEN role ILIKE '%organizer%' OR role ILIKE '%coordinator%' OR role ILIKE '%manager%' THEN 'organizer'
        WHEN role ILIKE '%technical%' OR role ILIKE '%marketing%' OR role ILIKE '%design%' THEN 'lead'
        WHEN role ILIKE '%mentor%' OR role ILIKE '%advisor%' THEN 'lead'
        ELSE 'active'
    END as category,
    '{}' as interests,
    is_active,
    TRUE as is_core_team,
    COALESCE(team_created_at, NOW()) as join_date,
    NOW() as last_active,
    NOW() as created_at,
    NOW() as updated_at
FROM team_to_sync;

-- Step 4: Verify the sync worked
SELECT 
    'After sync - team members still missing from members:' as info,
    COUNT(*) as count
FROM team_members tm
LEFT JOIN members m ON (
    LOWER(TRIM(tm.name)) = LOWER(TRIM(m.name)) OR
    (tm.email IS NOT NULL AND tm.email = m.email)
)
WHERE m.id IS NULL;

-- Step 5: Show final results
SELECT 
    'Final count - members marked as core team:' as info,
    COUNT(*) as count
FROM members 
WHERE is_core_team = TRUE;

-- Step 6: Show the sync mapping
SELECT 
    'SYNC RESULTS:' as section,
    tm.name as team_member_name,
    tm.role as team_role,
    m.name as member_name,
    m.category as member_category,
    m.email as member_email,
    m.is_core_team
FROM team_members tm
JOIN members m ON (
    LOWER(TRIM(tm.name)) = LOWER(TRIM(m.name)) OR
    (tm.email IS NOT NULL AND tm.email = m.email)
)
WHERE m.is_core_team = TRUE
ORDER BY tm.name;