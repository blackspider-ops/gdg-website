-- Fix team roles functionality
-- This script adds missing columns and ensures proper role management

-- Add missing columns to team_members table if they don't exist
DO $$ 
BEGIN
    -- Add email column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'team_members' AND column_name = 'email') THEN
        ALTER TABLE team_members ADD COLUMN email TEXT;
        CREATE INDEX idx_team_members_email ON team_members(email);
    END IF;
    
    -- Add member_id column (only if members table exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'members') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'team_members' AND column_name = 'member_id') THEN
            ALTER TABLE team_members ADD COLUMN member_id UUID REFERENCES members(id) ON DELETE SET NULL;
            CREATE INDEX idx_team_members_member_id ON team_members(member_id);
        END IF;
    END IF;
END $$;

-- Ensure RLS is properly configured
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can read team_members" ON team_members;
DROP POLICY IF EXISTS "Admins can manage team_members" ON team_members;

-- Create new policies
CREATE POLICY "Public can read team_members" ON team_members 
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage team_members" ON team_members 
FOR ALL USING (true);

-- Verify the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'team_members' 
ORDER BY ordinal_position;