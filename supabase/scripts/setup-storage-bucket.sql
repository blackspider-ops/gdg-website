-- Storage Bucket Setup Script
-- Run this script to create the media storage bucket and policies

-- 1. Create the media storage bucket
-- Note: This creates the bucket programmatically
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'media',
    'media',
    true,
    52428800, -- 50MB limit
    ARRAY[
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        'video/mp4',
        'video/webm',
        'video/quicktime',
        'audio/mpeg',
        'audio/wav',
        'audio/ogg',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'application/zip',
        'application/x-rar-compressed'
    ]
)
ON CONFLICT (id) DO NOTHING;

-- 2. Create storage policies for the media bucket

-- Allow authenticated users (admins) to upload files
CREATE POLICY "Allow authenticated users to upload files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'media' AND
        auth.role() = 'authenticated'
    );

-- Allow authenticated users (admins) to update files
CREATE POLICY "Allow authenticated users to update files" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'media' AND
        auth.role() = 'authenticated'
    );

-- Allow authenticated users (admins) to delete files
CREATE POLICY "Allow authenticated users to delete files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'media' AND
        auth.role() = 'authenticated'
    );

-- Allow public read access to all files in media bucket
CREATE POLICY "Allow public read access" ON storage.objects
    FOR SELECT USING (bucket_id = 'media');

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Storage bucket and policies created successfully!';
    RAISE NOTICE 'Media bucket is now ready for file uploads';
END $$;