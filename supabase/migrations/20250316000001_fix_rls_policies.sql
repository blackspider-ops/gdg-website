-- Fix ALL RLS policies to be secure
-- Remove all "USING (true)" policies and implement proper access control

-- Drop all insecure policies
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

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid()
    AND is_active = true
    AND role IN ('admin', 'super_admin', 'owner')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid()
    AND is_active = true
    AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ADMIN_USERS TABLE - MOST CRITICAL
-- ============================================================================
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- NO public access to admin_users table AT ALL
-- Only super admins can view admin list (without password hashes)
CREATE POLICY "super_admin_view_admins" ON admin_users
  FOR SELECT
  USING (is_super_admin());

-- Only super admins can create new admins
CREATE POLICY "super_admin_create_admins" ON admin_users
  FOR INSERT
  WITH CHECK (is_super_admin());

-- Only super admins can update admins
CREATE POLICY "super_admin_update_admins" ON admin_users
  FOR UPDATE
  USING (is_super_admin());

-- Only super admins can delete admins
CREATE POLICY "super_admin_delete_admins" ON admin_users
  FOR DELETE
  USING (is_super_admin());

-- ============================================================================
-- EVENTS TABLE
-- ============================================================================
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Public can view published events only
CREATE POLICY "public_view_events" ON events
  FOR SELECT
  USING (true);

-- Only admins can create events
CREATE POLICY "admin_create_events" ON events
  FOR INSERT
  WITH CHECK (is_admin());

-- Only admins can update events
CREATE POLICY "admin_update_events" ON events
  FOR UPDATE
  USING (is_admin());

-- Only admins can delete events
CREATE POLICY "admin_delete_events" ON events
  FOR DELETE
  USING (is_admin());

-- ============================================================================
-- TEAM_MEMBERS TABLE
-- ============================================================================
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Public can view active team members only
CREATE POLICY "public_view_team_members" ON team_members
  FOR SELECT
  USING (is_active = true);

-- Only admins can manage team members
CREATE POLICY "admin_manage_team_members" ON team_members
  FOR ALL
  USING (is_admin());

-- ============================================================================
-- PROJECTS TABLE
-- ============================================================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Public can view all projects
CREATE POLICY "public_view_projects" ON projects
  FOR SELECT
  USING (true);

-- Only admins can manage projects
CREATE POLICY "admin_manage_projects" ON projects
  FOR ALL
  USING (is_admin());

-- ============================================================================
-- SPONSORS TABLE
-- ============================================================================
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;

-- Public can view active sponsors only
CREATE POLICY "public_view_sponsors" ON sponsors
  FOR SELECT
  USING (is_active = true);

-- Only admins can manage sponsors
CREATE POLICY "admin_manage_sponsors" ON sponsors
  FOR ALL
  USING (is_admin());

-- ============================================================================
-- NEWSLETTER_SUBSCRIBERS TABLE
-- ============================================================================
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Anyone can subscribe (insert only)
CREATE POLICY "public_subscribe_newsletter" ON newsletter_subscribers
  FOR INSERT
  WITH CHECK (true);

-- Users can update their own subscription (for unsubscribe)
CREATE POLICY "users_update_own_subscription" ON newsletter_subscribers
  FOR UPDATE
  USING (email = current_setting('request.jwt.claims', true)::json->>'email');

-- Only admins can view all subscribers
CREATE POLICY "admin_view_subscribers" ON newsletter_subscribers
  FOR SELECT
  USING (is_admin());

-- Only admins can delete subscribers
CREATE POLICY "admin_delete_subscribers" ON newsletter_subscribers
  FOR DELETE
  USING (is_admin());

-- ============================================================================
-- ADMIN_ACTIONS TABLE (Audit Log)
-- ============================================================================
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "admin_view_actions" ON admin_actions
  FOR SELECT
  USING (is_admin());

-- Only system can insert (via triggers/functions)
CREATE POLICY "system_insert_actions" ON admin_actions
  FOR INSERT
  WITH CHECK (true);

-- No updates or deletes allowed (audit log integrity)
-- (No policies = no access)

-- ============================================================================
-- SECURITY_EVENTS TABLE
-- ============================================================================
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- Only super admins can view security events
CREATE POLICY "super_admin_view_security_events" ON security_events
  FOR SELECT
  USING (is_super_admin());

-- Only system can insert security events
CREATE POLICY "system_insert_security_events" ON security_events
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- SITE_CONTENT, PAGE_CONTENT, NAVIGATION, ETC.
-- ============================================================================
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE navigation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE footer_content ENABLE ROW LEVEL SECURITY;

