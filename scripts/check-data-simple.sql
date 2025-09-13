-- Run these queries ONE AT A TIME to check data in each table

-- 1. Check events
SELECT COUNT(*) as events_count FROM events;

-- 2. Check team_members  
SELECT COUNT(*) as team_members_count FROM team_members;

-- 3. Check projects
SELECT COUNT(*) as projects_count FROM projects;

-- 4. Check sponsors
SELECT COUNT(*) as sponsors_count FROM sponsors;

-- 5. Check members
SELECT COUNT(*) as members_count FROM members;

-- 6. Check site_settings
SELECT COUNT(*) as site_settings_count FROM site_settings;