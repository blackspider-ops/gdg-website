-- Verification queries - run these to check if everything is set up correctly

-- Check all tables have data
SELECT 'events' as table_name, COUNT(*) as count FROM events
UNION ALL
SELECT 'team_members', COUNT(*) FROM team_members
UNION ALL
SELECT 'projects', COUNT(*) FROM projects
UNION ALL
SELECT 'sponsors', COUNT(*) FROM sponsors
UNION ALL
SELECT 'members', COUNT(*) FROM members
UNION ALL
SELECT 'site_settings', COUNT(*) FROM site_settings
UNION ALL
SELECT 'navigation_items', COUNT(*) FROM navigation_items
UNION ALL
SELECT 'social_links', COUNT(*) FROM social_links
UNION ALL
SELECT 'page_content', COUNT(*) FROM page_content
UNION ALL
SELECT 'footer_content', COUNT(*) FROM footer_content;

-- Check admin secret code
SELECT key, value FROM site_settings WHERE key = 'admin_secret_code';