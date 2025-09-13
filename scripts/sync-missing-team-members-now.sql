-- Sync the missing team members to Member Management
-- Based on the screenshot, these team members are missing from members table

-- First, let's see exactly what's missing
SELECT 
    'Team members NOT in Member Management:' as status,
    tm.name as team_name,
    tm.role,
    tm.email
FROM team_members tm
LEFT JOIN members m ON LOWER(TRIM(tm.name)) = LOWER(TRIM(m.name))
WHERE m.id IS NULL
ORDER BY tm.name;

-- Insert the missing team members as core team members
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
    tm.name,
    COALESCE(tm.email, LOWER(REPLACE(tm.name, ' ', '.')) || '@team.placeholder.com') as email,
    '' as phone,
    CASE 
        WHEN tm.bio ILIKE '%junior%' THEN 'Junior'
        WHEN tm.bio ILIKE '%senior%' THEN 'Senior'
        WHEN tm.bio ILIKE '%sophomore%' THEN 'Sophomore'
        WHEN tm.bio ILIKE '%graduate%' THEN 'Graduate'
        ELSE ''
    END as year,
    CASE 
        WHEN tm.bio ILIKE '%computer science%' THEN 'Computer Science'
        WHEN tm.bio ILIKE '%information sciences%' THEN 'Information Sciences'
        WHEN tm.bio ILIKE '%data science%' THEN 'Data Science'
        ELSE ''
    END as major,
    CASE tm.role
        WHEN 'Chapter Lead' THEN 'founder'
        WHEN 'Co-Organizer / Vice Lead' THEN 'organizer'
        WHEN 'Faculty Advisor' THEN 'organizer'
        WHEN 'Team Lead' THEN 'lead'
        WHEN 'Team Member' THEN 'active'
        ELSE 'active'
    END as category,
    '{}' as interests,
    tm.is_active,
    TRUE as is_core_team,
    tm.created_at as join_date,
    NOW() as last_active,
    NOW() as created_at,
    NOW() as updated_at
FROM team_members tm
LEFT JOIN members m ON LOWER(TRIM(tm.name)) = LOWER(TRIM(m.name))
WHERE m.id IS NULL;

-- Show the results
SELECT 
    'After sync - Members count:' as status,
    COUNT(*) as count
FROM members;

SELECT 
    'After sync - Core team members:' as status,
    COUNT(*) as count
FROM members 
WHERE is_core_team = TRUE;

-- Show the newly created members
SELECT 
    'NEWLY SYNCED MEMBERS:' as section,
    name,
    category,
    email,
    is_core_team
FROM members 
WHERE created_at >= NOW() - INTERVAL '5 minutes'
ORDER BY name;