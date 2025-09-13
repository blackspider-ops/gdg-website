-- Create comprehensive media management system

-- Media folders table
CREATE TABLE IF NOT EXISTS media_folders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    parent_id UUID REFERENCES media_folders(id) ON DELETE CASCADE,
    path TEXT NOT NULL, -- Full path for easy querying
    description TEXT,
    created_by UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Media files table
CREATE TABLE IF NOT EXISTS media_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL, -- image, video, audio, document, archive
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL, -- Size in bytes
    file_path TEXT NOT NULL, -- Storage path
    thumbnail_path TEXT, -- Thumbnail for images/videos
    folder_id UUID REFERENCES media_folders(id) ON DELETE SET NULL,
    uploaded_by UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    
    -- File metadata
    width INTEGER, -- For images/videos
    height INTEGER, -- For images/videos
    duration INTEGER, -- For videos/audio (in seconds)
    
    -- File status and organization
    is_starred BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE, -- Whether file can be accessed publicly
    alt_text TEXT, -- For accessibility
    description TEXT,
    tags JSONB DEFAULT '[]',
    
    -- SEO and web optimization
    seo_title VARCHAR(255),
    seo_description TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Media usage tracking (where files are used)
CREATE TABLE IF NOT EXISTS media_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    file_id UUID NOT NULL REFERENCES media_files(id) ON DELETE CASCADE,
    usage_type VARCHAR(50) NOT NULL, -- event_image, sponsor_logo, team_photo, etc.
    reference_id UUID, -- ID of the entity using this file
    reference_table VARCHAR(50), -- Table name of the entity
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_media_folders_parent_id ON media_folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_media_folders_path ON media_folders(path);
CREATE INDEX IF NOT EXISTS idx_media_folders_created_by ON media_folders(created_by);

CREATE INDEX IF NOT EXISTS idx_media_files_folder_id ON media_files(folder_id);
CREATE INDEX IF NOT EXISTS idx_media_files_file_type ON media_files(file_type);
CREATE INDEX IF NOT EXISTS idx_media_files_uploaded_by ON media_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_media_files_is_starred ON media_files(is_starred);
CREATE INDEX IF NOT EXISTS idx_media_files_is_public ON media_files(is_public);
CREATE INDEX IF NOT EXISTS idx_media_files_created_at ON media_files(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_files_tags ON media_files USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_media_usage_file_id ON media_usage(file_id);
CREATE INDEX IF NOT EXISTS idx_media_usage_reference ON media_usage(reference_table, reference_id);

-- Enable RLS
ALTER TABLE media_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for media_folders
CREATE POLICY "Admins can view all folders" ON media_folders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.is_active = true
        )
    );

CREATE POLICY "Admins can create folders" ON media_folders
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.is_active = true
        )
    );

CREATE POLICY "Admins can update folders" ON media_folders
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.is_active = true
        )
    );

CREATE POLICY "Admins can delete folders" ON media_folders
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.is_active = true
        )
    );

-- RLS Policies for media_files
CREATE POLICY "Admins can view all files" ON media_files
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.is_active = true
        )
    );

CREATE POLICY "Admins can upload files" ON media_files
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.is_active = true
        )
    );

CREATE POLICY "Admins can update files" ON media_files
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.is_active = true
        )
    );

CREATE POLICY "Admins can delete files" ON media_files
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.is_active = true
        )
    );

-- RLS Policies for media_usage
CREATE POLICY "Admins can manage media usage" ON media_usage
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.is_active = true
        )
    );

-- Functions to automatically update timestamps
CREATE OR REPLACE FUNCTION update_media_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_media_folders_updated_at 
    BEFORE UPDATE ON media_folders 
    FOR EACH ROW EXECUTE FUNCTION update_media_updated_at_column();

CREATE TRIGGER update_media_files_updated_at 
    BEFORE UPDATE ON media_files 
    FOR EACH ROW EXECUTE FUNCTION update_media_updated_at_column();

-- Function to update folder paths when parent changes
CREATE OR REPLACE FUNCTION update_folder_path()
RETURNS TRIGGER AS $$
DECLARE
    parent_path TEXT;
