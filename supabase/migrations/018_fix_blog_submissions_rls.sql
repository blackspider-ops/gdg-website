-- Fix RLS policies for blog_submissions table
-- The current policies use auth.uid() which doesn't work with the admin session system

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public blog submission records" ON blog_submissions;
DROP POLICY IF EXISTS "Admins can manage blog submissions" ON blog_submissions;
DROP POLICY IF EXISTS "Allow public blog submission inserts" ON blog_submissions;
DROP POLICY IF EXISTS "Allow all operations on blog submissions" ON blog_submissions;

-- Create new policies that work with the current system
CREATE POLICY "Allow public blog submission inserts" ON blog_submissions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all operations on blog submissions" ON blog_submissions
    FOR ALL USING (true);

-- Grant necessary permissions
GRANT ALL ON blog_submissions TO anon;
GRANT ALL ON blog_submissions TO authenticated;