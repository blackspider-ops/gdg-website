-- Fix blog_likes table and policies
-- This ensures the table exists and has proper policies

-- Create blog_likes table if it doesn't exist
CREATE TABLE IF NOT EXISTS blog_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  user_identifier TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_identifier)
);

-- Enable RLS
ALTER TABLE blog_likes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read blog likes" ON blog_likes;
DROP POLICY IF EXISTS "Anyone can manage their own likes" ON blog_likes;
DROP POLICY IF EXISTS "Anyone can insert likes" ON blog_likes;
DROP POLICY IF EXISTS "Anyone can delete their own likes" ON blog_likes;

-- Create permissive policies that allow all operations
CREATE POLICY "Enable read access for all users" ON blog_likes
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON blog_likes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable delete access for all users" ON blog_likes
  FOR DELETE USING (true);

CREATE POLICY "Enable update access for all users" ON blog_likes
  FOR UPDATE USING (true);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_blog_likes_post_id ON blog_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_likes_user_identifier ON blog_likes(user_identifier);

-- Grant permissions
GRANT ALL ON blog_likes TO authenticated;
GRANT ALL ON blog_likes TO anon;