-- Recreate triggers that were dropped when fixing function search paths
-- Only create triggers for tables that exist

DO $$
BEGIN
  -- Blog categories trigger
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'blog_categories') THEN
    DROP TRIGGER IF EXISTS update_blog_categories_updated_at ON blog_categories;
    CREATE TRIGGER update_blog_categories_updated_at
      BEFORE UPDATE ON blog_categories
      FOR EACH ROW
      EXECUTE FUNCTION update_blog_updated_at_column();
  END IF;

  -- Blog posts trigger
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'blog_posts') THEN
    DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON blog_posts;
    CREATE TRIGGER update_blog_posts_updated_at
      BEFORE UPDATE ON blog_posts
      FOR EACH ROW
      EXECUTE FUNCTION update_blog_updated_at_column();
  END IF;

  -- Blog comments trigger
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'blog_comments') THEN
    DROP TRIGGER IF EXISTS update_blog_comments_updated_at ON blog_comments;
    CREATE TRIGGER update_blog_comments_updated_at
      BEFORE UPDATE ON blog_comments
      FOR EACH ROW
      EXECUTE FUNCTION update_blog_updated_at_column();
  END IF;

  -- Projects trigger
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects') THEN
    DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
    CREATE TRIGGER update_projects_updated_at
      BEFORE UPDATE ON projects
      FOR EACH ROW
      EXECUTE FUNCTION update_projects_updated_at();
  END IF;

  -- Blog submission comments trigger
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'blog_submission_comments') THEN
    DROP TRIGGER IF EXISTS update_blog_submission_comments_updated_at ON blog_submission_comments;
    CREATE TRIGGER update_blog_submission_comments_updated_at
      BEFORE UPDATE ON blog_submission_comments
      FOR EACH ROW
      EXECUTE FUNCTION update_blog_submission_comments_updated_at_column();
  END IF;

  -- Blog post comment count triggers
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'blog_comments') THEN
    DROP TRIGGER IF EXISTS update_blog_post_comment_count_insert ON blog_comments;
    CREATE TRIGGER update_blog_post_comment_count_insert
      AFTER INSERT ON blog_comments
      FOR EACH ROW
      EXECUTE FUNCTION update_blog_post_comment_count();

    DROP TRIGGER IF EXISTS update_blog_post_comment_count_delete ON blog_comments;
    CREATE TRIGGER update_blog_post_comment_count_delete
      AFTER DELETE ON blog_comments
      FOR EACH ROW
      EXECUTE FUNCTION update_blog_post_comment_count();
  END IF;

  -- Project stars count triggers
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'project_stars') THEN
    DROP TRIGGER IF EXISTS update_project_stars_count_insert ON project_stars;
    CREATE TRIGGER update_project_stars_count_insert
      AFTER INSERT ON project_stars
      FOR EACH ROW
      EXECUTE FUNCTION update_project_stars_count();

    DROP TRIGGER IF EXISTS update_project_stars_count_delete ON project_stars;
    CREATE TRIGGER update_project_stars_count_delete
      AFTER DELETE ON project_stars
      FOR EACH ROW
      EXECUTE FUNCTION update_project_stars_count();
  END IF;
END $$;
