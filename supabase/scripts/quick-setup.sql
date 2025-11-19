-- Quick setup script to get your admin login working
-- Run this in Supabase SQL Editor

-- First, add the password column if it doesn't exist
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'admin';
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Update your existing admin with password
-- Password is 'admin123' - CHANGE THIS IMMEDIATELY!
UPDATE admin_users 
SET password_hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
    role = 'super_admin',
    is_active = true
WHERE email = 'tms7397@psu.edu';

-- Verify the update worked
SELECT email, role, is_active, 
       CASE WHEN password_hash IS NOT NULL THEN 'Password Set' ELSE 'No Password' END as password_status
FROM admin_users 
WHERE email = 'tms7397@psu.edu';