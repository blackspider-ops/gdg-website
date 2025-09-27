-- Disable RLS for projects table to allow admin operations
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;

-- Also disable for project_stars to ensure consistency
ALTER TABLE project_stars DISABLE ROW LEVEL SECURITY;

-- Note: This makes the tables publicly accessible
-- For production, you should implement proper RLS policies later