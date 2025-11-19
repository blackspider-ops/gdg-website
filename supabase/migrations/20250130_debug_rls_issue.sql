-- Temporarily disable RLS to test if the issue is with policies or client configuration
-- This will help us identify if the problem is RLS policies or something else

-- Temporarily disable RLS on both tables for testing
ALTER TABLE blog_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE blog_submissions DISABLE ROW LEVEL SECURITY;

-- Check the status
SELECT 
  relname as table_name, 
  relrowsecurity as rls_enabled 
FROM pg_class 
WHERE relname IN ('blog_comments', 'blog_submissions') 
AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Note: This is temporary for debugging. We'll re-enable RLS once we fix the issue.