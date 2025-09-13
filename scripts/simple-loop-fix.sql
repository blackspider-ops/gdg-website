-- Simple fix to stop infinite loops immediately
-- Just reset timestamps and remove obvious recent duplicates

-- Reset recent update timestamps to break any loops
UPDATE team_members 
SET updated_at = NOW() - INTERVAL '2 hours'
WHERE updated_at >= NOW() - INTERVAL '10 minutes';

UPDATE members 
SET updated_at = NOW() - INTERVAL '2 hours'
WHERE updated_at >= NOW() - INTERVAL '10 minutes';

-- Remove any entries created in the last 10 minutes (likely duplicates from loops)
DELETE FROM team_members 
WHERE created_at >= NOW() - INTERVAL '10 minutes';

DELETE FROM members 
WHERE created_at >= NOW() - INTERVAL '10 minutes'
  AND name NOT IN ('Tejas Singhal', 'Karthik Krishnan', 'Al Verbanec'); -- Keep original members

-- Show final counts
SELECT 'Final counts:' as status;
SELECT COUNT(*) as team_members FROM team_members;
SELECT COUNT(*) as members FROM members;
SELECT COUNT(*) as core_team FROM members WHERE is_core_team = TRUE;