-- Create blog_likes table for tracking likes
CREATE TABLE IF NOT EXISTS blog_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  user_identifier TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one like per user per post
  UNIQUE(post_id, user_identifier)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blog_likes_post_id ON blog_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_likes_user_identifier ON blog_likes(user_identifier);
CREATE INDEX IF NOT EXISTS idx_blog_likes_created_at ON blog_likes(created_at);

-- Enable RLS
ALTER TABLE blog_likes ENABLE ROW LEVEL SECURITY;

-- Create policies for blog likes
CREATE POLICY "Anyone can view blog likes" ON blog_likes
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert blog likes" ON blog_likes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can delete their own likes" ON blog_likes
  FOR DELETE USING (true);

-- Create a function to update like counts
CREATE OR REPLACE FUNCTION update_blog_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE blog_posts 
    SET likes_count = (
      SELECT COUNT(*) 
      FROM blog_likes 
      WHERE post_id = NEW.post_id
    )
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE blog_posts 
    SET likes_count = (
      SELECT COUNT(*) 
      FROM blog_likes 
      WHERE post_id = OLD.post_id
    )
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update like counts
CREATE TRIGGER blog_likes_insert_trigger
  AFTER INSERT ON blog_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_post_like_count();

CREATE TRIGGER blog_likes_delete_trigger
  AFTER DELETE ON blog_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_post_like_count();