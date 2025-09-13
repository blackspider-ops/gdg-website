-- Remove duplicate resources from the database
-- This script identifies and removes duplicate resources based on title and type

-- Step 1: First, let's see what duplicates exist
SELECT 
    title,
    type,
    COUNT(*) as duplicate_count,
    STRING_AGG(id::text, ', ') as resource_ids
FROM resources 
GROUP BY title, type 
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, title;

-- Step 2: Create a temporary table with the resources to keep (keeping the oldest one)
CREATE TEMP TABLE resources_to_keep AS
SELECT DISTINCT ON (title, type) 
    id,
    title,
    type,
    created_at
FROM resources 
ORDER BY title, type, created_at ASC;

-- Step 3: Show what will be deleted (for verification)
SELECT 
    r.id,
    r.title,
    r.type,
    r.created_at,
    'WILL BE DELETED' as action
FROM resources r
WHERE r.id NOT IN (SELECT id FROM resources_to_keep)
ORDER BY r.title, r.type, r.created_at;

-- Step 4: Delete the duplicates (uncomment the line below to execute)
-- DELETE FROM resources WHERE id NOT IN (SELECT id FROM resources_to_keep);

-- Step 5: Verify the cleanup
SELECT 
    'After cleanup' as status,
    COUNT(*) as total_resources,
    COUNT(DISTINCT title || type) as unique_resources
FROM resources;

-- Step 6: Show remaining resources grouped by type
SELECT 
    type,
    COUNT(*) as count,
    STRING_AGG(title, '; ' ORDER BY title) as titles
FROM resources 
GROUP BY type 
ORDER BY type;