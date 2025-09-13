-- Step 1: Check for duplicate resources
-- Run this first to see what duplicates exist

SELECT 
    'Duplicate Resources Found' as check_type,
    title,
    type,
    COUNT(*) as duplicate_count,
    STRING_AGG(id::text, ', ' ORDER BY created_at) as resource_ids,
    STRING_AGG(created_at::text, ', ' ORDER BY created_at) as created_dates
FROM resources 
GROUP BY title, type 
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, title;

-- Step 2: Show total counts
SELECT 
    'Current Status' as info,
    COUNT(*) as total_resources,
    COUNT(DISTINCT title || '|' || type) as unique_title_type_combinations,
    COUNT(*) - COUNT(DISTINCT title || '|' || type) as duplicates_to_remove
FROM resources;