-- Ensure admin_actions table has all required columns for comprehensive audit logging

DO $$
BEGIN
    -- Add missing columns if they don't exist
    
    -- Add target_id column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_actions' AND column_name = 'target_id'
    ) THEN
        ALTER TABLE admin_actions ADD COLUMN target_id UUID;
    END IF;
    
    -- Add target_type column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_actions' AND column_name = 'target_type'
    ) THEN
        ALTER TABLE admin_actions ADD COLUMN target_type VARCHAR(50);
    END IF;
    
    -- Add ip_address column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_actions' AND column_name = 'ip_address'
    ) THEN
        ALTER TABLE admin_actions ADD COLUMN ip_address INET;
    END IF;
    
    -- Add user_agent column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_actions' AND column_name = 'user_agent'
    ) THEN
        ALTER TABLE admin_actions ADD COLUMN user_agent TEXT;
    END IF;
    
    -- Ensure details column is JSONB (might be JSON in older versions)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_actions' AND column_name = 'details' AND data_type = 'json'
    ) THEN
        ALTER TABLE admin_actions ALTER COLUMN details TYPE JSONB USING details::JSONB;
    END IF;
    
    -- Ensure details column has default value
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_actions' AND column_name = 'details' AND column_default IS NULL
    ) THEN
        ALTER TABLE admin_actions ALTER COLUMN details SET DEFAULT '{}';
    END IF;
    
END $$;

-- Create additional indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_actions_target_type ON admin_actions(target_type);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target_id ON admin_actions(target_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_ip_address ON admin_actions(ip_address);

-- Add some sample audit data if the table is empty (for testing)
DO $$
DECLARE
    sample_admin_id UUID;
BEGIN
    -- Get the first admin user ID for sample data
    SELECT id INTO sample_admin_id FROM admin_users LIMIT 1;
    
    -- Only add sample data if no audit entries exist and we have an admin
    IF sample_admin_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM admin_actions LIMIT 1) THEN
        INSERT INTO admin_actions (admin_id, action, details) VALUES
        (sample_admin_id, 'login', '{"description": "Sample login action", "sample": true}'),
        (sample_admin_id, 'view_audit_log', '{"description": "Viewed audit log", "sample": true}'),
        (sample_admin_id, 'update_site_settings', '{"description": "Updated site configuration", "sample": true}');
    END IF;
END $$;

-- Ensure RLS policies exist
DO $$
BEGIN
    -- Enable RLS if not already enabled
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'admin_actions' AND rowsecurity = true
    ) THEN
        ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- Create read policy if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'admin_actions' AND policyname = 'Allow authenticated users to read admin actions'
    ) THEN
        CREATE POLICY "Allow authenticated users to read admin actions" ON admin_actions
        FOR SELECT USING (true);
    END IF;
    
    -- Create insert policy if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'admin_actions' AND policyname = 'Allow authenticated users to insert admin actions'
    ) THEN
        CREATE POLICY "Allow authenticated users to insert admin actions" ON admin_actions
        FOR INSERT WITH CHECK (true);
    END IF;
END $$;

-- Grant necessary permissions
GRANT ALL ON admin_actions TO authenticated;
GRANT ALL ON admin_actions TO anon;

-- Add helpful comments
COMMENT ON TABLE admin_actions IS 'Comprehensive audit log for all admin actions';
COMMENT ON COLUMN admin_actions.admin_id IS 'ID of the admin user who performed the action';
COMMENT ON COLUMN admin_actions.action IS 'Type of action performed';
COMMENT ON COLUMN admin_actions.target_email IS 'Email of the target user (if applicable)';
COMMENT ON COLUMN admin_actions.target_id IS 'ID of the target resource (if applicable)';
COMMENT ON COLUMN admin_actions.target_type IS 'Type of the target resource (if applicable)';
COMMENT ON COLUMN admin_actions.details IS 'Additional details about the action in JSON format';
COMMENT ON COLUMN admin_actions.ip_address IS 'IP address from which the action was performed';
COMMENT ON COLUMN admin_actions.user_agent IS 'User agent string from the browser/client';
COMMENT ON COLUMN admin_actions.created_at IS 'Timestamp when the action was performed';