-- Ensure resources table exists with all necessary columns and functions
-- Run this to make sure your resources system is fully set up

-- Create the resources table if it doesn't exist
CREATE TABLE IF NOT EXISTS resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT CHECK (type IN ('study_jam', 'cloud_credit', 'documentation', 'recording')) NOT NULL,
    category TEXT,
    url TEXT,
    duration TEXT,
    level TEXT CHECK (level IN ('Beginner', 'Intermediate', 'Advanced')),
    status TEXT CHECK (status IN ('Available', 'Coming Soon', 'Archived')) DEFAULT 'Available',
    provider TEXT,
    amount TEXT,
    requirements TEXT[] DEFAULT '{}',
    materials TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    speaker TEXT,
    views INTEGER DEFAULT 0,
    icon TEXT,
    color TEXT,
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(type);
CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category);
CREATE INDEX IF NOT EXISTS idx_resources_status ON resources(status);
CREATE INDEX IF NOT EXISTS idx_resources_is_active ON resources(is_active);
CREATE INDEX IF NOT EXISTS idx_resources_order ON resources(order_index);
CREATE INDEX IF NOT EXISTS idx_resources_created_at ON resources(created_at);

-- Enable Row Level Security
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can read active resources" ON resources;
DROP POLICY IF EXISTS "Admins can manage resources" ON resources;

-- Allow public read access to active resources
CREATE POLICY "Public can read active resources" ON resources 
    FOR SELECT USING (is_active = true);

-- Allow authenticated users (admins) to manage resources
CREATE POLICY "Admins can manage resources" ON resources 
    FOR ALL USING (true);

