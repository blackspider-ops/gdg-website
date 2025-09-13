-- Stop any infinite update loops by cleaning up recent duplicates
-- This will resolve the "stuck on updating" issue

-- Remove any duplicate entries created in the last 30 minutes (likely from loops)
DELETE FROM team_members 
WHERE created_at >= NOW() - INTERVAL '30 minutes'
  AND id NOT IN (
    SELECT DISTINCT ON (LOWER(TRIM(name))) id
    FROM team_members 
    ORDER BY LOWER(TRIM(name)), created_at ASC
  );

DELETE FROM members 
WHERE created_at >= NOW() - INTERVAL '30 minutes'
  AND id NOT IN (
    SELECT DISTINCT ON (LOWER(TRIM(name))) id
    FROM members 
    ORDER BY LOWER(TRIM(name)), created_at ASC
  );

-- Reset any records that might be in a bad state
UPDATE team_members 
SET updated_at = NOW() - INTERVAL '1 hour'
WHERE updated_at >= NOW() - INTERVAL '5 minutes';

UPDATE members 
SET updated_at = NOW() - INTERVAL '1 hour'
WHERE updated_at >= NOW() - INTERVAL '5 minutes';

-- Show current counts
SELECT 'Current state:' as info;
SELECT 'Team members:' as table_name, COUNT(*) as count FROM team_members;
SELECT 'Members:' as table_name, COUNT(*) as count FROM members;
SELECT 'Core team members:' as table_name, COUNT(*) as count FROM members WHERE is_core_team = TRUE;