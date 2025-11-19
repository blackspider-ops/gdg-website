-- Fix linktree RLS policies to ensure admin operations work properly

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public can view active profiles" ON linktree_profiles;
DROP POLICY IF EXISTS "Admins can manage profiles" ON linktree_profiles;
DROP POLICY IF EXISTS "Public can view active links" ON linktree_links;
DROP POLICY IF EXISTS "Admins can manage links" ON linktree_links;
DROP POLICY IF EXISTS "Admins can view analytics" ON linktree_analytics;
DROP POLICY IF EXISTS "Public can insert analytics" ON linktree_analytics;

-- Create simplified, more permissive policies
-- Public can view active profiles
CREATE POLICY "Enable read access for active profiles" ON linktree_profiles
    FOR SELECT USING (is_active = true);

-- Allow all operations on linktree tables (for admin functionality)
CREATE POLICY "Enable all operations on linktree_profiles" ON linktree_profiles
    FOR ALL USING (true);

CREATE POLICY "Enable all operations on linktree_links" ON linktree_links
    FOR ALL USING (true);

CREATE POLICY "Enable all operations on linktree_analytics" ON linktree_analytics
    FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON linktree_profiles TO authenticated;
GRANT ALL ON linktree_profiles TO anon;
GRANT ALL ON linktree_links TO authenticated;
GRANT ALL ON linktree_links TO anon;
GRANT ALL ON linktree_analytics TO authenticated;
GRANT ALL ON linktree_analytics TO anon;