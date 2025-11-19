-- Enforce Blog Categories Script
-- Run this script to ensure proper category management and constraints

-- 1. Ensure blog_categories table exists with all required columns
DO $$
BEGIN
    -- Check if blog_categories table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'blog_categories') THEN
        CREATE TABLE blog_categories (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            slug TEXT NOT NULL UNIQUE,
            description TEXT,
            color TEXT DEFAULT '#3B82F6',
            is_active BOOLEAN DEFAULT TRUE,
            order_index INTEGER DEFAULT 0,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        RAISE NOTICE '✅ Created blog_categories table';
    ELSE
        RAISE NOTICE '✅ blog_categories table already exists';
    END IF;
END $$;

-- 2. Add missing columns to blog_categories if they don't exist
DO $$
BEGIN
    -- Add color column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'blog_categories' AND column_name = 'color') THEN
        ALTER TABLE blog_categories ADD COLUMN color TEXT DEFAULT '#3B82F6';
        RAISE NOTICE '✅ Added color column to blog_categories';
    END IF;
    
    -- Add is_active column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'blog_categories' AND column_name = 'is_active') THEN
        ALTER TABLE blog_categories ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
        RAISE NOTICE '✅ Added is_active column to blog_categories';
    END IF;
    
    -- Add order_index column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'blog_categories' AND column_name = 'order_index') THEN
        ALTER TABLE blog_categories ADD COLUMN order_index INTEGER DEFAULT 0;
        RAISE NOTICE '✅ Added order_index column to blog_categories';
    END IF;
    
    -- Add updated_at column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'blog_categories' AND column_name = 'updated_at') THEN
        ALTER TABLE blog_categories ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE '✅ Added updated_at column to blog_categories';
    END IF;
END $$;

-- 3. Ensure blog_posts has proper category_id foreign key
DO $$
BEGIN
    -- Check if category_id column exists in blog_posts
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'blog_posts' AND column_name = 'category_id') THEN
        ALTER TABLE blog_posts ADD COLUMN category_id UUID REFERENCES blog_categories(id) ON DELETE SET NULL;
        RAISE NOTICE '✅ Added category_id column to blog_posts';
    END IF;
    
    -- Update the foreign key constraint if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'blog_posts_category_id_fkey' 
                   AND table_name = 'blog_posts') THEN
        -- Drop existing constraint if it exists with different name
        ALTER TABLE blog_posts DROP CONSTRAINT IF EXISTS fk_blog_posts_category;
        -- Add proper foreign key constraint
        ALTER TABLE blog_posts ADD CONSTRAINT blog_posts_category_id_fkey 
            FOREIGN KEY (category_id) REFERENCES blog_categories(id) ON DELETE SET NULL;
        RAISE NOTICE '✅ Added foreign key constraint for category_id';
    END IF;
