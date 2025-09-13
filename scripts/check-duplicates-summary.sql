-- Summary of duplicates across all tables
WITH duplicate_summary AS (
  -- Events duplicates
  SELECT 'events' as table_name, 'title: ' || title as identifier, COUNT(*) as duplicate_count
  FROM events 
  GROUP BY title 
  HAVING COUNT(*) > 1
  
  UNION ALL
  
  -- Team members duplicates
  SELECT 'team_members', 'name: ' || name, COUNT(*)
  FROM team_members 
  GROUP BY name 
  HAVING COUNT(*) > 1
  
  UNION ALL
  
  -- Projects duplicates
  SELECT 'projects', 'title: ' || title, COUNT(*)
  FROM projects 
  GROUP BY title 
  HAVING COUNT(*) > 1
  
  UNION ALL
  
  -- Sponsors duplicates
  SELECT 'sponsors', 'name: ' || name, COUNT(*)
  FROM sponsors 
  GROUP BY name 
  HAVING COUNT(*) > 1
  
  UNION ALL
  
  -- Members duplicates
  SELECT 'members', 'email: ' || email, COUNT(*)
  FROM members 
  GROUP BY email 
  HAVING COUNT(*) > 1
  
  UNION ALL
  
  -- Site settings duplicates
  SELECT 'site_settings', 'key: ' || key, COUNT(*)
  FROM site_settings 
  GROUP BY key 
  HAVING COUNT(*) > 1
  
  UNION ALL
  
  -- Navigation items duplicates
  SELECT 'navigation_items', 'label: ' || label, COUNT(*)
  FROM navigation_items 
  GROUP BY label 
  HAVING COUNT(*) > 1
  
  UNION ALL
  
  -- Social links duplicates
  SELECT 'social_links', 'platform: ' || platform, COUNT(*)
  FROM social_links 
  GROUP BY platform 
  HAVING COUNT(*) > 1
  
  UNION ALL
  
  -- Page content duplicates
  SELECT 'page_content', 'page: ' || page_slug || ', section: ' || section_key, COUNT(*)
  FROM page_content 
  GROUP BY page_slug, section_key 
  HAVING COUNT(*) > 1
  
  UNION ALL
  
  -- Footer content duplicates
  SELECT 'footer_content', 'section: ' || section_key, COUNT(*)
  FROM footer_content 
  GROUP BY section_key 
  HAVING COUNT(*) > 1
)
SELECT 
  table_name,
  identifier,
  duplicate_count,
  '❌ Has duplicates' as status
FROM duplicate_summary
ORDER BY table_name, duplicate_count DESC;