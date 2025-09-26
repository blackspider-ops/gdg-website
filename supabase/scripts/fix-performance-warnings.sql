-- Comprehensive fix for RLS performance issues
-- This optimizes auth function calls and removes duplicate policies

-- Fix auth RLS initialization plan issues by wrapping auth.uid() in subqueries
-- This prevents re-evaluation for each row

-- 1. Fix announcements policies
DROP POLICY IF EXISTS "Admins can view all announcements" ON announcements;
DROP POLICY IF EXISTS "Admins can create announcements" ON announcements;
DROP POLICY IF EXISTS "Authors can update their announcements" ON announcements;
DROP POLICY IF EXISTS "Authors and super admins can delete announcements" ON announcements;

CREATE POLICY "Admins can view all announcements" ON announcements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = (SELECT auth.uid()) 
            AND admin_users.is_active = true
        )
    );

CREATE POLICY "Admins can create announcements" ON announcements
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = (SELECT auth.uid()) 
            AND admin_users.is_active = true
        )
    );

CREATE POLICY "Authors can update their announcements" ON announcements
    FOR UPDATE USING (
        author_id = (SELECT auth.uid()) OR
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = (SELECT auth.uid()) 
            AND admin_users.is_active = true
        )
    );

CREATE POLICY "Authors and super admins can delete announcements" ON announcements
    FOR DELETE USING (
        author_id = (SELECT auth.uid()) OR
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = (SELECT auth.uid()) 
            AND admin_users.is_active = true
            AND admin_users.role = 'super_admin'
        )
    );

-- 2. Fix announcement_reads policies
DROP POLICY IF EXISTS "Users can manage their own reads" ON announcement_reads;
CREATE POLICY "Users can manage their own reads" ON announcement_reads
    FOR ALL USING (user_id = (SELECT auth.uid()));

-- 3. Fix communication_tasks policies
DROP POLICY IF EXISTS "Admins can view all tasks" ON communication_tasks;
DROP POLICY IF EXISTS "Admins can create tasks" ON communication_tasks;
DROP POLICY IF EXISTS "Task creators and assignees can update tasks" ON communication_tasks;
DROP POLICY IF EXISTS "Task creators and super admins can delete tasks" ON communication_tasks;

CREATE POLICY "Admins can view all tasks" ON communication_tasks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = (SELECT auth.uid()) 
            AND admin_users.is_active = true
        )
    );

CREATE POLICY "Admins can create tasks" ON communication_tasks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = (SELECT auth.uid()) 
            AND admin_users.is_active = true
        )
    );

CREATE POLICY "Task creators and assignees can update tasks" ON communication_tasks
    FOR UPDATE USING (
        created_by = (SELECT auth.uid()) OR 
        assigned_to = (SELECT auth.uid()) OR
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = (SELECT auth.uid()) 
            AND admin_users.is_active = true
        )
    );

CREATE POLICY "Task creators and super admins can delete tasks" ON communication_tasks
    FOR DELETE USING (
        created_by = (SELECT auth.uid()) OR
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = (SELECT auth.uid()) 
            AND admin_users.is_active = true
            AND admin_users.role = 'super_admin'
        )
    );

-- 4. Fix internal_messages policies
DROP POLICY IF EXISTS "Users can view their messages" ON internal_messages;
DROP POLICY IF EXISTS "Users can send messages" ON internal_messages;
DROP POLICY IF EXISTS "Recipients can update message read status" ON internal_messages;
DROP POLICY IF EXISTS "Senders can delete their messages" ON internal_messages;

CREATE POLICY "Users can view their messages" ON internal_messages
    FOR SELECT USING (
        sender_id = (SELECT auth.uid()) OR 
        recipient_id = (SELECT auth.uid())
    );

CREATE POLICY "Users can send messages" ON internal_messages
    FOR INSERT WITH CHECK (sender_id = (SELECT auth.uid()));

