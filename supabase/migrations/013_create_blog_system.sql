-- Blog System Migration
-- This creates tables for managing blog posts and categories

-- Blog categories table
CREATE TABLE IF NOT EXISTS blog_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT DEFAULT '#3B82F6',
    is_active BOOLEAN DEFAULT TRUE,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blog posts table
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    excerpt TEXT,
    content TEXT NOT NULL,
    featured_image_url TEXT,
    author_name TEXT NOT NULL,
    author_email TEXT,
    author_avatar_url TEXT,
    category_id UUID REFERENCES blog_categories(id) ON DELETE SET NULL,
    tags TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    is_featured BOOLEAN DEFAULT FALSE,
    read_time_minutes INTEGER DEFAULT 5,
    views_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES admin_users(id) ON DELETE SET NULL
);

-- Blog comments table (for future use)
CREATE TABLE IF NOT EXISTS blog_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    author_email TEXT NOT NULL,
    content TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT FALSE,
    parent_id UUID REFERENCES blog_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_featured ON blog_posts(is_featured);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_categories_slug ON blog_categories(slug);
CREATE INDEX IF NOT EXISTS idx_blog_comments_post ON blog_comments(post_id);

-- Insert default blog categories
INSERT INTO blog_categories (name, slug, description, color, order_index) VALUES
('Technology', 'technology', 'Latest tech trends and tutorials', '#3B82F6', 1),
('Workshops', 'workshops', 'Workshop recaps and learnings', '#10B981', 2),
('Events', 'events', 'Event announcements and summaries', '#F59E0B', 3),
('Community', 'community', 'Community highlights and stories', '#EF4444', 4),
('Tutorials', 'tutorials', 'Step-by-step guides and how-tos', '#8B5CF6', 5)
ON CONFLICT (slug) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blog system
DO $$
BEGIN
    -- Blog posts policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'blog_posts' AND policyname = 'Public read access for published blog posts') THEN
        CREATE POLICY "Public read access for published blog posts" ON blog_posts 
            FOR SELECT USING (status = 'published');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'blog_posts' AND policyname = 'Allow all operations on blog_posts for admins') THEN
        CREATE POLICY "Allow all operations on blog_posts for admins" ON blog_posts 
            FOR ALL USING (true);
    END IF;

    -- Blog categories policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'blog_categories' AND policyname = 'Public read access for active blog categories') THEN
        CREATE POLICY "Public read access for active blog categories" ON blog_categories 
            FOR SELECT USING (is_active = true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'blog_categories' AND policyname = 'Allow all operations on blog_categories for admins') THEN
        CREATE POLICY "Allow all operations on blog_categories for admins" ON blog_categories 
            FOR ALL USING (true);
    END IF;

    -- Blog comments policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'blog_comments' AND policyname = 'Allow all operations on blog_comments for admins') THEN
        CREATE POLICY "Allow all operations on blog_comments for admins" ON blog_comments 
            FOR ALL USING (true);
    END IF;
END $$;

-- Triggers for updated_at (function will be created in the DO block below)

-- Create triggers safely
DO $$
BEGIN
    -- Check if function exists, create if not
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_blog_updated_at_column') THEN
        CREATE OR REPLACE FUNCTION update_blog_updated_at_column()
        RETURNS TRIGGER AS $func$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql;
    END IF;

    -- Create triggers only if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_blog_categories_updated_at') THEN
        CREATE TRIGGER update_blog_categories_updated_at 
            BEFORE UPDATE ON blog_categories 
            FOR EACH ROW EXECUTE FUNCTION update_blog_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_blog_posts_updated_at') THEN
        CREATE TRIGGER update_blog_posts_updated_at 
            BEFORE UPDATE ON blog_posts 
            FOR EACH ROW EXECUTE FUNCTION update_blog_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_blog_comments_updated_at') THEN
        CREATE TRIGGER update_blog_comments_updated_at 
            BEFORE UPDATE ON blog_comments 
            FOR EACH ROW EXECUTE FUNCTION update_blog_updated_at_column();
    END IF;
END $$;

-- Function to increment blog post views (safe to run multiple times)
CREATE OR REPLACE FUNCTION increment_blog_views(post_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE blog_posts 
    SET views_count = COALESCE(views_count, 0) + 1 
    WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

COMMIT;