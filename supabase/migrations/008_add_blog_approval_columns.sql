-- Add Blog Approval Workflow Columns
-- This migration adds columns needed for the blog editor approval workflow

-- Add approval workflow columns to blog_posts table
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'approved' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS pending_changes JSONB,
ADD COLUMN IF NOT EXISTS change_summary TEXT,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Create index for faster approval queries
CREATE INDEX IF NOT EXISTS idx_blog_posts_approval_status ON blog_posts(approval_status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_requires_approval ON blog_posts(requires_approval);

-- Update existing posts to have approved status
UPDATE blog_posts 
SET approval_status = 'approved', requires_approval = false 
WHERE approval_status IS NULL OR requires_approval IS NULL;