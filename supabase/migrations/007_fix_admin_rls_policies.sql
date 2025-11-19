-- Fix Admin RLS Policies Migration
-- This migration fixes the RLS policies for admin operations

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read admin users" ON admin_users;
DROP POLICY IF EXISTS "Allow authenticated users to insert admin users" ON admin_users;
DROP POLICY IF EXISTS "Allow authenticated users to update admin users" ON admin_users;
DROP POLICY IF EXISTS "Allow authenticated users to delete admin users" ON admin_users;
DROP POLICY IF EXISTS "Allow authenticated users to read admin actions" ON admin_actions;
DROP POLICY IF EXISTS "Allow authenticated users to insert admin actions" ON admin_actions;

-- Temporarily disable RLS for admin tables since we're using custom authentication
-- We handle authorization at the application layer
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions DISABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to anon role (since we're not using Supabase Auth)
GRANT ALL ON admin_users TO anon;
GRANT ALL ON admin_actions TO anon;

-- Ensure sequences are accessible
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;