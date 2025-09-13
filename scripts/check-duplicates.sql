-- Check for duplicates in all tables

-- Check duplicates in events (by title)
SELECT 'events' as table_name, title, COUNT(*) as duplicate_count
FROM events 
GROUP BY title 
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Check duplicates in team_members (by name)
SELECT 'team_members' as table_name, name, COUNT(*) as duplicate_count
FROM team_members 
GROUP BY name 
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Check duplicates in projects (by title)
SELECT 'projects' as table_name, title, COUNT(*) as duplicate_count
FROM projects 
GROUP BY title 
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Check duplicates in sponsors (by name)
SELECT 'sponsors' as table_name, name, COUNT(*) as duplicate_count
FROM sponsors 
GROUP BY name 
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Check duplicates in members (by email)
SELECT 'members' as table_name, email, COUNT(*) as duplicate_count
FROM members 
GROUP BY email 
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Check duplicates in site_settings (by key)
SELECT 'site_settings' as table_name, key, COUNT(*) as duplicate_count
FROM site_settings 
GROUP BY key 
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Check duplicates in navigation_items (by label)
SELECT 'navigation_items' as table_name, label, COUNT(*) as duplicate_count
FROM navigation_items 
GROUP BY label 
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Check duplicates in social_links (by platform)
SELECT 'social_links' as table_name, platform, COUNT(*) as duplicate_count
FROM social_links 
GROUP BY platform 
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Check duplicates in page_content (by page_slug and section_key)
SELECT 'page_content' as table_name, page_slug, section_key, COUNT(*) as duplicate_count
FROM page_content 
GROUP BY page_slug, section_key 
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Check duplicates in footer_content (by section_key)
SELECT 'footer_content' as table_name, section_key, COUNT(*) as duplicate_count
FROM footer_content 
GROUP BY section_key 
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;