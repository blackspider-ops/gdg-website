-- Sync existing core team members to team_members table
-- This script creates team member entries for existing members marked as core team

-- First, let's see what we're working with
SELECT 
    m.id,
    m.name,
    m.category,
    m.is_core_team,
    CASE 
        WHEN tm.id IS NOT NULL THEN 'Already in team_members'
        ELSE 'Not in team_members'
    END as team_status
FROM members m
LEFT JOIN team_members tm ON LOWER(m.name) = LOWER(tm.name)
WHERE m.is_core_team = TRUE;

-- Insert core team members into team_members table if they don't already exist
INSERT INTO team_members (name, role, bio, order_index, is_active, created_at, updated_at)
SELECT 
    m.name,
    CASE m.category
        WHEN 'founder' THEN 'Chapter Lead'
        WHEN 'organizer' THEN 'Organizer'
        WHEN 'lead' THEN 'Team Lead'
        ELSE 'Team Member'
    END as role,
    CONCAT(
        COALESCE(m.major, 'Student'),
        CASE WHEN m.year IS NOT NULL THEN CONCAT(' - ', m.year) ELSE '' END
    ) as bio,
    999 as order_index, -- Will be adjusted manually in team management
    m.is_active,
    NOW() as created_at,
    NOW() as updated_at
FROM members m
LEFT JOIN team_members tm ON LOWER(m.name) = LOWER(tm.name)
WHERE m.is_core_team = TRUE 
  AND tm.id IS NULL; -- Only insert if not already exists

-- Show the results
SELECT 
    'Members marked as core team' as description,
    COUNT(*) as count
FROM members 
WHERE is_core_team = TRUE

UNION ALL

SELECT 
    'Team members created/existing' as description,
    COUNT(*) as count
FROM team_members;