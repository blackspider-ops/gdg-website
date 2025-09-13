-- Check the current admin secret code
SELECT key, value FROM site_settings WHERE key = 'admin_secret_code';