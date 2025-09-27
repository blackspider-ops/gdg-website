-- Add stars_count column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS stars_count INTEGER DEFAULT 0;

-- Create project_stars table for tracking who starred what
CREATE TABLE IF NOT EXISTS project_stars (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID, -- Can be null for anonymous users
    user_identifier TEXT, -- For anonymous users (IP + user agent hash)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, user_id),
    UNIQUE(project_id, user_identifier)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project_stars_project_id ON project_stars(project_id);
CREATE INDEX IF NOT EXISTS idx_project_stars_user_id ON project_stars(user_id);
CREATE INDEX IF NOT EXISTS idx_project_stars_user_identifier ON project_stars(user_identifier);

-- Enable RLS
ALTER TABLE project_stars ENABLE ROW LEVEL SECURITY;

-- Create policies for project_stars
CREATE POLICY "Anyone can view project stars" ON project_stars
    FOR SELECT USING (true);

CREATE POLICY "Anyone can star projects" ON project_stars
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can unstar their own stars" ON project_stars
    FOR DELETE USING (
        user_id = auth.uid() OR 
        (user_id IS NULL AND user_identifier IS NOT NULL)
    );

-- Function to update stars count when stars are added/removed
CREATE OR REPLACE FUNCTION update_project_stars_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE projects 
        SET stars_count = stars_count + 1 
        WHERE id = NEW.project_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE projects 
        SET stars_count = GREATEST(stars_count - 1, 0) 
        WHERE id = OLD.project_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update stars count
CREATE TRIGGER update_project_stars_count_trigger
    AFTER INSERT OR DELETE ON project_stars
    FOR EACH ROW
    EXECUTE FUNCTION update_project_stars_count();

-- Update existing projects with current star counts
UPDATE projects 
SET stars_count = (
    SELECT COUNT(*) 
    FROM project_stars 
    WHERE project_stars.project_id = projects.id
);

-- Add some sample stars to existing projects
DO $$
DECLARE
    project_record RECORD;
    star_count INTEGER;
BEGIN
    FOR project_record IN SELECT id FROM projects LOOP
        -- Add 1-15 random stars to each project
        star_count := floor(random() * 15) + 1;
        
        FOR i IN 1..star_count LOOP
            INSERT INTO project_stars (project_id, user_identifier)
            VALUES (
                project_record.id, 
                'sample_user_' || i || '_' || project_record.id
            )
            ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;
END $$;