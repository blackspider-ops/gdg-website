-- Fix Supabase security issues
-- This migration addresses:
-- 1. Security definer view issue
-- 2. Missing RLS on blog_likes table
-- 3. Ensures all RLS policies are properly configured

-- First, drop the problematic view if it exists
DROP VIEW IF EXISTS newsletter_campaign_analytics;

-- Recreate the view without SECURITY DEFINER (uses SECURITY INVOKER by default)
CREATE VIEW newsletter_campaign_analytics AS
SELECT 
    nc.id,
    nc.subject,
    nc.status,
    nc.scheduled_at,
    nc.sent_at,
    nc.recipient_count,
    nc.open_count,
    nc.click_count,
    CASE 
        WHEN nc.recipient_count > 0 THEN ROUND((nc.open_count::DECIMAL / nc.recipient_count::DECIMAL) * 100, 2)
        ELSE 0 
    END as open_rate,
    CASE 
        WHEN nc.open_count > 0 THEN ROUND((nc.click_count::DECIMAL / nc.open_count::DECIMAL) * 100, 2)
        ELSE 0 
    END as click_through_rate,
    nc.created_at,
    nc.updated_at,
    au.email as created_by_email
FROM newsletter_campaigns nc
LEFT JOIN admin_users au ON nc.created_by = au.id;

-- Enable RLS on blog_likes table (this was missing)
ALTER TABLE blog_likes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for blog_likes
-- Allow public to insert likes (for anonymous users)
CREATE POLICY "Public can insert blog likes" ON blog_likes
    FOR INSERT WITH CHECK (true);

-- Allow public to view likes count (for displaying like counts)
CREATE POLICY "Public can view blog likes" ON blog_likes
    FOR SELECT USING (true);

-- Allow admins to manage all likes
CREATE POLICY "Admins can manage blog likes" ON blog_likes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.is_active = true
        )
    );

-- Ensure RLS is properly enabled on all linktree tables (double-check)
ALTER TABLE linktree_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE linktree_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE linktree_analytics ENABLE ROW LEVEL SECURITY;

-- Add missing policies if they don't exist (using IF NOT EXISTS equivalent)
-- Note: PostgreSQL doesn't have IF NOT EXISTS for policies, so we'll use DO blocks

DO $$
BEGIN
    -- Check and create linktree_profiles policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'linktree_profiles' 
        AND policyname = 'Public can view active profiles'
    ) THEN
        CREATE POLICY "Public can view active profiles" ON linktree_profiles
            FOR SELECT USING (is_active = true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'linktree_profiles' 
        AND policyname = 'Admins can manage profiles'
    ) THEN
        CREATE POLICY "Admins can manage profiles" ON linktree_profiles
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM admin_users 
                    WHERE admin_users.id = auth.uid() 
                    AND admin_users.is_active = true
                )
            );
    END IF;

    -- Check and create linktree_links policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'linktree_links' 
        AND policyname = 'Public can view active links'
    ) THEN
        CREATE POLICY "Public can view active links" ON linktree_links
            FOR SELECT USING (is_active = true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'linktree_links' 
        AND policyname = 'Admins can manage links'
    ) THEN
        CREATE POLICY "Admins can manage links" ON linktree_links
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM admin_users 
                    WHERE admin_users.id = auth.uid() 
                    AND admin_users.is_active = true
                )
            );
    END IF;

    -- Check and create linktree_analytics policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'linktree_analytics' 
        AND policyname = 'Admins can view analytics'
    ) THEN
        CREATE POLICY "Admins can view analytics" ON linktree_analytics
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM admin_users 
                    WHERE admin_users.id = auth.uid() 
                    AND admin_users.is_active = true
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'linktree_analytics' 
        AND policyname = 'Public can insert analytics'
    ) THEN
        CREATE POLICY "Public can insert analytics" ON linktree_analytics
            FOR INSERT WITH CHECK (true);
    END IF;
END $$;

-- Create RLS policy for the newsletter_campaign_analytics view
-- Views inherit RLS from their underlying tables, but we can add explicit policies
-- Since this view is based on newsletter_campaigns, it will use those policies

-- Add comment to document the security fix
COMMENT ON VIEW newsletter_campaign_analytics IS 'Analytics view for newsletter campaigns - recreated without SECURITY DEFINER to fix security issue';