-- Create or replace the increment views function
CREATE OR REPLACE FUNCTION increment_resource_views(resource_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE resources 
    SET views = COALESCE(views, 0) + 1,
        updated_at = NOW()
    WHERE id = resource_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace function to update resource timestamps
CREATE OR REPLACE FUNCTION update_resource_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic updated_at
DROP TRIGGER IF EXISTS trigger_update_resource_updated_at ON resources;
CREATE TRIGGER trigger_update_resource_updated_at
    BEFORE UPDATE ON resources
    FOR EACH ROW
    EXECUTE FUNCTION update_resource_updated_at();

-- Insert sample data if table is empty
INSERT INTO resources (title, description, type, category, duration, level, status, materials, icon, color, order_index)
SELECT * FROM (VALUES
    ('Android Development Fundamentals', 'Complete guide to building Android apps with Kotlin', 'study_jam', 'Android', '8 weeks', 'Beginner', 'Available', ARRAY['Slides', 'Code Samples', 'Recordings'], 'Smartphone', 'text-green-600', 1),
    ('Google Cloud Platform Essentials', 'Learn cloud computing with hands-on GCP projects', 'study_jam', 'Cloud', '6 weeks', 'Intermediate', 'Available', ARRAY['Slides', 'Lab Guides', 'Recordings'], 'Cloud', 'text-blue-600', 2),
    ('Machine Learning with TensorFlow', 'Introduction to ML concepts and practical implementation', 'study_jam', 'ML', '10 weeks', 'Intermediate', 'Coming Soon', ARRAY['Slides', 'Notebooks', 'Datasets'], 'Brain', 'text-red-600', 3),
    ('Web Development with React', 'Modern web development using React and TypeScript', 'study_jam', 'Web', '8 weeks', 'Beginner', 'Available', ARRAY['Slides', 'Code Samples', 'Recordings'], 'Code', 'text-yellow-600', 4)
) AS sample_data(title, description, type, category, duration, level, status, materials, icon, color, order_index)
WHERE NOT EXISTS (SELECT 1 FROM resources WHERE type = 'study_jam');

-- Insert cloud credits if they don't exist
INSERT INTO resources (title, description, type, provider, amount, duration, requirements, url, order_index)
SELECT * FROM (VALUES
    ('Google Cloud Credits for Students', '$300 in free credits for new Google Cloud users', 'cloud_credit', 'Google Cloud', '$300', '12 months', ARRAY['Valid student email', 'First-time GCP user'], 'https://cloud.google.com/edu', 1),
    ('Firebase Spark Plan', 'Free tier for Firebase projects with generous limits', 'cloud_credit', 'Firebase', 'Free', 'Ongoing', ARRAY['Google account'], 'https://firebase.google.com/pricing', 2),
    ('GitHub Student Developer Pack', 'Free access to developer tools and cloud services', 'cloud_credit', 'GitHub', 'Various', 'While student', ARRAY['Valid student status'], 'https://education.github.com/pack', 3)
) AS sample_data(title, description, type, provider, amount, duration, requirements, url, order_index)
WHERE NOT EXISTS (SELECT 1 FROM resources WHERE type = 'cloud_credit');

-- Insert documentation if it doesn't exist
INSERT INTO resources (title, description, type, tags, url, order_index)
SELECT * FROM (VALUES
    ('Android Developer Guides', 'Official Android development documentation', 'documentation', ARRAY['Android', 'Mobile', 'Kotlin'], 'https://developer.android.com/guide', 1),
    ('Google Cloud Documentation', 'Comprehensive guides for all GCP services', 'documentation', ARRAY['Cloud', 'Infrastructure', 'APIs'], 'https://cloud.google.com/docs', 2),
    ('TensorFlow Tutorials', 'Step-by-step machine learning tutorials', 'documentation', ARRAY['ML', 'AI', 'Python'], 'https://www.tensorflow.org/tutorials', 3),
    ('Flutter Documentation', 'Build beautiful cross-platform apps', 'documentation', ARRAY['Flutter', 'Mobile', 'Cross-platform'], 'https://docs.flutter.dev', 4)
) AS sample_data(title, description, type, tags, url, order_index)
WHERE NOT EXISTS (SELECT 1 FROM resources WHERE type = 'documentation');

-- Insert recordings if they don't exist
INSERT INTO resources (title, description, type, speaker, duration, views, url, order_index, metadata)
SELECT * FROM (VALUES
    ('Getting Started with Android Development', 'Learn the fundamentals of Android development using Kotlin and Android Studio', 'recording', 'Alex Chen', '1h 30m', 245, 'https://youtube.com/watch?v=example1', 1, '{"date": "2024-03-15"}'::jsonb),
    ('Cloud Architecture Best Practices', 'Industry experts discuss cloud architecture patterns and best practices', 'recording', 'Sarah Johnson', '45m', 189, 'https://youtube.com/watch?v=example2', 2, '{"date": "2024-03-08"}'::jsonb),
    ('Introduction to Machine Learning', 'Comprehensive introduction to machine learning concepts and applications', 'recording', 'Dr. Amanda Foster', '2h 15m', 312, 'https://youtube.com/watch?v=example3', 3, '{"date": "2024-02-28"}'::jsonb),
    ('Building Responsive Web Apps', 'Modern techniques for building responsive and performant web applications', 'recording', 'Michael Rodriguez', '1h 45m', 156, 'https://youtube.com/watch?v=example4', 4, '{"date": "2024-02-20"}'::jsonb)
) AS sample_data(title, description, type, speaker, duration, views, url, order_index, metadata)
WHERE NOT EXISTS (SELECT 1 FROM resources WHERE type = 'recording');

-- Verify the setup
SELECT 
    'Resources table setup complete!' as message,
    COUNT(*) as total_resources,
    COUNT(*) FILTER (WHERE is_active = true) as active_resources,
    COUNT(*) FILTER (WHERE type = 'study_jam') as study_jams,
    COUNT(*) FILTER (WHERE type = 'cloud_credit') as cloud_credits,
    COUNT(*) FILTER (WHERE type = 'documentation') as documentation,
    COUNT(*) FILTER (WHERE type = 'recording') as recordings
FROM resources;