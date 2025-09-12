-- Admin Users Management Migration
-- This migration ensures proper admin user management functionality

-- Create admin_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Create admin_actions table for audit trail
CREATE TABLE IF NOT EXISTS admin_actions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    target_email VARCHAR(255),
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_action ON admin_actions(action);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON admin_actions(created_at);

-- Enable Row Level Security
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

-- Create policies for admin_users table
-- Allow authenticated users to read admin users (for admin management)
CREATE POLICY IF NOT EXISTS "Allow authenticated users to read admin users" ON admin_users
    FOR SELECT USING (true);

-- Allow authenticated users to insert admin users (for creating new admins)
CREATE POLICY IF NOT EXISTS "Allow authenticated users to insert admin users" ON admin_users
    FOR INSERT WITH CHECK (true);

-- Allow authenticated users to update admin users (for editing admins)
CREATE POLICY IF NOT EXISTS "Allow authenticated users to update admin users" ON admin_users
    FOR UPDATE USING (true);

-- Allow authenticated users to delete admin users (for removing admins)
CREATE POLICY IF NOT EXISTS "Allow authenticated users to delete admin users" ON admin_users
    FOR DELETE USING (true);

-- Create policies for admin_actions table
-- Allow authenticated users to read admin actions (for audit log)
CREATE POLICY IF NOT EXISTS "Allow authenticated users to read admin actions" ON admin_actions
    FOR SELECT USING (true);

-- Allow authenticated users to insert admin actions (for logging)
CREATE POLICY IF NOT EXISTS "Allow authenticated users to insert admin actions" ON admin_actions
    FOR INSERT WITH CHECK (true);

-- Create a function to automatically log admin actions
CREATE OR REPLACE FUNCTION log_admin_action()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the action based on the operation
    IF TG_OP = 'INSERT' THEN
        INSERT INTO admin_actions (admin_id, action, target_email, details)
        VALUES (NEW.id, 'admin_created', NEW.email, row_to_json(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO admin_actions (admin_id, action, target_email, details)
        VALUES (NEW.id, 'admin_updated', NEW.email, jsonb_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW)));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO admin_actions (admin_id, action, target_email, details)
        VALUES (OLD.id, 'admin_deleted', OLD.email, row_to_json(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic logging (optional - we're doing manual logging in the service)
-- CREATE TRIGGER admin_users_audit_trigger
--     AFTER INSERT OR UPDATE OR DELETE ON admin_users
--     FOR EACH ROW EXECUTE FUNCTION log_admin_action();

-- Grant necessary permissions
GRANT ALL ON admin_users TO authenticated;
GRANT ALL ON admin_actions TO authenticated;
GRANT USAGE ON SEQUENCE admin_users_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE admin_actions_id_seq TO authenticated;