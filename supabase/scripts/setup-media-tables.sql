-- Media Tables Setup Script
-- Run this script to ensure media tables exist for file uploads

-- 1. Create media_folders table
CREATE TABLE IF NOT EXISTS media_folders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    parent_id UUID REFERENCES media_folders(id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create media_files table
CREATE TABLE IF NOT EXISTS media_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video', 'audio', 'document', 'archive', 'other')),
    mime_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_path TEXT NOT NULL UNIQUE,
    thumbnail_path TEXT,
    folder_id UUID REFERENCES media_folders(id) ON DELETE SET NULL,
    uploaded_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    width INTEGER,
    height INTEGER,
    duration INTEGER,
    is_starred BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE,
    alt_text TEXT,
    description TEXT,
    tags TEXT[] DEFAULT '{}',
    seo_title TEXT,
    seo_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_media_folders_parent_id ON media_folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_media_folders_created_by ON media_folders(created_by);
CREATE INDEX IF NOT EXISTS idx_media_files_folder_id ON media_files(folder_id);
CREATE INDEX IF NOT EXISTS idx_media_files_uploaded_by ON media_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_media_files_file_type ON media_files(file_type);
CREATE INDEX IF NOT EXISTS idx_media_files_is_starred ON media_files(is_starred);
CREATE INDEX IF NOT EXISTS idx_media_files_is_public ON media_files(is_public);
CREATE INDEX IF NOT EXISTS idx_media_files_created_at ON media_files(created_at);

-- 4. Enable Row Level Security
ALTER TABLE media_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for media_folders
DO $$
BEGIN
    -- Allow all operations for authenticated users (admins)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'media_folders' AND policyname = 'Allow all operations for authenticated users') THEN
        CREATE POLICY "Allow all operations for authenticated users" ON media_folders
            FOR ALL USING (true);
    END IF;
END $$;

-- 6. Create RLS policies for media_files
DO $$
BEGIN
    -- Allow all operations for authenticated users (admins)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'media_files' AND policyname = 'Allow all operations for authenticated users') THEN
        CREATE POLICY "Allow all operations for authenticated users" ON media_files
            FOR ALL USING (true);
    END IF;
    
    -- Allow public read access for public files
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'media_files' AND policyname = 'Allow public read for public files') THEN
        CREATE POLICY "Allow public read for public files" ON media_files
            FOR SELECT USING (is_public = true);
    END IF;
END $$;

-- 7. Create storage bucket for media files (if it doesn't exist)
-- Note: This needs to be done through the Supabase dashboard or using the management API
-- The bucket should be named 'media' with public access for public files

-- 8. Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_media_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Create triggers for updated_at
DROP TRIGGER IF EXISTS update_media_folders_updated_at ON media_folders;
CREATE TRIGGER update_media_folders_updated_at 
    BEFORE UPDATE ON media_folders 
    FOR EACH ROW EXECUTE FUNCTION update_media_updated_at_column();

DROP TRIGGER IF EXISTS update_media_files_updated_at ON media_files;
CREATE TRIGGER update_media_files_updated_at 
    BEFORE UPDATE ON media_files 
    FOR EACH ROW EXECUTE FUNCTION update_media_updated_at_column();

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Media tables setup completed successfully!';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Create a storage bucket named "media" in Supabase dashboard';
    RAISE NOTICE '2. Set appropriate storage policies for the bucket';
    RAISE NOTICE '3. Test file upload functionality';
END $$;