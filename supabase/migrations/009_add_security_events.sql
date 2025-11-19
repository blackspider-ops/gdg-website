-- Create security_events table for tracking security-related events
CREATE TABLE IF NOT EXISTS security_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('login_success', 'login_failed', 'password_change', 'account_locked', 'suspicious_activity')),
    admin_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    ip_address INET,
    user_agent TEXT,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expand admin_actions table to include more comprehensive action types
DO $$ 
BEGIN
    -- Add new action types to admin_actions if the constraint exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'admin_actions_action_check' 
               AND table_name = 'admin_actions') THEN
        ALTER TABLE admin_actions DROP CONSTRAINT admin_actions_action_check;
    END IF;
    
    -- Add the expanded constraint
    ALTER TABLE admin_actions ADD CONSTRAINT admin_actions_action_check 
    CHECK (action IN (
        -- User Management
        'login', 'logout', 'create_admin', 'update_admin', 'delete_admin', 'reset_password', 'promote_team_member',
        -- Content Management  
        'create_event', 'update_event', 'delete_event', 'publish_event', 'unpublish_event',
        'create_team_member', 'update_team_member', 'delete_team_member',
        'create_sponsor', 'update_sponsor', 'delete_sponsor',
        'create_project', 'update_project', 'delete_project',
        'create_member', 'update_member', 'delete_member',
        -- Newsletter Management
        'create_newsletter_campaign', 'send_newsletter', 'schedule_newsletter', 'delete_newsletter',
        'export_subscribers', 'import_subscribers', 'update_subscriber',
        -- Settings Management
        'update_site_settings', 'update_page_content', 'update_footer_content', 'update_navigation',
        'update_social_links', 'update_admin_secret_code',
        -- Security Actions
        'change_password', 'update_security_settings', 'view_audit_log', 'export_audit_log',
        -- System Actions
        'backup_database', 'restore_database', 'clear_cache', 'update_system_settings'
    ));
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_security_events_admin_id ON security_events(admin_id);
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at);
CREATE INDEX IF NOT EXISTS idx_security_events_admin_event_time ON security_events(admin_id, event_type, created_at);

-- Enable RLS
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (with existence checks)
DO $$
BEGIN
    -- Create SELECT policy if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'security_events' 
        AND policyname = 'Super admins can view all security events'
    ) THEN
        CREATE POLICY "Super admins can view all security events" ON security_events
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM admin_users 
                    WHERE admin_users.id = auth.uid() 
                    AND admin_users.role = 'super_admin'
                    AND admin_users.is_active = true
                )
            );
    END IF;

    -- Create INSERT policy if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'security_events' 
        AND policyname = 'Super admins can insert security events'
    ) THEN
        CREATE POLICY "Super admins can insert security events" ON security_events
            FOR INSERT WITH CHECK (
                EXISTS (
                    SELECT 1 FROM admin_users 
                    WHERE admin_users.id = auth.uid() 
                    AND admin_users.role = 'super_admin'
                    AND admin_users.is_active = true
                )
            );
    END IF;
END $$;

-- Add some sample security events for demonstration
INSERT INTO security_events (event_type, admin_id, ip_address, details) 
SELECT 
    'login_success',
    id,
    '192.168.1.100'::inet,
    '{"browser": "Chrome", "os": "macOS"}'::jsonb
FROM admin_users 
WHERE role = 'super_admin' 
LIMIT 1;

-- Add function to automatically log login events
CREATE OR REPLACE FUNCTION log_admin_login()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if last_login was actually updated (not just any update)
    IF OLD.last_login IS DISTINCT FROM NEW.last_login AND NEW.last_login IS NOT NULL THEN
        INSERT INTO security_events (event_type, admin_id, details)
        VALUES ('login_success', NEW.id, '{"source": "admin_login"}'::jsonb);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically log login events
DROP TRIGGER IF EXISTS trigger_log_admin_login ON admin_users;
CREATE TRIGGER trigger_log_admin_login
    AFTER UPDATE ON admin_users
    FOR EACH ROW
    EXECUTE FUNCTION log_admin_login();

-- Add password management columns to admin_users table
DO $$
BEGIN
    -- Add must_change_password column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'admin_users' AND column_name = 'must_change_password') THEN
        ALTER TABLE admin_users ADD COLUMN must_change_password BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add password_changed_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'admin_users' AND column_name = 'password_changed_at') THEN
        ALTER TABLE admin_users ADD COLUMN password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Add temporary_password_expires_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'admin_users' AND column_name = 'temporary_password_expires_at') THEN
        ALTER TABLE admin_users ADD COLUMN temporary_password_expires_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON TABLE security_events IS 'Tracks security-related events for admin users';
COMMENT ON COLUMN security_events.event_type IS 'Type of security event (login_success, login_failed, etc.)';
COMMENT ON COLUMN security_events.admin_id IS 'ID of the admin user associated with the event';
COMMENT ON COLUMN security_events.ip_address IS 'IP address from which the event originated';
COMMENT ON COLUMN security_events.user_agent IS 'User agent string from the browser/client';
COMMENT ON COLUMN security_events.details IS 'Additional event details in JSON format';

-- Add comments for new admin_users columns
COMMENT ON COLUMN admin_users.must_change_password IS 'Whether the admin must change their password on next login';
COMMENT ON COLUMN admin_users.password_changed_at IS 'Timestamp when the password was last changed';
COMMENT ON COLUMN admin_users.temporary_password_expires_at IS 'Expiration time for temporary passwords';