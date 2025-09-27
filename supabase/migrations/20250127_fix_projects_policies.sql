-- Temporarily make projects table more permissive for debugging
DROP POLICY IF EXISTS "Admins can manage all projects" ON projects;

-- Create a more permissive policy for now
CREATE POLICY "Authenticated users can manage projects" ON projects
    FOR ALL USING (auth.role() = 'authenticated');

-- Also add individual policies for better debugging
CREATE POLICY "Authenticated can insert projects" ON projects
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can update projects" ON projects
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can delete projects" ON projects
    FOR DELETE USING (auth.role() = 'authenticated');