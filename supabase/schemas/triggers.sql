-- Database Triggers for GDG@PSU
-- Run this after the initial schema to set up automatic triggers

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns (safe version)
DO $$
BEGIN
    -- Create trigger for site_content if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_site_content_updated_at') THEN
        CREATE TRIGGER update_site_content_updated_at 
            BEFORE UPDATE ON site_content 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Create trigger for events if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_events_updated_at') THEN
        CREATE TRIGGER update_events_updated_at 
            BEFORE UPDATE ON events 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Create trigger for team_members if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_team_members_updated_at') THEN
        CREATE TRIGGER update_team_members_updated_at 
            BEFORE UPDATE ON team_members 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Create trigger for projects if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_projects_updated_at') THEN
        CREATE TRIGGER update_projects_updated_at 
            BEFORE UPDATE ON projects 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Create trigger for sponsors if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_sponsors_updated_at') THEN
        CREATE TRIGGER update_sponsors_updated_at 
            BEFORE UPDATE ON sponsors 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;