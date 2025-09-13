-- Verify the resources system is working correctly
-- Run this to check your resources setup

-- Check if resources table exists and has data
SELECT 
    'Resources Table Status' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'resources') 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as status,
    COALESCE((SELECT COUNT(*) FROM resources), 0) as total_count,
    COALESCE((SELECT COUNT(*) FROM resources WHERE is_active = true), 0) as active_count;

-- Check resource types distribution
SELECT 
    'Resource Types' as check_type,
    type,
    COUNT(*) as count,
    COUNT(*) FILTER (WHERE is_active = true) as active_count
FROM resources 
GROUP BY type
ORDER BY type;

-- Check if increment function exists
SELECT 
    'Increment Function' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'increment_resource_views'
        ) 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as status;

-- Check RLS policies
SELECT 
    'RLS Policies' as check_type,
    policyname as policy_name,
    cmd as command_type,
    qual as condition
FROM pg_policies 
WHERE tablename = 'resources';

-- Sample resources by type
SELECT 
    'Sample Resources' as check_type,
    type,
    title,
    status,
    is_active,
    views,
    created_at
FROM resources 
ORDER BY type, order_index
LIMIT 10;

-- Check indexes
SELECT 
    'Indexes' as check_type,
    indexname as index_name,
    indexdef as definition
FROM pg_indexes 
WHERE tablename = 'resources'
ORDER BY indexname;