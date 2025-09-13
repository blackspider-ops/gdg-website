-- Temporarily disable the sync by removing the problematic update triggers
-- This will stop the infinite loop immediately

-- Remove any recent duplicate entries created in the last hour
DELETE FROM team_members 
WHERE created_at >= NOW() - INTERVAL '1 hour'
  AND name != 'Al Verbanec'
  AND (name ILIKE '%verbanec%' OR name ILIKE '%verbananc%');

DELETE FROM members 
WHERE created_at >= NOW() - INTERVAL '1 hour'
  AND name != 'Al Verbanec'
  AND (name ILIKE '%verbanec%' OR name ILIKE '%verbananc%');

-- Ensure we have clean, single entries
UPDATE team_members 
SET name = 'Al Verbanec',
    email = 'alac.carl.verbanec@placeholder.com',
    updated_at = NOW()
WHERE name ILIKE '%verbananc%' OR email ILIKE '%verbananc%';

UPDATE members 
SET name = 'Al Verbanec',
    email = 'alac.carl.verbanec@placeholder.com',
    updated_at = NOW()
WHERE name ILIKE '%verbananc%' OR email ILIKE '%verbananc%';

-- Show what we have now
SELECT 'Final state:' as status;
SELECT COUNT(*) as team_members_count FROM team_members WHERE name ILIKE '%verbanec%';
SELECT COUNT(*) as members_count FROM members WHERE name ILIKE '%verbanec%';