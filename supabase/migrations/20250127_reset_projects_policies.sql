-- Reset all project policies completely
-- First, drop ALL existing policies on projects table

DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Get all policies on the projects table
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'projects' AND schemaname = 'public'
    LOOP
        -- Drop each policy
        EXECUTE format('DROP POLICY IF EXISTS %I ON projects', policy_record.policyname);
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
END $$;

-- Now create fresh, working policies
CREATE POLICY "public_read_projects" ON projects
    FOR SELECT USING (true);

CREATE POLICY "authenticated_insert_projects" ON projects
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "authenticated_update_projects" ON projects
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_delete_projects" ON projects
    FOR DELETE USING (auth.role() = 'authenticated');

-- Test the policies
DO $$
DECLARE
    test_project_id UUID;
    update_result INTEGER;
BEGIN
    -- Get a project ID to test with
    SELECT id INTO test_project_id FROM projects LIMIT 1;
    
    IF test_project_id IS NOT NULL THEN
        RAISE NOTICE 'Testing update on project: %', test_project_id;
        
        -- Try to update the project
        UPDATE projects 
        SET updated_at = NOW() 
        WHERE id = test_project_id;
        
        GET DIAGNOSTICS update_result = ROW_COUNT;
        
        IF update_result > 0 THEN
            RAISE NOTICE 'SUCCESS: Updated % rows', update_result;
        ELSE
            RAISE NOTICE 'FAILED: No rows updated - RLS still blocking';
        END IF;
    ELSE
        RAISE NOTICE 'No projects found to test with';
    END IF;
END $$;