-- Migration: Add password authentication to admin system
-- Date: 2025-01-16
-- Description: Adds password hashing, roles, and admin management features

-- Add password column to admin_users table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'admin_users' AND column_name = 'password_hash') THEN
        ALTER TABLE admin_users ADD COLUMN password_hash TEXT;
    END IF;
END $$;

-- Add role column for different admin levels (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'admin_users' AND column_name = 'role') THEN
        ALTER TABLE admin_users ADD COLUMN role TEXT DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin'));
    END IF;
END $$;

-- Add is_active column (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'admin_users' AND column_name = 'is_active') THEN
        ALTER TABLE admin_users ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- Update existing admin to be a super_admin with default password
-- Password is 'admin123' - CHANGE THIS IMMEDIATELY!
UPDATE admin_users 
SET password_hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
    role = 'super_admin',
    is_active = true
WHERE password_hash IS NULL;

-- Create admin management table for tracking admin actions (if not exists)
CREATE TABLE IF NOT EXISTS admin_actions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    target_email TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for admin_actions (if not exists)
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON admin_actions(created_at);

-- Add RLS policies for admin management (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'admin_actions' AND policyname = 'Admins can view admin_actions') THEN
        CREATE POLICY "Admins can view admin_actions" ON admin_actions FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'admin_actions' AND policyname = 'Admins can insert admin_actions') THEN
        CREATE POLICY "Admins can insert admin_actions" ON admin_actions FOR INSERT WITH CHECK (true);
    END IF;
END $$;