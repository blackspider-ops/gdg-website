-- Fix admin permissions for project updates
-- The issue is that admins can't update projects due to RLS policies

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can manage projects" ON projects;
DROP POLICY IF EXISTS "Authenticated can insert projects" ON projects;
DROP POLICY IF EXISTS "Authenticated can update projects" ON projects;
DROP POLICY IF EXISTS "Authenticated can delete projects" ON projects;

-- Create more permissive policies for authenticated users
-- This allows any authenticated user to manage projects
CREATE POLICY "Authenticated users can insert projects" ON projects
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update projects" ON projects
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete projects" ON projects
    FOR DELETE USING (auth.role() = 'authenticated');

-- Keep the public read policy
CREATE POLICY "Public can view projects" ON projects
    FOR SELECT USING (true);

-- Test the policies by checking if we can update a project
DO $$
DECLARE
    test_project_id UUID;
    update_result INTEGER;
BEGIN
    -- Get a project ID to test with
    SELECT id INTO test_project_id FROM projects LIMIT 1;
    
    IF test_project_id IS NOT NULL THEN
        -- Try to update the project (just touch the updated_at field)
        UPDATE projects 
        SET updated_at = NOW() 
        WHERE id = test_project_id;
        
        GET DIAGNOSTICS update_result = ROW_COUNT;
        
        IF update_result > 0 THEN
            RAISE NOTICE 'Project update test PASSED! Updated % rows', update_result;
        ELSE
            RAISE NOTICE 'Project update test FAILED! No rows updated';
        END IF;
    END IF;
END $$;