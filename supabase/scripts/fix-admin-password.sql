-- Fix existing admin with password
-- Run this to add password to your existing admin account

-- Update your existing admin with password and role
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