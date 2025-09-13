-- Quick duplicate removal - keeps the first occurrence of each title+type combination
-- Run this if you want to quickly clean up duplicates

DELETE FROM resources 
WHERE id NOT IN (
    SELECT DISTINCT ON (title, type) id
    FROM resources 
    ORDER BY title, type, created_at ASC
);

-- Verify results
SELECT 
    type,
    COUNT(*) as count,
    STRING_AGG(title, ' | ' ORDER BY title) as titles
FROM resources 
GROUP BY type 
ORDER BY type;