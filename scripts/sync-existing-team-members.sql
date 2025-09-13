-- Sync existing team members to members table
-- This creates member entries for team members that don't have corresponding member records

-- First, let's see what we're working with
SELECT 
    'BEFORE SYNC - Team members without member entries:' as status,
    COUNT(*) as count
FROM team_members tm
LEFT JOIN members m ON LOWER(TRIM(tm.name)) = LOWER(TRIM(m.name))
WHERE m.id IS NULL;

-- Insert team members as members if they don't already exist
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
    COALESCE(
        tm.email, 
        LOWER(REPLACE(tm.name, ' ', '.')) || '@placeholder.com'
    ) as email,
    '' as phone,
    '' as year,
    '' as major,
    CASE tm.role
        WHEN 'Chapter Lead' THEN 'founder'
        WHEN 'Co-Lead' THEN 'founder'
        WHEN 'Vice President' THEN 'organizer'
        WHEN 'Technical Lead' THEN 'lead'
        WHEN 'Events Coordinator' THEN 'organizer'
        WHEN 'Marketing Lead' THEN 'lead'
        WHEN 'Design Lead' THEN 'lead'
        WHEN 'Community Manager' THEN 'organizer'
        WHEN 'Organizer' THEN 'organizer'
        WHEN 'Mentor' THEN 'lead'
        WHEN 'Faculty Advisor' THEN 'organizer'
        WHEN 'Team Lead' THEN 'lead'
        WHEN 'Team Member' THEN 'active'
        ELSE 'active'
    END as category,
    '{}' as interests, -- Empty array for interests
    tm.is_active,
    TRUE as is_core_team, -- All team members are core team by definition
    NOW() as join_date,
    NOW() as last_active,
    NOW() as created_at,
    NOW() as updated_at
FROM team_members tm
LEFT JOIN members m ON LOWER(TRIM(tm.name)) = LOWER(TRIM(m.name))
WHERE m.id IS NULL; -- Only insert if member doesn't exist

-- Show results after sync
SELECT 
    'AFTER SYNC - Team members without member entries:' as status,
    COUNT(*) as count
FROM team_members tm
LEFT JOIN members m ON LOWER(TRIM(tm.name)) = LOWER(TRIM(m.name))
WHERE m.id IS NULL;

-- Show the newly created members
SELECT 
    'NEWLY SYNCED MEMBERS:' as status,
    m.name,
    m.email,
    m.category,
    m.is_core_team
FROM members m
WHERE m.created_at >= NOW() - INTERVAL '1 minute'
ORDER BY m.name;

-- Summary of all core team members
SELECT 
    'SUMMARY - All core team members:' as status,
    COUNT(*) as total_core_team_members
FROM members 
WHERE is_core_team = TRUE;