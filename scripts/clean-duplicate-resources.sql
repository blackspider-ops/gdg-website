-- Clean duplicate resources - SAFE VERSION
-- This keeps the oldest resource for each title+type combination

-- Step 1: Create a backup table (optional but recommended)
CREATE TABLE IF NOT EXISTS resources_backup AS 
SELECT * FROM resources;

-- Step 2: Delete duplicates, keeping only the oldest one for each title+type
WITH duplicates_to_remove AS (
    SELECT id
    FROM (
        SELECT 
            id,
            ROW_NUMBER() OVER (
                PARTITION BY title, type 
                ORDER BY created_at ASC, id ASC
            ) as row_num
        FROM resources
    ) ranked
    WHERE row_num > 1
)
DELETE FROM resources 
WHERE id IN (SELECT id FROM duplicates_to_remove);

-- Step 3: Verify the cleanup
SELECT 
    'Cleanup Complete' as status,
    COUNT(*) as remaining_resources,
    COUNT(DISTINCT title || '|' || type) as unique_combinations
FROM resources;

-- Step 4: Show what's left by type
SELECT 
    type,
    COUNT(*) as count,
    STRING_AGG(title, '; ' ORDER BY title) as resource_titles
FROM resources 
WHERE is_active = true
GROUP BY type 
ORDER BY type;