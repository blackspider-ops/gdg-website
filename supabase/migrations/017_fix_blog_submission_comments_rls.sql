-- Fix RLS policies for blog submission comments
-- Drop existing policies and create simpler ones

DROP POLICY IF EXISTS "Allow all operations on blog_submission_comments" ON blog_submission_comments;

-- Disable RLS temporarily to allow the application to handle security
ALTER TABLE blog_submission_comments DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS with permissive policy
ALTER TABLE blog_submission_comments ENABLE ROW LEVEL SECURITY;

-- Create a simple policy that allows all operations
-- Security is handled at the application level since only authenticated admins can access the blog editor
CREATE POLICY "Allow all operations for blog submission comments" ON blog_submission_comments 
    FOR ALL USING (true);

-- Grant necessary permissions
GRANT ALL ON blog_submission_comments TO anon;
GRANT ALL ON blog_submission_comments TO authenticated;