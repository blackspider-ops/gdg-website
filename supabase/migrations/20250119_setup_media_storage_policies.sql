-- Enable public access to media bucket for public files
-- This allows uploaded media to be accessible via public URLs

-- First, make sure the media bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) 
DO UPDATE SET public = true;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public files are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update their files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their files" ON storage.objects;
DROP POLICY IF EXISTS "Service role can do anything" ON storage.objects;

-- Allow public read access to all files in the media bucket
-- This makes the public URLs work
CREATE POLICY "Public files are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'media');

-- Allow authenticated users (admins) to upload files
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media');

-- Allow authenticated users to update files
CREATE POLICY "Authenticated users can update their files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'media');

-- Allow authenticated users to delete files
CREATE POLICY "Authenticated users can delete their files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'media');

-- Allow service role to do anything (for admin operations)
CREATE POLICY "Service role can do anything"
ON storage.objects
TO service_role
USING (bucket_id = 'media')
WITH CHECK (bucket_id = 'media');
