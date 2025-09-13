-- Sync existing core team members to team_members table
-- This updates team member information based on member data

-- Show current sync status
SELECT 
    'BEFORE SYNC - Core team members without team entries:' as status,
    COUNT(*) as count
FROM members m
LEFT JOIN team_members tm ON LOWER(TRIM(m.name)) = LOWER(TRIM(tm.name))
WHERE m.is_core_team = TRUE AND tm.id IS NULL;

-- Update existing team members with member information
UPDATE team_members 
SET 
    email = COALESCE(team_members.email, members.email),
    is_active = members.is_active,
    updated_at = NOW()
FROM members 
WHERE LOWER(TRIM(team_members.name)) = LOWER(TRIM(members.name))
  AND members.is_core_team = TRUE;

-- Insert core team members that don't have team entries
INSERT INTO team_members (
    name,
    role,
    email,
    bio,
    order_index,
    is_active,
    created_at,
    updated_at
)
SELECT 
    m.name,
    CASE m.category
        WHEN 'founder' THEN 'Chapter Lead'
        WHEN 'organizer' THEN 'Organizer'
        WHEN 'lead' THEN 'Team Lead'
        WHEN 'active' THEN 'Team Member'
        WHEN 'member' THEN 'Team Member'
        WHEN 'alumni' THEN 'Alumni'
        ELSE 'Team Member'
    END as role,
    m.email,
    CASE 
        WHEN m.major IS NOT NULL AND m.year IS NOT NULL THEN 
            m.major || ' - ' || m.year
        WHEN m.major IS NOT NULL THEN 
            m.major || ' student'
        WHEN m.year IS NOT NULL THEN 
            m.year || ' year student'
        ELSE 
            'Team member'
    END as bio,
    999 as order_index, -- Will be adjusted in team management
    m.is_active,
    NOW() as created_at,
    NOW() as updated_at
FROM members m
LEFT JOIN team_members tm ON LOWER(TRIM(m.name)) = LOWER(TRIM(tm.name))
WHERE m.is_core_team = TRUE 
  AND tm.id IS NULL;

-- Show results after sync
SELECT 
    'AFTER SYNC - Core team members without team entries:' as status,
    COUNT(*) as count
FROM members m
LEFT JOIN team_members tm ON LOWER(TRIM(m.name)) = LOWER(TRIM(tm.name))
WHERE m.is_core_team = TRUE AND tm.id IS NULL;

-- Show the sync results
SELECT 
    'SYNC RESULTS:' as section,
    m.name as member_name,
    m.category as member_category,
    m.email as member_email,
    tm.name as team_name,
    tm.role as team_role,
    tm.email as team_email
FROM members m
JOIN team_members tm ON LOWER(TRIM(m.name)) = LOWER(TRIM(tm.name))
WHERE m.is_core_team = TRUE
ORDER BY m.name;

-- Summary
SELECT 
    'FINAL SUMMARY:' as info,
    (SELECT COUNT(*) FROM members WHERE is_core_team = TRUE) as core_team_members,
    (SELECT COUNT(*) FROM team_members) as team_members,
    (SELECT COUNT(*) FROM members m 
     JOIN team_members tm ON LOWER(TRIM(m.name)) = LOWER(TRIM(tm.name))
     WHERE m.is_core_team = TRUE) as synced_members;