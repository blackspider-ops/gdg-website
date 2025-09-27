-- Copy the exact RLS pattern that works for events/blogs/content
-- This uses the same permissive approach as the working tables

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_stars ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'projects' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON projects', policy_record.policyname);
    END LOOP;
    
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'project_stars' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON project_stars', policy_record.policyname);
    END LOOP;
END $$;

-- COPY THE EXACT SAME PATTERN AS WORKING TABLES
-- Projects table - same as site_settings, page_content, etc.
CREATE POLICY "Public can read projects" ON projects FOR SELECT USING (true);
CREATE POLICY "Admins can manage projects" ON projects FOR ALL USING (true);

-- Project stars table - same permissive pattern
CREATE POLICY "Public can read project_stars" ON project_stars FOR SELECT USING (true);
CREATE POLICY "Admins can manage project_stars" ON project_stars FOR ALL USING (true);

-- Test it
DO $$
DECLARE
    test_project_id UUID;
    update_result INTEGER;
BEGIN
    SELECT id INTO test_project_id FROM projects LIMIT 1;
    
    IF test_project_id IS NOT NULL THEN
        UPDATE projects SET updated_at = NOW() WHERE id = test_project_id;
        GET DIAGNOSTICS update_result = ROW_COUNT;
        
        IF update_result > 0 THEN
            RAISE NOTICE 'SUCCESS: Using the same pattern as working tables!';
        ELSE
            RAISE NOTICE 'FAILED: Still not working';
        END IF;
    END IF;
END $$;