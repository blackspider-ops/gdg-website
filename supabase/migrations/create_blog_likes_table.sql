-- Create blog_likes table to track individual likes
CREATE TABLE IF NOT EXISTS blog_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  user_identifier TEXT NOT NULL, -- Could be IP address, session ID, or user ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique constraint to prevent duplicate likes from same user
CREATE UNIQUE INDEX IF NOT EXISTS blog_likes_post_user_unique 
ON blog_likes(post_id, user_identifier);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS blog_likes_post_id_idx ON blog_likes(post_id);
CREATE INDEX IF NOT EXISTS blog_likes_created_at_idx ON blog_likes(created_at);