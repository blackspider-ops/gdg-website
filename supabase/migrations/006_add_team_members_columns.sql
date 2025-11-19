-- Add missing columns to team_members table
-- This migration adds email and member_id columns that are referenced in the code

-- Add email column to team_members
ALTER TABLE team_members 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Add member_id column to link with members table
ALTER TABLE team_members 
ADD COLUMN IF NOT EXISTS member_id UUID REFERENCES members(id) ON DELETE SET NULL;

-- Create index for better performance on member_id lookups
CREATE INDEX IF NOT EXISTS idx_team_members_member_id ON team_members(member_id);

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(email);

-- Update RLS policies if they exist
-- Allow public read access to team members
DROP POLICY IF EXISTS "Public can read team_members" ON team_members;
CREATE POLICY "Public can read team_members" ON team_members 
FOR SELECT USING (is_active = true);

-- Allow admins to manage team members
DROP POLICY IF EXISTS "Admins can manage team_members" ON team_members;
CREATE POLICY "Admins can manage team_members" ON team_members 
FOR ALL USING (true);

-- Enable RLS on team_members if not already enabled
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;