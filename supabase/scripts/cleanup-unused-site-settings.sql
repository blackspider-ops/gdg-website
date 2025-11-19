-- Clean up unused site settings
-- Remove contact_email from site_settings since it's not used anywhere in the frontend

-- Remove unused contact_email from site_settings
DELETE FROM site_settings WHERE key = 'contact_email';

-- Verify remaining site settings (should only be essential ones)
SELECT key, value, description, updated_at 
FROM site_settings 
ORDER BY key;