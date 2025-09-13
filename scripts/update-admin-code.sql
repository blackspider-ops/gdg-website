-- Update admin secret code to something simpler
UPDATE site_settings 
SET value = '"admin123"' 
WHERE key = 'admin_secret_code';

-- Verify the update
SELECT key, value FROM site_settings WHERE key = 'admin_secret_code';