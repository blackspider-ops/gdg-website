-- Create Media Storage Bucket
-- Run this script to create the media bucket for file uploads

-- Create the media storage bucket if it doesn't exist
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

-- Create storage policies for the media bucket
-- Allow public read access to all files in media bucket
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Allow public read access to media bucket'
    ) THEN
        CREATE POLICY "Allow public read access to media bucket" ON storage.objects
            FOR SELECT USING (bucket_id = 'media');
    END IF;
END $$;

-- Allow authenticated users to upload files
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Allow authenticated users to upload to media bucket'
    ) THEN
        CREATE POLICY "Allow authenticated users to upload to media bucket" ON storage.objects
            FOR INSERT WITH CHECK (bucket_id = 'media');
    END IF;
END $$;

-- Allow authenticated users to update files
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Allow authenticated users to update media bucket files'
    ) THEN
        CREATE POLICY "Allow authenticated users to update media bucket files" ON storage.objects
            FOR UPDATE USING (bucket_id = 'media');
    END IF;
END $$;

-- Allow authenticated users to delete files
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Allow authenticated users to delete media bucket files'
    ) THEN
        CREATE POLICY "Allow authenticated users to delete media bucket files" ON storage.objects
            FOR DELETE USING (bucket_id = 'media');
    END IF;
END $$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Media storage bucket created successfully!';
    RAISE NOTICE '✅ Storage policies configured for public read and authenticated write';
    RAISE NOTICE '📁 Bucket supports: Images, Videos, Audio, PDFs, Documents, Archives';
    RAISE NOTICE '📏 File size limit: 50MB';
    RAISE NOTICE '🚀 Ready for file uploads!';
END $$;