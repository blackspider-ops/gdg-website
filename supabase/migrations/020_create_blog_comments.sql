-- Create blog comments system
-- This migration creates tables for public blog post comments

-- Drop existing blog_comments table if it exists (from previous migration)
DROP TABLE IF EXISTS blog_comments CASCADE;

-- Blog comments table
CREATE TABLE blog_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL,
    author_name VARCHAR(100) NOT NULL,
    author_email VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT FALSE,
    is_flagged BOOLEAN DEFAULT FALSE,
    parent_comment_id UUID REFERENCES blog_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT blog_comments_content_length CHECK (char_length(content) >= 1 AND char_length(content) <= 2000),
    CONSTRAINT blog_comments_author_name_length CHECK (char_length(author_name) >= 1 AND char_length(author_name) <= 100),
    CONSTRAINT blog_comments_author_email_format CHECK (author_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Add foreign key constraint after table creation
ALTER TABLE blog_comments ADD CONSTRAINT fk_blog_comments_post_id 
    FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blog_comments_post_id ON blog_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_created_at ON blog_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_comments_approved ON blog_comments(is_approved);
CREATE INDEX IF NOT EXISTS idx_blog_comments_parent ON blog_comments(parent_comment_id);

-- Temporarily disable RLS for testing
-- We'll enable it later once we confirm the table works
-- ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;

-- Note: RLS is disabled for now to test basic functionality
-- TODO: Enable RLS and create proper policies once basic functionality works

-- Grant necessary permissions
GRANT SELECT, INSERT ON blog_comments TO anon;
GRANT SELECT, INSERT ON blog_comments TO authenticated;
GRANT ALL ON blog_comments TO service_role;

-- Grant usage on the sequence for the UUID generation
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Add comment count to blog_posts table
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;

-- Function to update comment count
CREATE OR REPLACE FUNCTION update_blog_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Only count approved comments
        IF NEW.is_approved = true THEN
            UPDATE blog_posts 
            SET comments_count = comments_count + 1 
            WHERE id = NEW.post_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle approval status changes
        IF OLD.is_approved = false AND NEW.is_approved = true THEN
            UPDATE blog_posts 
            SET comments_count = comments_count + 1 
            WHERE id = NEW.post_id;
        ELSIF OLD.is_approved = true AND NEW.is_approved = false THEN
            UPDATE blog_posts 
            SET comments_count = comments_count - 1 
            WHERE id = NEW.post_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Only decrease count if comment was approved
        IF OLD.is_approved = true THEN
            UPDATE blog_posts 
            SET comments_count = comments_count - 1 
            WHERE id = OLD.post_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for comment count updates
DROP TRIGGER IF EXISTS trigger_update_blog_post_comment_count ON blog_comments;
CREATE TRIGGER trigger_update_blog_post_comment_count
    AFTER INSERT OR UPDATE OR DELETE ON blog_comments
    FOR EACH ROW EXECUTE FUNCTION update_blog_post_comment_count();

-- Initialize comment counts for existing posts
UPDATE blog_posts 
SET comments_count = (
    SELECT COUNT(*) 
    FROM blog_comments 
    WHERE blog_comments.post_id = blog_posts.id 
    AND blog_comments.is_approved = true
);