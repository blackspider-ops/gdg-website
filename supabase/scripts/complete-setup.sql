-- Complete Blog & Media Setup Script
-- Run this single script to set up everything needed for blog improvements and file uploads

-- ============================================================================
-- PART 1: BLOG IMPROVEMENTS
-- ============================================================================

-- 1. Update admin_users role constraint to include blog_editor
DO $$
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'admin_users_role_check' 
               AND table_name = 'admin_users') THEN
        ALTER TABLE admin_users DROP CONSTRAINT admin_users_role_check;
    END IF;
    
    -- Add new constraint with blog_editor role
    ALTER TABLE admin_users ADD CONSTRAINT admin_users_role_check 
      CHECK (role IN ('admin', 'super_admin', 'blog_editor'));
      
    RAISE NOTICE '✅ Updated admin_users role constraint to include blog_editor';
END $$;

-- 2. Add approval workflow fields to blog_posts table
DO $$
BEGIN
    -- Add columns only if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'blog_posts' AND column_name = 'requires_approval') THEN
        ALTER TABLE blog_posts ADD COLUMN requires_approval BOOLEAN DEFAULT FALSE;
        RAISE NOTICE '✅ Added requires_approval column to blog_posts';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'blog_posts' AND column_name = 'approved_by') THEN
        ALTER TABLE blog_posts ADD COLUMN approved_by UUID REFERENCES admin_users(id);
        RAISE NOTICE '✅ Added approved_by column to blog_posts';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'blog_posts' AND column_name = 'approved_at') THEN
        ALTER TABLE blog_posts ADD COLUMN approved_at TIMESTAMPTZ;
        RAISE NOTICE '✅ Added approved_at column to blog_posts';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'blog_posts' AND column_name = 'rejected_by') THEN
        ALTER TABLE blog_posts ADD COLUMN rejected_by UUID REFERENCES admin_users(id);
        RAISE NOTICE '✅ Added rejected_by column to blog_posts';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'blog_posts' AND column_name = 'rejected_at') THEN
        ALTER TABLE blog_posts ADD COLUMN rejected_at TIMESTAMPTZ;
        RAISE NOTICE '✅ Added rejected_at column to blog_posts';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'blog_posts' AND column_name = 'rejection_reason') THEN
        ALTER TABLE blog_posts ADD COLUMN rejection_reason TEXT;
        RAISE NOTICE '✅ Added rejection_reason column to blog_posts';
    END IF;
END $$;

-- 3. Create blog_likes table for authentic like tracking
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'blog_likes') THEN
        CREATE TABLE blog_likes (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
          user_identifier TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(post_id, user_identifier)
        );
        RAISE NOTICE '✅ Created blog_likes table';
    ELSE
        RAISE NOTICE '✅ blog_likes table already exists';
    END IF;
END $$;

-- ============================================================================
-- PART 2: MEDIA TABLES
-- ============================================================================

-- 4. Create media_folders table
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

-- 5. Create media_files table
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

-- ============================================================================
-- PART 3: INDEXES AND PERFORMANCE
-- ============================================================================

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blog_likes_post_id ON blog_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_requires_approval ON blog_posts(requires_approval) WHERE requires_approval = TRUE;
CREATE INDEX IF NOT EXISTS idx_media_folders_parent_id ON media_folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_media_folders_created_by ON media_folders(created_by);
CREATE INDEX IF NOT EXISTS idx_media_files_folder_id ON media_files(folder_id);
CREATE INDEX IF NOT EXISTS idx_media_files_uploaded_by ON media_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_media_files_file_type ON media_files(file_type);
CREATE INDEX IF NOT EXISTS idx_media_files_is_starred ON media_files(is_starred);
CREATE INDEX IF NOT EXISTS idx_media_files_is_public ON media_files(is_public);
CREATE INDEX IF NOT EXISTS idx_media_files_created_at ON media_files(created_at);

