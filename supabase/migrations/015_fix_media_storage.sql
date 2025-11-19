-- Fix media storage bucket and policies

-- Create the media storage bucket if it doesn't exist
-- Note: This may need to be done manually in Supabase dashboard if storage schema is not accessible
DO $$
BEGIN
    -- Try to create the bucket, but don't fail if storage schema doesn't exist
    BEGIN
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('media', 'media', false)
        ON CONFLICT (id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
        -- Storage schema might not be accessible, skip bucket creation
        RAISE NOTICE 'Could not create storage bucket - may need manual creation in Supabase dashboard';
    END;
END $$;

-- Create a simple function to check if user is admin (for policies)
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_users 
        WHERE admin_users.id = auth.uid() 
        AND admin_users.is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: Storage policies may need to be created manually in Supabase dashboard
-- The following policies should be created for the 'media' bucket:
--
-- 1. "Authenticated users can view media files" (SELECT)
--    USING: bucket_id = 'media' AND auth.role() = 'authenticated'
--
-- 2. "Admins can upload media files" (INSERT) 
--    WITH CHECK: bucket_id = 'media' AND is_admin_user()
--
-- 3. "Admins can update media files" (UPDATE)
--    USING: bucket_id = 'media' AND is_admin_user()
--
-- 4. "Admins can delete media files" (DELETE)
--    USING: bucket_id = 'media' AND is_admin_user()

-- Add a note about manual setup
DO $$
BEGIN
    RAISE NOTICE 'Media storage migration completed. If file uploads still fail:';
    RAISE NOTICE '1. Create "media" bucket in Supabase dashboard (Storage section)';
    RAISE NOTICE '2. Set bucket to private (not public)';
    RAISE NOTICE '3. Add the storage policies mentioned in this migration file';
    RAISE NOTICE '4. Set file size limit to 50MB and configure allowed MIME types';
END $$;