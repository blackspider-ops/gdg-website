-- Create a super admin user for initial setup
-- Password: 'admin123' (should be changed immediately after first login)

INSERT INTO admin_users (email, password_hash, role, is_active) 
VALUES (
    'admin@gdgpsu.org',
    '$2a$10$rOvHPGkwJkAVhGjjBXZz4eKQYvJ5Hs8Qs9Xr2Wt1Uv3Yz4Abc5Def', -- bcrypt hash for 'admin123'
    'super_admin',
    true
) ON CONFLICT (email) DO UPDATE SET
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active;

-- Log the creation
INSERT INTO admin_actions (admin_id, action, target_email, details)
SELECT 
    id,
    'initial_super_admin_created',
    email,
    jsonb_build_object('created_by', 'system_seed', 'note', 'Initial super admin created during setup')
FROM admin_users 
WHERE email = 'admin@gdgpsu.org'
ON CONFLICT DO NOTHING;