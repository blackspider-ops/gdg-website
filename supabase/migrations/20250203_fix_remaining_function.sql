-- Fix the last remaining function search_path warning
-- Also fix increment_blog_views which was missed

-- Fix increment_blog_views
DROP FUNCTION IF EXISTS increment_blog_views(UUID);
CREATE OR REPLACE FUNCTION increment_blog_views(post_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE blog_posts 
  SET views_count = COALESCE(views_count, 0) + 1 
  WHERE id = post_id;
END;
$$;

-- Ensure update_blog_updated_at_column has search_path set
-- (This is what the trigger update_blog_categories_updated_at uses)
DROP FUNCTION IF EXISTS update_blog_updated_at_column() CASCADE;
CREATE OR REPLACE FUNCTION update_blog_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Recreate the triggers that use this function
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'blog_categories') THEN
    DROP TRIGGER IF EXISTS update_blog_categories_updated_at ON blog_categories;
    CREATE TRIGGER update_blog_categories_updated_at
      BEFORE UPDATE ON blog_categories
      FOR EACH ROW
      EXECUTE FUNCTION update_blog_updated_at_column();
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'blog_posts') THEN
    DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON blog_posts;
    CREATE TRIGGER update_blog_posts_updated_at
      BEFORE UPDATE ON blog_posts
      FOR EACH ROW
      EXECUTE FUNCTION update_blog_updated_at_column();
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'blog_comments') THEN
    DROP TRIGGER IF EXISTS update_blog_comments_updated_at ON blog_comments;
    CREATE TRIGGER update_blog_comments_updated_at
      BEFORE UPDATE ON blog_comments
      FOR EACH ROW
      EXECUTE FUNCTION update_blog_updated_at_column();
  END IF;
END $$;
