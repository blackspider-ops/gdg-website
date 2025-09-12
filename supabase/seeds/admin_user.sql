-- Seed script to create the initial admin user
-- This should be run after the initial schema is set up

-- Insert the admin user with email tms7397@psu.edu and password admin123
-- Password hash generated using bcrypt with 10 salt rounds
INSERT INTO admin_users (email, password_hash, role, is_active) 
VALUES (
  'tms7397@psu.edu',
  '$2b$10$0NjePPSwVBIxd/3gTz2Cwu9rS5dwBxi.kh1VcV.QWvHI4i/kc1bpS', -- admin123
  'super_admin',
  true
) ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active;