-- Check each table individually to see which ones exist and have data

-- Check events table
SELECT 'events' as table_name, COUNT(*) as count FROM events;

-- Check team_members table  
SELECT 'team_members' as table_name, COUNT(*) as count FROM team_members;

-- Check projects table
SELECT 'projects' as table_name, COUNT(*) as count FROM projects;

-- Check sponsors table
SELECT 'sponsors' as table_name, COUNT(*) as count FROM sponsors;

-- Check members table
SELECT 'members' as table_name, COUNT(*) as count FROM members;

-- Check site_settings table
SELECT 'site_settings' as table_name, COUNT(*) as count FROM site_settings;

-- Check navigation_items table
SELECT 'navigation_items' as table_name, COUNT(*) as count FROM navigation_items;

-- Check social_links table
SELECT 'social_links' as table_name, COUNT(*) as count FROM social_links;

-- Check page_content table
SELECT 'page_content' as table_name, COUNT(*) as count FROM page_content;

-- Check footer_content table
SELECT 'footer_content' as table_name, COUNT(*) as count FROM footer_content;