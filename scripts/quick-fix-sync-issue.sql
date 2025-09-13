-- Quick fix for the sync issue causing infinite updates
-- This removes the problematic sync to stop the loop

-- First, let's see the current state
SELECT 'Current Al Verbanec records:' as info;

SELECT 'In members:' as table_name, name, email, category, is_core_team 
FROM members 
WHERE name ILIKE '%verbanec%' OR name ILIKE '%verbananc%';

SELECT 'In team_members:' as table_name, name, role, email, is_active 
FROM team_members 
WHERE name ILIKE '%verbanec%' OR name ILIKE '%verbananc%';

-- Clean up any duplicate Al Verbanec entries
-- Keep the original, remove duplicates
DELETE FROM team_members 
WHERE name ILIKE '%verbananc%' 
  AND id NOT IN (
    SELECT MIN(id) 
    FROM team_members 
    WHERE name ILIKE '%verbananc%'
  );

DELETE FROM members 
WHERE name ILIKE '%verbananc%' 
  AND id NOT IN (
    SELECT MIN(id) 
    FROM members 
    WHERE name ILIKE '%verbananc%'
  );

-- Update the correct name in both tables
UPDATE members 
SET name = 'Al Verbanec', 
    updated_at = NOW()
WHERE name ILIKE '%verbananc%';

UPDATE team_members 
SET name = 'Al Verbanec', 
    updated_at = NOW()
WHERE name ILIKE '%verbananc%';

-- Show final state
SELECT 'After cleanup:' as info;

SELECT 'Members:' as table_name, name, email, category 
FROM members 
WHERE name ILIKE '%verbanec%';

SELECT 'Team Members:' as table_name, name, role, email 
FROM team_members 
WHERE name ILIKE '%verbanec%';