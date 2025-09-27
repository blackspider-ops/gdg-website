-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    image_url TEXT,
    github_url TEXT,
    demo_url TEXT,
    tech_stack TEXT[] DEFAULT '{}', -- Array of technologies used
    category VARCHAR(100) DEFAULT 'web', -- web, mobile, ai, data, etc.
    status VARCHAR(50) DEFAULT 'active', -- active, completed, archived, on_hold
    difficulty_level VARCHAR(50) DEFAULT 'intermediate', -- beginner, intermediate, advanced
    team_size INTEGER DEFAULT 1,
    start_date DATE,
    end_date DATE,
    is_featured BOOLEAN DEFAULT false,
    is_open_source BOOLEAN DEFAULT true,
    tags TEXT[] DEFAULT '{}', -- Array of tags for filtering
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create project_members table for team assignments
CREATE TABLE IF NOT EXISTS project_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    member_id UUID, -- Will reference members table when it exists
    role VARCHAR(100) DEFAULT 'contributor', -- lead, contributor, mentor, etc.
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(project_id, member_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_is_featured ON projects(is_featured);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_member_id ON project_members(member_id);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view active projects" ON projects;
DROP POLICY IF EXISTS "Admins can manage all projects" ON projects;
DROP POLICY IF EXISTS "Anyone can view project members" ON project_members;
DROP POLICY IF EXISTS "Admins can manage project members" ON project_members;

-- Create policies for projects
CREATE POLICY "Public can view projects" ON projects
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage all projects" ON projects
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.is_active = true
        )
    );

-- Create policies for project_members
CREATE POLICY "Anyone can view project members" ON project_members
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage project members" ON project_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.is_active = true
        )
    );

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW 
    EXECUTE FUNCTION update_projects_updated_at();

-- Insert some sample projects
INSERT INTO projects (title, description, short_description, category, status, difficulty_level, tech_stack, tags, is_featured) VALUES
('GDG@PSU Website', 'Official website for Google Developer Group at Penn State University', 'Modern React website with admin dashboard and event management', 'web', 'active', 'intermediate', ARRAY['React', 'TypeScript', 'Tailwind CSS', 'Supabase'], ARRAY['website', 'react', 'typescript'], true),
('Mobile Event App', 'Cross-platform mobile app for GDG events and networking', 'Flutter app for event check-ins, networking, and notifications', 'mobile', 'active', 'advanced', ARRAY['Flutter', 'Dart', 'Firebase'], ARRAY['mobile', 'flutter', 'events'], true),
('AI Study Assistant', 'Machine learning project to help students with course materials', 'AI-powered study tool using natural language processing', 'ai', 'on_hold', 'advanced', ARRAY['Python', 'TensorFlow', 'NLP'], ARRAY['ai', 'machine-learning', 'education'], false),
('Data Visualization Dashboard', 'Interactive dashboard for university data insights', 'D3.js dashboard showing student engagement metrics', 'data', 'completed', 'intermediate', ARRAY['JavaScript', 'D3.js', 'Node.js'], ARRAY['data-viz', 'dashboard', 'analytics'], false);