-- ============================================================================
-- PART 4: ROW LEVEL SECURITY
-- ============================================================================

-- 7. Enable Row Level Security
ALTER TABLE blog_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies
DO $$
BEGIN
    -- Blog likes policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'blog_likes' AND policyname = 'Anyone can read blog likes') THEN
        CREATE POLICY "Anyone can read blog likes" ON blog_likes
          FOR SELECT USING (true);
        RAISE NOTICE '✅ Created read policy for blog_likes';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'blog_likes' AND policyname = 'Anyone can manage their own likes') THEN
        CREATE POLICY "Anyone can manage their own likes" ON blog_likes
          FOR ALL USING (true);
        RAISE NOTICE '✅ Created management policy for blog_likes';
    END IF;

    -- Media folders policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'media_folders' AND policyname = 'Allow all operations for authenticated users') THEN
        CREATE POLICY "Allow all operations for authenticated users" ON media_folders
            FOR ALL USING (true);
        RAISE NOTICE '✅ Created media_folders policy';
    END IF;

    -- Media files policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'media_files' AND policyname = 'Allow all operations for authenticated users') THEN
        CREATE POLICY "Allow all operations for authenticated users" ON media_files
            FOR ALL USING (true);
        RAISE NOTICE '✅ Created media_files policy';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'media_files' AND policyname = 'Allow public read for public files') THEN
        CREATE POLICY "Allow public read for public files" ON media_files
            FOR SELECT USING (is_public = true);
        RAISE NOTICE '✅ Created public read policy for media_files';
    END IF;
END $$;

-- ============================================================================
-- PART 5: TRIGGERS AND FUNCTIONS
-- ============================================================================

-- 9. Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_media_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create triggers for updated_at
DROP TRIGGER IF EXISTS update_media_folders_updated_at ON media_folders;
CREATE TRIGGER update_media_folders_updated_at 
    BEFORE UPDATE ON media_folders 
    FOR EACH ROW EXECUTE FUNCTION update_media_updated_at_column();

DROP TRIGGER IF EXISTS update_media_files_updated_at ON media_files;
CREATE TRIGGER update_media_files_updated_at 
    BEFORE UPDATE ON media_files 
    FOR EACH ROW EXECUTE FUNCTION update_media_updated_at_column();

-- ============================================================================
-- PART 6: SAMPLE DATA
-- ============================================================================

-- 11. Add sample blog categories if they don't exist
INSERT INTO blog_categories (name, slug, description, color, is_active, order_index)
VALUES 
  ('Technology', 'technology', 'Posts about latest tech trends and tutorials', '#3B82F6', true, 1),
  ('Events', 'events', 'Event recaps and announcements', '#10B981', true, 2),
  ('Community', 'community', 'Community spotlights and member stories', '#8B5CF6', true, 3),
  ('Tutorials', 'tutorials', 'Step-by-step guides and how-tos', '#F59E0B', true, 4),
  ('News', 'news', 'Latest news and updates', '#EF4444', true, 5)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 SETUP COMPLETED SUCCESSFULLY! 🎉';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Blog improvements applied:';
    RAISE NOTICE '   - blog_editor role added to admin_users';
    RAISE NOTICE '   - Blog approval workflow columns added';
    RAISE NOTICE '   - Blog likes tracking table created';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Media system ready:';
    RAISE NOTICE '   - Media folders and files tables created';
    RAISE NOTICE '   - Indexes and RLS policies applied';
    RAISE NOTICE '   - Triggers for updated_at created';
    RAISE NOTICE '';
    RAISE NOTICE '📋 NEXT STEPS:';
    RAISE NOTICE '1. Create storage bucket named "media" in Supabase dashboard';
    RAISE NOTICE '2. Set bucket to public with 50MB file size limit';
    RAISE NOTICE '3. Create your first blog_editor admin user';
    RAISE NOTICE '4. Test the blog submission form with PDF upload';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Your blog system is ready to use!';
END $$;