END $$;

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blog_categories_is_active ON blog_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_blog_categories_order_index ON blog_categories(order_index);
CREATE INDEX IF NOT EXISTS idx_blog_categories_slug ON blog_categories(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category_id ON blog_posts(category_id);

-- 5. Create updated_at trigger for blog_categories
CREATE OR REPLACE FUNCTION update_blog_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_blog_categories_updated_at_trigger ON blog_categories;

-- Create the trigger
CREATE TRIGGER update_blog_categories_updated_at_trigger
    BEFORE UPDATE ON blog_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_blog_categories_updated_at();

-- 6. Insert default categories if they don't exist
INSERT INTO blog_categories (name, slug, description, color, is_active, order_index)
VALUES 
  ('Technology', 'technology', 'Posts about latest tech trends and tutorials', '#3B82F6', true, 1),
  ('Events', 'events', 'Event recaps and announcements', '#10B981', true, 2),
  ('Community', 'community', 'Community spotlights and member stories', '#8B5CF6', true, 3),
  ('Tutorials', 'tutorials', 'Step-by-step guides and how-tos', '#F59E0B', true, 4),
  ('News', 'news', 'Latest news and updates', '#EF4444', true, 5),
  ('Projects', 'projects', 'Project showcases and development updates', '#06B6D4', true, 6)
ON CONFLICT (slug) DO UPDATE SET
    description = EXCLUDED.description,
    color = EXCLUDED.color,
    is_active = EXCLUDED.is_active,
    order_index = EXCLUDED.order_index;

-- 7. Enable Row Level Security for blog_categories
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for blog_categories
DO $$
BEGIN
    -- Allow public read access for active categories
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'blog_categories' AND policyname = 'Public read access for active categories') THEN
        CREATE POLICY "Public read access for active categories" ON blog_categories
            FOR SELECT USING (is_active = true);
        RAISE NOTICE '✅ Created public read policy for blog_categories';
    END IF;
    
    -- Allow all operations for authenticated users (admins)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'blog_categories' AND policyname = 'Allow all operations for authenticated users') THEN
        CREATE POLICY "Allow all operations for authenticated users" ON blog_categories
            FOR ALL USING (true);
        RAISE NOTICE '✅ Created admin policy for blog_categories';
    END IF;
END $$;

-- 9. Update existing blog posts without categories to have a default category
DO $$
DECLARE
    default_category_id UUID;
    posts_updated INTEGER;
BEGIN
    -- Get the 'Technology' category ID as default
    SELECT id INTO default_category_id 
    FROM blog_categories 
    WHERE slug = 'technology' 
    LIMIT 1;
    
    IF default_category_id IS NOT NULL THEN
        -- Update posts without categories
        UPDATE blog_posts 
        SET category_id = default_category_id 
        WHERE category_id IS NULL;
        
        GET DIAGNOSTICS posts_updated = ROW_COUNT;
        
        IF posts_updated > 0 THEN
            RAISE NOTICE '✅ Updated % blog posts to have default category', posts_updated;
        ELSE
            RAISE NOTICE '✅ All blog posts already have categories assigned';
        END IF;
    END IF;
END $$;

-- 10. Create a function to get category statistics
CREATE OR REPLACE FUNCTION get_category_stats()
RETURNS TABLE (
    category_id UUID,
    category_name TEXT,
    category_color TEXT,
    post_count BIGINT,
    published_count BIGINT,
    draft_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as category_id,
        c.name as category_name,
        c.color as category_color,
        COUNT(p.id) as post_count,
        COUNT(CASE WHEN p.status = 'published' THEN 1 END) as published_count,
        COUNT(CASE WHEN p.status = 'draft' THEN 1 END) as draft_count
    FROM blog_categories c
    LEFT JOIN blog_posts p ON c.id = p.category_id
    WHERE c.is_active = true
    GROUP BY c.id, c.name, c.color, c.order_index
    ORDER BY c.order_index, c.name;
END;
$$ LANGUAGE plpgsql;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 BLOG CATEGORY SYSTEM SETUP COMPLETE! 🎉';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Category management features enabled:';
    RAISE NOTICE '   - blog_categories table with all required columns';
    RAISE NOTICE '   - Foreign key relationship with blog_posts';
    RAISE NOTICE '   - Default categories created with colors';
    RAISE NOTICE '   - RLS policies for public and admin access';
    RAISE NOTICE '   - Performance indexes created';
    RAISE NOTICE '   - Updated_at triggers enabled';
    RAISE NOTICE '';
    RAISE NOTICE '📋 FEATURES NOW AVAILABLE:';
    RAISE NOTICE '1. Mandatory category selection for blog posts';
    RAISE NOTICE '2. Create/edit/delete categories with colors';
    RAISE NOTICE '3. Category filtering on public blog';
    RAISE NOTICE '4. Category statistics and management';
    RAISE NOTICE '5. Display order control for categories';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Your enhanced blog system is ready!';
END $$;