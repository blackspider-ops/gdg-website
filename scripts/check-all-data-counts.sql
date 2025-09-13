-- Single query to check all table counts at once
WITH table_counts AS (
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
  SELECT 'footer_content', COUNT(*) FROM footer_content
)
SELECT 
  table_name,
  count,
  CASE 
    WHEN table_name = 'events' AND count = 5 THEN '✅ Expected: 5'
    WHEN table_name = 'team_members' AND count = 5 THEN '✅ Expected: 5'
    WHEN table_name = 'projects' AND count = 5 THEN '✅ Expected: 5'
    WHEN table_name = 'sponsors' AND count = 6 THEN '✅ Expected: 6'
    WHEN table_name = 'members' AND count = 8 THEN '✅ Expected: 8'
    WHEN table_name = 'site_settings' AND count >= 8 THEN '✅ Expected: 8+'
    WHEN table_name = 'navigation_items' AND count = 8 THEN '✅ Expected: 8'
    WHEN table_name = 'social_links' AND count = 5 THEN '✅ Expected: 5'
    WHEN table_name = 'page_content' AND count = 3 THEN '✅ Expected: 3'
    WHEN table_name = 'footer_content' AND count = 4 THEN '✅ Expected: 4'
    ELSE '❌ Unexpected count'
  END as status
FROM table_counts
ORDER BY table_name;