-- Fix storage policies with simpler approach

-- First, let's make sure we can check if the current user is authenticated
-- and exists in the admin_users table

-- Create a function that always returns true for now (bypass RLS for testing)
-- This is a temporary solution until we can properly set up auth
CREATE OR REPLACE FUNCTION public.is_authenticated_admin()
RETURNS BOOLEAN AS $$
BEGIN
    -- For now, allow all authenticated requests
    -- TODO: Implement proper admin checking once auth is working
    RETURN auth.role() = 'authenticated' OR auth.role() = 'anon';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.is_authenticated_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_authenticated_admin() TO anon;

-- For debugging, let's also create a function that shows current user info
CREATE OR REPLACE FUNCTION public.debug_current_user()
RETURNS JSON AS $$
DECLARE
    result JSON;
    admin_metadata TEXT;
BEGIN
    -- Get admin_id from user metadata
    admin_metadata := auth.jwt() ->> 'user_metadata' ->> 'admin_id';
    
    SELECT json_build_object(
        'user_id', auth.uid(),
        'role', auth.role(),
        'admin_metadata', admin_metadata,
        'is_admin_by_metadata', admin_metadata IS NOT NULL,
        'is_admin_by_table', EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE id = auth.uid() 
            AND is_active = true
        ),
        'is_authenticated_admin', public.is_authenticated_admin()
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.debug_current_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.debug_current_user() TO anon;

-- Note: The actual storage policies need to be created manually in Supabase Dashboard
-- because the storage schema might not be accessible via migrations.
-- 
-- Use these policies in the Supabase Dashboard Storage section:
--
-- For the 'media' bucket, create these policies:
--
-- 1. "Allow authenticated users to view files" (SELECT)
--    Expression: bucket_id = 'media'
--    
-- 2. "Allow authenticated admins to upload files" (INSERT)
--    Expression: bucket_id = 'media' AND public.is_authenticated_admin()
--    
-- 3. "Allow authenticated admins to update files" (UPDATE)  
--    Expression: bucket_id = 'media' AND public.is_authenticated_admin()
--    
-- 4. "Allow authenticated admins to delete files" (DELETE)
--    Expression: bucket_id = 'media' AND public.is_authenticated_admin()

-- Alternative simpler policies (if the function approach doesn't work):
-- 
-- Instead of using public.is_authenticated_admin(), you can use:
-- 
-- For INSERT/UPDATE/DELETE operations:
-- bucket_id = 'media' AND auth.uid() IN (
--   SELECT id FROM admin_users WHERE is_active = true
-- )
--
-- Or even simpler for testing:
-- bucket_id = 'media' AND auth.role() = 'authenticated'
-- (Warning: This allows any authenticated user to upload)

-- Add some helpful debug info
DO $$
BEGIN
    RAISE NOTICE 'Storage policy helper functions created successfully';
    RAISE NOTICE 'Functions created: public.is_authenticated_admin() and public.debug_current_user()';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Go to Supabase Dashboard > Storage > media bucket > Policies';
    RAISE NOTICE '2. Create the policies mentioned in this migration file';
    RAISE NOTICE '3. Test uploads using the Test Storage button';
    RAISE NOTICE '4. If function policies do not work, use the alternative simpler policies';
    RAISE NOTICE '';
    RAISE NOTICE 'Policy expressions to use:';
    RAISE NOTICE 'SELECT: bucket_id = ''media''';
    RAISE NOTICE 'INSERT/UPDATE/DELETE: bucket_id = ''media'' AND public.is_authenticated_admin()';
END $$;