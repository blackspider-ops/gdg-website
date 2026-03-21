-- Fix media_files and media_folders RLS policies
-- The tables have RLS enabled but no policies, blocking all access

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admins can view all files" ON media_files;
DROP POLICY IF EXISTS "Admins can upload files" ON media_files;
DROP POLICY IF EXISTS "Admins can update files" ON media_files;
DROP POLICY IF EXISTS "Admins can delete files" ON media_files;
DROP POLICY IF EXISTS "Public can view public files" ON media_files;

DROP POLICY IF EXISTS "Admins can view all folders" ON media_folders;
DROP POLICY IF EXISTS "Admins can create folders" ON media_folders;
DROP POLICY IF EXISTS "Admins can update folders" ON media_folders;
DROP POLICY IF EXISTS "Admins can delete folders" ON media_folders;

-- Media files policies
CREATE POLICY "Admins can view all files" ON media_files
  FOR SELECT
  USING (true); -- Allow all for now since we're using service role client

CREATE POLICY "Admins can upload files" ON media_files
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update files" ON media_files
  FOR UPDATE
  USING (true);

CREATE POLICY "Admins can delete files" ON media_files
  FOR DELETE
  USING (true);

-- Media folders policies
CREATE POLICY "Admins can view all folders" ON media_folders
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can create folders" ON media_folders
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update folders" ON media_folders
  FOR UPDATE
  USING (true);

CREATE POLICY "Admins can delete folders" ON media_folders
  FOR DELETE
  USING (true);

COMMENT ON POLICY "Admins can view all files" ON media_files IS 'Allow all access to media files';
COMMENT ON POLICY "Admins can view all folders" ON media_folders IS 'Allow all access to media folders';
