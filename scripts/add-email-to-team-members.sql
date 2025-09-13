-- Add email column to team_members table for better sync with members
-- This is optional but helps with bidirectional sync

-- Add the email column
ALTER TABLE team_members 
ADD COLUMN email VARCHAR(255);

-- Add comment for documentation
COMMENT ON COLUMN team_members.email IS 'Email address for syncing with members table';

-- Create index for better query performance
CREATE INDEX idx_team_members_email ON team_members(email);

-- Verify the changes by showing column info
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'team_members' 
ORDER BY ordinal_position;