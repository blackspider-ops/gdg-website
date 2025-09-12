-- Fix the admin password with a fresh hash
-- Run this in Supabase SQL Editor

UPDATE admin_users 
SET password_hash = '$2b$10$cPOD4/VTF5fEFI55QPpdsOOOd/rQM1rLf4mnPHs9kYA/DvXVjrfZ6'
WHERE email = 'tms7397@psu.edu';

-- Verify the update
SELECT email, password_hash FROM admin_users WHERE email = 'tms7397@psu.edu';