BEGIN
    IF NEW.parent_id IS NULL THEN
        NEW.path = NEW.name;
    ELSE
        SELECT path INTO parent_path FROM media_folders WHERE id = NEW.parent_id;
        NEW.path = parent_path || '/' || NEW.name;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for folder path updates
CREATE TRIGGER update_folder_path_trigger
    BEFORE INSERT OR UPDATE ON media_folders
    FOR EACH ROW EXECUTE FUNCTION update_folder_path();

-- Function to get file type from mime type
CREATE OR REPLACE FUNCTION get_file_type_from_mime(mime_type TEXT)
RETURNS TEXT AS $$
BEGIN
    CASE 
        WHEN mime_type LIKE 'image/%' THEN RETURN 'image';
        WHEN mime_type LIKE 'video/%' THEN RETURN 'video';
        WHEN mime_type LIKE 'audio/%' THEN RETURN 'audio';
        WHEN mime_type IN ('application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain') THEN RETURN 'document';
        WHEN mime_type LIKE 'application/zip%' OR mime_type LIKE 'application/x-%' THEN RETURN 'archive';
        ELSE RETURN 'other';
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Add sample data if admin users exist
DO $$
DECLARE
    admin_user_id UUID;
    folder_id_1 UUID;
    folder_id_2 UUID;
    folder_id_3 UUID;
BEGIN
    -- Get the first admin user
    SELECT id INTO admin_user_id FROM admin_users WHERE is_active = true LIMIT 1;
    
    IF admin_user_id IS NOT NULL THEN
        -- Create sample folders
        INSERT INTO media_folders (name, parent_id, created_by) VALUES
        ('Event Photos', NULL, admin_user_id) RETURNING id INTO folder_id_1;
        
        INSERT INTO media_folders (name, parent_id, created_by) VALUES
        ('Sponsor Logos', NULL, admin_user_id) RETURNING id INTO folder_id_2;
        
        INSERT INTO media_folders (name, parent_id, created_by) VALUES
        ('Documents', NULL, admin_user_id) RETURNING id INTO folder_id_3;
        
        -- Create subfolder
        INSERT INTO media_folders (name, parent_id, created_by) VALUES
        ('Hackathon 2024', folder_id_1, admin_user_id);
        
        -- Create sample files (these would normally be created when files are uploaded)
        INSERT INTO media_files (
            name, original_name, file_type, mime_type, file_size, file_path, 
            folder_id, uploaded_by, width, height, is_starred, description
        ) VALUES
        (
            'hackathon-banner-2024.jpg', 'hackathon-banner-2024.jpg', 'image', 'image/jpeg', 
            2516582, '/uploads/hackathon-banner-2024.jpg', folder_id_1, admin_user_id, 
            1920, 1080, true, 'Main banner for Hackathon 2024 event'
        ),
        (
            'microsoft-logo.png', 'microsoft-logo.png', 'image', 'image/png',
            159744, '/uploads/microsoft-logo.png', folder_id_2, admin_user_id,
            512, 512, false, 'Microsoft sponsor logo'
        ),
        (
            'member-handbook.pdf', 'member-handbook.pdf', 'document', 'application/pdf',
            1887436, '/uploads/member-handbook.pdf', folder_id_3, admin_user_id,
            NULL, NULL, true, 'Official member handbook and guidelines'
        );
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON TABLE media_folders IS 'Hierarchical folder structure for organizing media files';
COMMENT ON TABLE media_files IS 'Media files with metadata and organization information';
COMMENT ON TABLE media_usage IS 'Tracks where media files are used throughout the application';

COMMENT ON COLUMN media_files.file_type IS 'Categorized file type: image, video, audio, document, archive, other';
COMMENT ON COLUMN media_files.is_public IS 'Whether file can be accessed without authentication';
COMMENT ON COLUMN media_files.tags IS 'JSON array of tags for categorization and search';
COMMENT ON COLUMN media_folders.path IS 'Full hierarchical path for easy querying and breadcrumbs';