CREATE POLICY "Recipients can update message read status" ON internal_messages
    FOR UPDATE USING (recipient_id = (SELECT auth.uid()));

CREATE POLICY "Senders can delete their messages" ON internal_messages
    FOR DELETE USING (sender_id = (SELECT auth.uid()));

-- 5. Fix task_comments policies
DROP POLICY IF EXISTS "Admins can view task comments" ON task_comments;
DROP POLICY IF EXISTS "Admins can create task comments" ON task_comments;

CREATE POLICY "Admins can view task comments" ON task_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = (SELECT auth.uid()) 
            AND admin_users.is_active = true
        )
    );

CREATE POLICY "Admins can create task comments" ON task_comments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = (SELECT auth.uid()) 
            AND admin_users.is_active = true
        )
    );

-- 6. Fix media policies
DROP POLICY IF EXISTS "Admins can view all folders" ON media_folders;
DROP POLICY IF EXISTS "Admins can create folders" ON media_folders;
DROP POLICY IF EXISTS "Admins can update folders" ON media_folders;
DROP POLICY IF EXISTS "Admins can delete folders" ON media_folders;

CREATE POLICY "Admins can manage folders" ON media_folders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = (SELECT auth.uid()) 
            AND admin_users.is_active = true
        )
    );

DROP POLICY IF EXISTS "Admins can view all files" ON media_files;
DROP POLICY IF EXISTS "Admins can upload files" ON media_files;
DROP POLICY IF EXISTS "Admins can update files" ON media_files;
DROP POLICY IF EXISTS "Admins can delete files" ON media_files;

CREATE POLICY "Admins can manage files" ON media_files
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = (SELECT auth.uid()) 
            AND admin_users.is_active = true
        )
    );

DROP POLICY IF EXISTS "Admins can manage media usage" ON media_usage;
CREATE POLICY "Admins can manage media usage" ON media_usage
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = (SELECT auth.uid()) 
            AND admin_users.is_active = true
        )
    );

-- 7. Remove duplicate policies to fix multiple permissive policies warnings
-- Keep only the most specific policies and remove broad "Allow all operations" ones

-- Remove broad policies that duplicate specific ones
DROP POLICY IF EXISTS "Allow all admin_actions operations" ON admin_actions;
DROP POLICY IF EXISTS "Allow all operations on blog_categories for admins" ON blog_categories;
DROP POLICY IF EXISTS "Allow all operations on blog_posts for admins" ON blog_posts;
DROP POLICY IF EXISTS "Allow all operations on events" ON events;
DROP POLICY IF EXISTS "Allow all operations on footer_content" ON footer_content;
DROP POLICY IF EXISTS "Allow all operations on members" ON members;
DROP POLICY IF EXISTS "Allow all operations on navigation_items" ON navigation_items;
DROP POLICY IF EXISTS "Allow all operations on newsletter_campaigns" ON newsletter_campaigns;
DROP POLICY IF EXISTS "Allow all operations on newsletter_email_logs" ON newsletter_email_logs;
DROP POLICY IF EXISTS "Allow all operations on page_content" ON page_content;
DROP POLICY IF EXISTS "Allow all operations on projects" ON projects;
DROP POLICY IF EXISTS "Allow all operations on resources" ON resources;
DROP POLICY IF EXISTS "Allow all operations on security_events" ON security_events;
DROP POLICY IF EXISTS "Allow all operations on site_content" ON site_content;
DROP POLICY IF EXISTS "Allow all operations on social_links" ON social_links;
DROP POLICY IF EXISTS "Allow all operations on sponsors" ON sponsors;
DROP POLICY IF EXISTS "Allow all operations on team_members" ON team_members;

-- Remove duplicate newsletter subscriber policies
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON newsletter_subscribers;

-- Remove duplicate team member policies
DROP POLICY IF EXISTS "Public read access for team_members" ON team_members;