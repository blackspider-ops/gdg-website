-- Fix search_path security warnings for all functions
-- This prevents search path injection attacks by setting a stable search_path

-- Fix mark_overdue_tasks
DROP FUNCTION IF EXISTS mark_overdue_tasks();
CREATE OR REPLACE FUNCTION mark_overdue_tasks()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  marked_count INTEGER;
BEGIN
  UPDATE communications_tasks
  SET status = 'overdue'
  WHERE status = 'pending'
    AND due_date < NOW()
    AND due_date IS NOT NULL;
  
  GET DIAGNOSTICS marked_count = ROW_COUNT;
  RETURN marked_count;
END;
$$;

-- Fix check_and_mark_overdue_tasks
DROP FUNCTION IF EXISTS check_and_mark_overdue_tasks();
CREATE OR REPLACE FUNCTION check_and_mark_overdue_tasks()
RETURNS TABLE(marked_count INTEGER, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  count_marked INTEGER;
BEGIN
  count_marked := mark_overdue_tasks();
  RETURN QUERY SELECT count_marked, format('Marked %s tasks as overdue', count_marked);
END;
$$;

-- Fix update_media_updated_at_column
DROP FUNCTION IF EXISTS update_media_updated_at_column() CASCADE;
CREATE OR REPLACE FUNCTION update_media_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fix update_blog_updated_at_column (used by blog_categories)
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

-- Fix update_projects_updated_at
DROP FUNCTION IF EXISTS update_projects_updated_at() CASCADE;
CREATE OR REPLACE FUNCTION update_projects_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fix is_admin_authenticated
DROP FUNCTION IF EXISTS is_admin_authenticated();
CREATE OR REPLACE FUNCTION is_admin_authenticated()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
    AND is_active = true
  );
END;
$$;

-- Fix is_admin_user
DROP FUNCTION IF EXISTS is_admin_user();
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
    AND is_active = true
  );
END;
$$;

-- Fix update_blog_post_comment_count
DROP FUNCTION IF EXISTS update_blog_post_comment_count() CASCADE;
CREATE OR REPLACE FUNCTION update_blog_post_comment_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE blog_posts
    SET comment_count = comment_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE blog_posts
    SET comment_count = GREATEST(0, comment_count - 1)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Fix update_blog_submission_comments_updated_at_column
DROP FUNCTION IF EXISTS update_blog_submission_comments_updated_at_column() CASCADE;
CREATE OR REPLACE FUNCTION update_blog_submission_comments_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fix update_project_stars_count
DROP FUNCTION IF EXISTS update_project_stars_count() CASCADE;
CREATE OR REPLACE FUNCTION update_project_stars_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE projects
    SET stars_count = stars_count + 1
    WHERE id = NEW.project_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE projects
    SET stars_count = GREATEST(0, stars_count - 1)
    WHERE id = OLD.project_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Fix get_category_stats (if it exists)
DROP FUNCTION IF EXISTS get_category_stats();
CREATE OR REPLACE FUNCTION get_category_stats()
RETURNS TABLE(
  category_id UUID,
  category_name TEXT,
  post_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bc.id as category_id,
    bc.name as category_name,
    COUNT(bp.id) as post_count
  FROM blog_categories bc
  LEFT JOIN blog_posts bp ON bc.id = bp.category_id
  WHERE bc.is_active = true
  GROUP BY bc.id, bc.name
  ORDER BY bc.name;
END;
$$;
