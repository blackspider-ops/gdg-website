-- Fix ALL RLS policies to allow admin access
-- This replaces restrictive policies with permissive ones for all tables

-- Get list of all tables with RLS enabled and drop all policies
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END$$;

-- Create permissive policies for all common tables
-- This allows all operations since we're using the regular client

-- List of tables to apply policies to
DO $$
DECLARE
    tbl_name TEXT;
    tables TEXT[] := ARRAY[
        'admin_users', 'admin_actions', 'admin_sessions', 'security_events',
        'events', 'team_members', 'members', 'projects', 'project_stars',
        'sponsors', 'sponsor_tiers', 'resources',
        'newsletter_subscribers', 'newsletter_campaigns',
        'blog_posts', 'blog_categories', 'blog_comments', 'blog_likes', 'blog_submissions', 'blog_submission_comments',
        'linktree_profiles', 'linktree_links', 'linktree_clicks',
        'site_settings', 'site_content', 'page_content', 'navigation_items', 'social_links', 'footer_content',
        'media_files', 'media_folders', 'media_usage',
        'communications_tasks', 'communication_tasks', 'task_comments', 'announcements', 'announcement_reads',
        'site_status', 'contact_submissions', 'external_attendees'
    ];
BEGIN
    FOREACH tbl_name IN ARRAY tables
    LOOP
        -- Check if table exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl_name) THEN
            -- Create permissive policies for all operations
            EXECUTE format('CREATE POLICY "allow_all_select" ON %I FOR SELECT USING (true)', tbl_name);
            EXECUTE format('CREATE POLICY "allow_all_insert" ON %I FOR INSERT WITH CHECK (true)', tbl_name);
            EXECUTE format('CREATE POLICY "allow_all_update" ON %I FOR UPDATE USING (true)', tbl_name);
            EXECUTE format('CREATE POLICY "allow_all_delete" ON %I FOR DELETE USING (true)', tbl_name);
        END IF;
    END LOOP;
END$$;

-- Special handling for audit tables (insert only)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_log') THEN
        DROP POLICY IF EXISTS "allow_all_select" ON audit_log;
        DROP POLICY IF EXISTS "allow_all_update" ON audit_log;
        DROP POLICY IF EXISTS "allow_all_delete" ON audit_log;
        CREATE POLICY "allow_all_select" ON audit_log FOR SELECT USING (true);
        CREATE POLICY "allow_all_insert" ON audit_log FOR INSERT WITH CHECK (true);
    END IF;
END$$;

COMMENT ON SCHEMA public IS 'All RLS policies set to permissive for admin access';
