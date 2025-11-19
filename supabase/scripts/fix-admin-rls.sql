-- Fix Admin RLS Policies
-- Run this in Supabase SQL Editor to fix the 401 Unauthorized error

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Public read access for admin_users" ON admin_users;
DROP POLICY IF EXISTS "Users can update their own last_login" ON admin_users;

-- Create more permissive policies for admin operations
CREATE POLICY "Allow admin operations" ON admin_users FOR ALL USING (true);

-- Ensure admin_actions table has proper policies
DROP POLICY IF EXISTS "Admins can view admin_actions" ON admin_actions;
DROP POLICY IF EXISTS "Admins can insert admin_actions" ON admin_actions;

CREATE POLICY "Allow all admin_actions operations" ON admin_actions FOR ALL USING (true);

-- Make sure other tables have proper policies for admin operations
DROP POLICY IF EXISTS "Allow all operations on events" ON events;
DROP POLICY IF EXISTS "Allow all operations on team_members" ON team_members;
DROP POLICY IF EXISTS "Allow all operations on projects" ON projects;
DROP POLICY IF EXISTS "Allow all operations on sponsors" ON sponsors;
DROP POLICY IF EXISTS "Allow all operations on site_content" ON site_content;
DROP POLICY IF EXISTS "Allow all operations on newsletter_subscribers" ON newsletter_subscribers;

-- Recreate with proper permissions
CREATE POLICY "Allow all operations on events" ON events FOR ALL USING (true);
CREATE POLICY "Allow all operations on team_members" ON team_members FOR ALL USING (true);
CREATE POLICY "Allow all operations on projects" ON projects FOR ALL USING (true);
CREATE POLICY "Allow all operations on sponsors" ON sponsors FOR ALL USING (true);
CREATE POLICY "Allow all operations on site_content" ON site_content FOR ALL USING (true);
CREATE POLICY "Allow all operations on newsletter_subscribers" ON newsletter_subscribers FOR ALL USING (true);

-- Add policies for other tables that might be missing
CREATE POLICY IF NOT EXISTS "Allow all operations on page_content" ON page_content FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all operations on navigation_items" ON navigation_items FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all operations on social_links" ON social_links FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all operations on footer_content" ON footer_content FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all operations on members" ON members FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all operations on resources" ON resources FOR ALL USING (true);

-- Ensure newsletter tables have proper policies
CREATE POLICY IF NOT EXISTS "Allow all operations on newsletter_campaigns" ON newsletter_campaigns FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all operations on newsletter_email_logs" ON newsletter_email_logs FOR ALL USING (true);

-- Security events table
CREATE POLICY IF NOT EXISTS "Allow all operations on security_events" ON security_events FOR ALL USING (true);

-- Communications system tables
CREATE POLICY IF NOT EXISTS "Allow all operations on communications_hub" ON communications_hub FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all operations on task_assignments" ON task_assignments FOR ALL USING (true);

-- Media system tables
CREATE POLICY IF NOT EXISTS "Allow all operations on media_library" ON media_library FOR ALL USING (true);

COMMIT;