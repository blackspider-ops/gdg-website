-- Fix storage policies to restrict to admins only
-- CRITICAL FIX: Prevent any authenticated user from uploading/deleting files

-- Drop existing policies
DROP POLICY IF EXISTS "Public files are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update their files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their files" ON storage.objects;
DROP POLICY IF EXISTS "Service role can do anything" ON storage.objects;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_storage_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the current user is an admin
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid()
    AND is_active = true
    AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow public read access to all files in the media bucket
CREATE POLICY "Public files are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'media');

-- FIXED: Only admins can upload files
CREATE POLICY "Only admins can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'media' 
  AND is_storage_admin()
);

-- FIXED: Only admins can update files
CREATE POLICY "Only admins can update files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'media' 
  AND is_storage_admin()
);

-- FIXED: Only admins can delete files
CREATE POLICY "Only admins can delete files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'media' 
  AND is_storage_admin()
);

-- Service role can do anything (for system operations)
CREATE POLICY "Service role can do anything"
ON storage.objects
TO service_role
USING (bucket_id = 'media')
WITH CHECK (bucket_id = 'media');

-- Add storage bucket configuration with size limits
UPDATE storage.buckets
SET 
  file_size_limit = 52428800, -- 50MB limit
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'video/mp4',
    'video/webm',
    'audio/mpeg',
    'audio/wav',
    'application/pdf',
    'application/zip',
    'application/x-zip-compressed'
  ]
WHERE id = 'media';
