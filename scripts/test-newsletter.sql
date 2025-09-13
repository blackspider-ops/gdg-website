-- Test script for newsletter functionality
-- Run this to add some test data for the newsletter system

-- Insert some test newsletter subscribers
INSERT INTO newsletter_subscribers (email, name, subscribed_at, is_active, confirmed_at, unsubscribe_token, created_at, updated_at)
VALUES 
  ('test1@psu.edu', 'John Doe', NOW() - INTERVAL '30 days', true, NOW() - INTERVAL '29 days', uuid_generate_v4(), NOW() - INTERVAL '30 days', NOW() - INTERVAL '29 days'),
  ('test2@psu.edu', 'Jane Smith', NOW() - INTERVAL '15 days', true, NOW() - INTERVAL '14 days', uuid_generate_v4(), NOW() - INTERVAL '15 days', NOW() - INTERVAL '14 days'),
  ('test3@psu.edu', 'Mike Johnson', NOW() - INTERVAL '7 days', true, NULL, uuid_generate_v4(), NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
  ('test4@psu.edu', 'Sarah Wilson', NOW() - INTERVAL '45 days', false, NOW() - INTERVAL '44 days', uuid_generate_v4(), NOW() - INTERVAL '45 days', NOW() - INTERVAL '1 day'),
  ('test5@psu.edu', NULL, NOW() - INTERVAL '2 days', true, NOW() - INTERVAL '1 day', uuid_generate_v4(), NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day')
ON CONFLICT (email) DO NOTHING;

-- Verify the data
SELECT 
  email,
  name,
  subscribed_at,
  is_active,
  confirmed_at IS NOT NULL as is_confirmed,
  created_at
FROM newsletter_subscribers
ORDER BY subscribed_at DESC;