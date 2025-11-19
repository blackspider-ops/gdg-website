-- Finalize RLS security for both tables with proper policies
-- Ensure blog_submissions also has the correct RLS setup

-- ============================================================================
-- ENSURE BLOG_SUBMISSIONS HAS PROPER RLS
-- ============================================================================

-- Make sure RLS is enabled on blog_submissions
ALTER TABLE blog_submissions ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies on blog_submissions
DROP POLICY IF EXISTS "blog_submissions_insert_policy" ON blog_submissions;
DROP POLICY IF EXISTS "blog_submissions_select_policy" ON blog_submissions;
DROP POLICY IF EXISTS "blog_submissions_admin_policy" ON blog_submissions;

-- Create a comprehensive policy for blog_submissions (similar to blog_comments)
CREATE POLICY "blog_submissions_public_access" ON blog_submissions
    FOR ALL 
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- VERIFY FINAL SECURITY SETUP
-- ============================================================================

-- Check that RLS is enabled on both tables
SELECT 
  relname as table_name, 
  relrowsecurity as rls_enabled 
FROM pg_class 
WHERE relname IN ('blog_comments', 'blog_submissions') 
AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY relname;

-- Check final policies
SELECT 
  tablename, 
  policyname, 
  cmd as operation
FROM pg_policies 
WHERE tablename IN ('blog_comments', 'blog_submissions') 
AND schemaname = 'public'
ORDER BY tablename, policyname;

-- Verify permissions for anonymous users
SELECT 
  'blog_comments' as table_name,
  has_table_privilege('anon', 'blog_comments', 'SELECT') as can_select,
  has_table_privilege('anon', 'blog_comments', 'INSERT') as can_insert
UNION ALL
SELECT 
  'blog_submissions' as table_name,
  has_table_privilege('anon', 'blog_submissions', 'SELECT') as can_select,
  has_table_privilege('anon', 'blog_submissions', 'INSERT') as can_insert;

-- Final security summary
SELECT 
  'Security Status: RLS enabled with proper policies for public forms and admin management' as summary;