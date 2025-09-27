-- Debug authentication and RLS issues
-- This will help us understand why the policies aren't working

DO $$
DECLARE
    current_user_id UUID;
    current_role TEXT;
    admin_count INTEGER;
    project_count INTEGER;
BEGIN
    -- Check current authentication
    SELECT auth.uid() INTO current_user_id;
    SELECT auth.role() INTO current_role;
    
    RAISE NOTICE 'Current user ID: %', current_user_id;
    RAISE NOTICE 'Current role: %', current_role;
    
    -- Check if user exists in admin_users
    SELECT COUNT(*) INTO admin_count 
    FROM admin_users 
    WHERE id = current_user_id AND is_active = true;
    
    RAISE NOTICE 'Admin user count for current user: %', admin_count;
    
    -- Check total projects
    SELECT COUNT(*) INTO project_count FROM projects;
    RAISE NOTICE 'Total projects in database: %', project_count;
    
    -- List all current policies
    RAISE NOTICE 'Current RLS policies on projects:';
    FOR policy_record IN 
        SELECT policyname, cmd, permissive, roles, qual, with_check
        FROM pg_policies 
        WHERE tablename = 'projects' AND schemaname = 'public'
    LOOP
        RAISE NOTICE '  - % (%) - Roles: %, Permissive: %', 
            policy_record.policyname, 
            policy_record.cmd, 
            policy_record.roles, 
            policy_record.permissive;
    END LOOP;
    
    -- Check if RLS is enabled
    IF EXISTS (
        SELECT 1 FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE c.relname = 'projects' 
        AND n.nspname = 'public' 
        AND c.relrowsecurity = true
    ) THEN
        RAISE NOTICE 'RLS is ENABLED on projects table';
    ELSE
        RAISE NOTICE 'RLS is DISABLED on projects table';
    END IF;
    
END $$;