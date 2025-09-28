-- Add comments system for blog submissions
-- This allows admins and blog editors to leave comments on submissions

-- Blog submission comments table
CREATE TABLE IF NOT EXISTS blog_submission_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    submission_id UUID NOT NULL REFERENCES blog_submissions(id) ON DELETE CASCADE,
    admin_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    comment_type TEXT DEFAULT 'general' CHECK (comment_type IN ('general', 'feedback', 'status_change', 'internal')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blog_submission_comments_submission_id ON blog_submission_comments(submission_id);
CREATE INDEX IF NOT EXISTS idx_blog_submission_comments_admin_id ON blog_submission_comments(admin_id);
CREATE INDEX IF NOT EXISTS idx_blog_submission_comments_created_at ON blog_submission_comments(created_at DESC);

-- Enable RLS
ALTER TABLE blog_submission_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blog submission comments
-- Since admin authentication is handled at the application level, we use permissive policies
-- The application ensures only authenticated admins can access these endpoints

CREATE POLICY "Allow all operations on blog_submission_comments" ON blog_submission_comments 
    FOR ALL USING (true);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_blog_submission_comments_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if it exists, then create it
DROP TRIGGER IF EXISTS update_blog_submission_comments_updated_at ON blog_submission_comments;
CREATE TRIGGER update_blog_submission_comments_updated_at 
    BEFORE UPDATE ON blog_submission_comments 
    FOR EACH ROW EXECUTE FUNCTION update_blog_submission_comments_updated_at_column();

-- Grant permissions
GRANT ALL ON blog_submission_comments TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE blog_submission_comments IS 'Comments and feedback on blog submissions from admins and blog editors';
COMMENT ON COLUMN blog_submission_comments.submission_id IS 'ID of the blog submission this comment belongs to';
COMMENT ON COLUMN blog_submission_comments.admin_id IS 'ID of the admin user who made the comment';
COMMENT ON COLUMN blog_submission_comments.comment_type IS 'Type of comment: general, feedback, status_change, internal';