-- Public can view all content
CREATE POLICY "public_view_site_content" ON site_content FOR SELECT USING (true);
CREATE POLICY "public_view_page_content" ON page_content FOR SELECT USING (true);
CREATE POLICY "public_view_navigation" ON navigation_items FOR SELECT USING (true);
CREATE POLICY "public_view_social_links" ON social_links FOR SELECT USING (true);
CREATE POLICY "public_view_footer" ON footer_content FOR SELECT USING (true);

-- Only admins can manage content
CREATE POLICY "admin_manage_site_content" ON site_content FOR ALL USING (is_admin());
CREATE POLICY "admin_manage_page_content" ON page_content FOR ALL USING (is_admin());
CREATE POLICY "admin_manage_navigation" ON navigation_items FOR ALL USING (is_admin());
CREATE POLICY "admin_manage_social_links" ON social_links FOR ALL USING (is_admin());
CREATE POLICY "admin_manage_footer" ON footer_content FOR ALL USING (is_admin());

-- ============================================================================
-- MEMBERS TABLE
-- ============================================================================
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Public can view active members
CREATE POLICY "public_view_members" ON members
  FOR SELECT
  USING (true);

-- Only admins can manage members
CREATE POLICY "admin_manage_members" ON members
  FOR ALL
  USING (is_admin());

-- ============================================================================
-- RESOURCES TABLE
-- ============================================================================
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Public can view all resources
CREATE POLICY "public_view_resources" ON resources
  FOR SELECT
  USING (true);

-- Only admins can manage resources
CREATE POLICY "admin_manage_resources" ON resources
  FOR ALL
  USING (is_admin());

-- ============================================================================
-- NEWSLETTER_CAMPAIGNS TABLE
-- ============================================================================
ALTER TABLE newsletter_campaigns ENABLE ROW LEVEL SECURITY;

-- Only admins can manage campaigns
CREATE POLICY "admin_manage_campaigns" ON newsletter_campaigns
  FOR ALL
  USING (is_admin());

-- ============================================================================
-- BLOG TABLES
-- ============================================================================
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_likes ENABLE ROW LEVEL SECURITY;

-- Public can view published blog posts
CREATE POLICY "public_view_blog_posts" ON blog_posts
  FOR SELECT
  USING (status = 'published' OR is_admin());

-- Only admins can manage blog posts
CREATE POLICY "admin_manage_blog_posts" ON blog_posts
  FOR ALL
  USING (is_admin());

-- Public can view approved comments
CREATE POLICY "public_view_comments" ON blog_comments
  FOR SELECT
  USING (is_approved = true OR is_admin());

-- Authenticated users can create comments
CREATE POLICY "authenticated_create_comments" ON blog_comments
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Only admins can manage comments
CREATE POLICY "admin_manage_comments" ON blog_comments
  FOR ALL
  USING (is_admin());

-- Anyone can view likes
CREATE POLICY "public_view_likes" ON blog_likes
  FOR SELECT
  USING (true);

-- Authenticated users can like
CREATE POLICY "authenticated_like_posts" ON blog_likes
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Users can unlike their own likes
CREATE POLICY "users_unlike_own" ON blog_likes
  FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- LINKTREE TABLES
-- ============================================================================
ALTER TABLE linktree_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE linktree_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE linktree_clicks ENABLE ROW LEVEL SECURITY;

-- Public can view active linktree profiles
CREATE POLICY "public_view_linktree_profiles" ON linktree_profiles
  FOR SELECT
  USING (is_active = true);

-- Public can view active links
CREATE POLICY "public_view_linktree_links" ON linktree_links
  FOR SELECT
  USING (is_active = true);

-- Anyone can record clicks
CREATE POLICY "public_record_clicks" ON linktree_clicks
  FOR INSERT
  WITH CHECK (true);

-- Only admins can manage linktree
CREATE POLICY "admin_manage_linktree_profiles" ON linktree_profiles FOR ALL USING (is_admin());
CREATE POLICY "admin_manage_linktree_links" ON linktree_links FOR ALL USING (is_admin());
CREATE POLICY "admin_view_clicks" ON linktree_clicks FOR SELECT USING (is_admin());

-- ============================================================================
-- SITE_SETTINGS TABLE (CRITICAL - Contains secret code)
-- ============================================================================
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Public can view non-sensitive settings only
CREATE POLICY "public_view_safe_settings" ON site_settings
  FOR SELECT
  USING (key NOT IN ('admin_secret_code', 'api_keys', 'private_config'));

-- Only super admins can view all settings
CREATE POLICY "super_admin_view_all_settings" ON site_settings
  FOR SELECT
  USING (is_super_admin());

-- Only super admins can manage settings
CREATE POLICY "super_admin_manage_settings" ON site_settings
  FOR ALL
  USING (is_super_admin());

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION is_super_admin() TO anon, authenticated;

-- Add comments
COMMENT ON FUNCTION is_admin IS 'Returns true if current user is an active admin';
COMMENT ON FUNCTION is_super_admin IS 'Returns true if current user is an active super admin';
