-- Step 1: Create the members table (safe version)
-- Copy and paste this first

-- Members table for managing community members
CREATE TABLE IF NOT EXISTS members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    year TEXT, -- Academic year: Freshman, Sophomore, Junior, Senior, Graduate
    major TEXT,
    category TEXT CHECK (category IN ('founder', 'organizer', 'lead', 'active', 'member', 'alumni')) DEFAULT 'member',
    interests TEXT[] DEFAULT '{}',
    join_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);
CREATE INDEX IF NOT EXISTS idx_members_category ON members(category);
CREATE INDEX IF NOT EXISTS idx_members_is_active ON members(is_active);
CREATE INDEX IF NOT EXISTS idx_members_join_date ON members(join_date);
CREATE INDEX IF NOT EXISTS idx_members_last_active ON members(last_active);

-- Enable Row Level Security
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Public can read active members" ON members;
DROP POLICY IF EXISTS "Admins can manage members" ON members;

-- Allow public read access to active members (for displaying member count, etc.)
CREATE POLICY "Public can read active members" ON members 
    FOR SELECT USING (is_active = true);

-- Allow authenticated users (admins) to manage members
CREATE POLICY "Admins can manage members" ON members 
    FOR ALL USING (true);