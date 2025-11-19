-- Resources table for managing learning resources
CREATE TABLE IF NOT EXISTS resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT CHECK (type IN ('study_jam', 'cloud_credit', 'documentation', 'recording')) NOT NULL,
    category TEXT, -- e.g., 'Android', 'Cloud', 'ML', 'Web'
    url TEXT,
    duration TEXT, -- e.g., '8 weeks', '1h 30m'
    level TEXT CHECK (level IN ('Beginner', 'Intermediate', 'Advanced')),
    status TEXT CHECK (status IN ('Available', 'Coming Soon', 'Archived')) DEFAULT 'Available',
    provider TEXT, -- e.g., 'Google Cloud', 'Firebase'
    amount TEXT, -- e.g., '$300', 'Free'
    requirements TEXT[], -- Array of requirements
    materials TEXT[], -- Array of materials like ['Slides', 'Code Samples']
    tags TEXT[], -- Array of tags
    speaker TEXT, -- For recordings
    views INTEGER DEFAULT 0, -- For recordings
    icon TEXT, -- Icon name for display
    color TEXT, -- Color class for display
    metadata JSONB, -- Additional flexible data
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

-- Enable Row Level Security
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active resources
CREATE POLICY "Public can read active resources" ON resources 
    FOR SELECT USING (is_active = true);

-- Allow authenticated users (admins) to manage resources
CREATE POLICY "Admins can manage resources" ON resources 
    FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON resources TO authenticated;