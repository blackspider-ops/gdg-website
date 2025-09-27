-- Blog Improvements Script
-- Run this script manually in your Supabase SQL editor

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
      
    RAISE NOTICE 'Updated admin_users role constraint to include blog_editor';
END $$;

-- 2. Add approval workflow fields to blog_posts table
DO $$
BEGIN
    -- Add columns only if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'blog_posts' AND column_name = 'requires_approval') THEN
        ALTER TABLE blog_posts ADD COLUMN requires_approval BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added requires_approval column to blog_posts';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'blog_posts' AND column_name = 'approved_by') THEN
        ALTER TABLE blog_posts ADD COLUMN approved_by UUID REFERENCES admin_users(id);
        RAISE NOTICE 'Added approved_by column to blog_posts';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'blog_posts' AND column_name = 'approved_at') THEN
        ALTER TABLE blog_posts ADD COLUMN approved_at TIMESTAMPTZ;
        RAISE NOTICE 'Added approved_at column to blog_posts';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'blog_posts' AND column_name = 'rejected_by') THEN
        ALTER TABLE blog_posts ADD COLUMN rejected_by UUID REFERENCES admin_users(id);
        RAISE NOTICE 'Added rejected_by column to blog_posts';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'blog_posts' AND column_name = 'rejected_at') THEN
        ALTER TABLE blog_posts ADD COLUMN rejected_at TIMESTAMPTZ;
        RAISE NOTICE 'Added rejected_at column to blog_posts';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'blog_posts' AND column_name = 'rejection_reason') THEN
        ALTER TABLE blog_posts ADD COLUMN rejection_reason TEXT;
        RAISE NOTICE 'Added rejection_reason column to blog_posts';
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
        RAISE NOTICE 'Created blog_likes table';
    ELSE
        RAISE NOTICE 'blog_likes table already exists';
    END IF;
END $$;

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blog_likes_post_id ON blog_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_requires_approval ON blog_posts(requires_approval) WHERE requires_approval = TRUE;

-- 5. Update RLS policies for blog_likes
DO $$
BEGIN
    -- Enable RLS if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'blog_likes') THEN
        ALTER TABLE blog_likes ENABLE ROW LEVEL SECURITY;
        
        -- Create policies only if they don't exist
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'blog_likes' AND policyname = 'Anyone can read blog likes') THEN
            CREATE POLICY "Anyone can read blog likes" ON blog_likes
              FOR SELECT USING (true);
            RAISE NOTICE 'Created read policy for blog_likes';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'blog_likes' AND policyname = 'Anyone can manage their own likes') THEN
            CREATE POLICY "Anyone can manage their own likes" ON blog_likes
              FOR ALL USING (true);
            RAISE NOTICE 'Created management policy for blog_likes';
        END IF;
    END IF;
END $$;

-- 6. Add some sample blog categories if they don't exist
INSERT INTO blog_categories (name, slug, description, color, is_active, order_index)
VALUES 
  ('Technology', 'technology', 'Posts about latest tech trends and tutorials', '#3B82F6', true, 1),
  ('Events', 'events', 'Event recaps and announcements', '#10B981', true, 2),
  ('Community', 'community', 'Community spotlights and member stories', '#8B5CF6', true, 3),
  ('Tutorials', 'tutorials', 'Step-by-step guides and how-tos', '#F59E0B', true, 4),
  ('News', 'news', 'Latest news and updates', '#EF4444', true, 5)
ON CONFLICT (slug) DO NOTHING;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Blog improvements applied successfully!';
    RAISE NOTICE 'You can now:';
    RAISE NOTICE '1. Create blog_editor admin users';
    RAISE NOTICE '2. Use the approval workflow for blog posts';
    RAISE NOTICE '3. Track authentic likes on blog posts';
END $$;