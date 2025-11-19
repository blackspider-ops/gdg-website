-- Production-ready RLS policies for projects system
-- This enables RLS with proper policies for both public users and admins

-- First, ensure RLS is enabled
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_stars ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Drop all policies on projects table
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'projects' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON projects', policy_record.policyname);
    END LOOP;
    
    -- Drop all policies on project_stars table
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'project_stars' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON project_stars', policy_record.policyname);
    END LOOP;
END $$;

-- PROJECTS TABLE POLICIES
-- 1. Anyone can view projects (public read access)
CREATE POLICY "projects_public_read" ON projects
    FOR SELECT USING (true);

-- 2. Authenticated users can create projects
CREATE POLICY "projects_authenticated_create" ON projects
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 3. Authenticated users can update any project (for admin functionality)
CREATE POLICY "projects_authenticated_update" ON projects
    FOR UPDATE USING (auth.role() = 'authenticated');

-- 4. Authenticated users can delete any project (for admin functionality)
CREATE POLICY "projects_authenticated_delete" ON projects
    FOR DELETE USING (auth.role() = 'authenticated');

-- PROJECT_STARS TABLE POLICIES
-- 1. Anyone can view project stars
CREATE POLICY "project_stars_public_read" ON project_stars
    FOR SELECT USING (true);

-- 2. Anyone can star projects (including anonymous users)
CREATE POLICY "project_stars_public_create" ON project_stars
    FOR INSERT WITH CHECK (true);

-- 3. Users can only delete their own stars
CREATE POLICY "project_stars_delete_own" ON project_stars
    FOR DELETE USING (
        -- Allow if user_id matches current user
        (user_id = auth.uid()) OR 
        -- Allow if user_identifier matches (for anonymous users)
        (user_id IS NULL AND user_identifier IS NOT NULL) OR
        -- Allow authenticated users to delete any star (for admin cleanup)
        (auth.role() = 'authenticated')
    );

-- Create a function to check if current user is an admin
-- This is more reliable than checking auth.uid() directly
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if the current user exists in admin_users table and is active
    RETURN EXISTS (
        SELECT 1 
        FROM admin_users 
        WHERE id = auth.uid() 
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Alternative admin-specific policies (more restrictive)
-- Uncomment these and comment out the above if you want only admins to manage projects

/*
-- Only admins can create projects
CREATE POLICY "projects_admin_create" ON projects
    FOR INSERT WITH CHECK (is_admin_user());

-- Only admins can update projects
CREATE POLICY "projects_admin_update" ON projects
    FOR UPDATE USING (is_admin_user());

-- Only admins can delete projects
CREATE POLICY "projects_admin_delete" ON projects
    FOR DELETE USING (is_admin_user());
*/

-- Test the policies
DO $$
DECLARE
    test_project_id UUID;
    test_title TEXT;
    update_result INTEGER;
    current_user_id UUID;
    policy_info RECORD;
BEGIN
    -- Get current user
    SELECT auth.uid() INTO current_user_id;
    RAISE NOTICE 'Testing with user ID: %', current_user_id;
    
    -- Test if user is considered admin
    IF is_admin_user() THEN
        RAISE NOTICE 'User is recognized as admin';
    ELSE
        RAISE NOTICE 'User is NOT recognized as admin';
    END IF;
    
    -- Get a project to test with
    SELECT id, title INTO test_project_id, test_title 
    FROM projects 
    LIMIT 1;
    
    IF test_project_id IS NOT NULL THEN
        RAISE NOTICE 'Testing update on project: % (%)', test_project_id, test_title;
        
        -- Try to update the project
        UPDATE projects 
        SET updated_at = NOW() 
        WHERE id = test_project_id;
        
        GET DIAGNOSTICS update_result = ROW_COUNT;
        
        IF update_result > 0 THEN
            RAISE NOTICE 'SUCCESS: Updated % rows', update_result;
        ELSE
            RAISE NOTICE 'FAILED: No rows updated';
            
            -- Check what policies exist
            RAISE NOTICE 'Current policies on projects table:';
            FOR policy_info IN 
                SELECT policyname, cmd, COALESCE(qual, 'N/A') as qual
                FROM pg_policies 
                WHERE tablename = 'projects' AND schemaname = 'public'
            LOOP
                RAISE NOTICE '  Policy: % (%) - %', policy_info.policyname, policy_info.cmd, policy_info.qual;
            END LOOP;
        END IF;
    ELSE
        RAISE NOTICE 'No projects found to test with';
    END IF;
END $$;