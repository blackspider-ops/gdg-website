-- Seed data for site_status table
-- This ensures there's always a default site status record

-- Insert default site status (site is live by default)
INSERT INTO site_status (is_live, redirect_url, message) 
VALUES (
    true, 
    'https://www.gdgpsu.dev/l/applicationcabn', 
    'Site is currently under maintenance. Please check back soon!'
)
ON CONFLICT DO NOTHING;

-- If you want to immediately set the site to maintenance mode, uncomment the following:
-- UPDATE site_status 
-- SET is_live = false, 
--     redirect_url = 'https://www.gdgpsu.dev/l/applicationcabn',
--     message = 'We are currently updating our website. Please visit our linktree for important links.',
--     updated_at = NOW()
-- WHERE id = (SELECT id FROM site_status ORDER BY created_at DESC LIMIT 1);