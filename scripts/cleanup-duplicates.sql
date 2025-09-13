-- Cleanup script to remove duplicates from all tables
-- This will keep the oldest record (by created_at or id) and delete the rest

-- Clean up events duplicates (keep oldest by created_at)
WITH events_to_delete AS (
  SELECT id,
    ROW_NUMBER() OVER (PARTITION BY title ORDER BY created_at ASC) as rn
  FROM events
)
DELETE FROM events 
WHERE id IN (
  SELECT id FROM events_to_delete WHERE rn > 1
);

-- Clean up team_members duplicates (keep oldest by created_at)
WITH team_members_to_delete AS (
  SELECT id,
    ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at ASC) as rn
  FROM team_members
)
DELETE FROM team_members 
WHERE id IN (
  SELECT id FROM team_members_to_delete WHERE rn > 1
);

-- Clean up projects duplicates (keep oldest by created_at)
WITH projects_to_delete AS (
  SELECT id,
    ROW_NUMBER() OVER (PARTITION BY title ORDER BY created_at ASC) as rn
  FROM projects
)
DELETE FROM projects 
WHERE id IN (
  SELECT id FROM projects_to_delete WHERE rn > 1
);

-- Clean up sponsors duplicates (keep oldest by created_at)
WITH sponsors_to_delete AS (
  SELECT id,
    ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at ASC) as rn
  FROM sponsors
)
DELETE FROM sponsors 
WHERE id IN (
  SELECT id FROM sponsors_to_delete WHERE rn > 1
);

-- Clean up navigation_items duplicates (keep oldest by id)
WITH nav_to_delete AS (
  SELECT id,
    ROW_NUMBER() OVER (PARTITION BY label ORDER BY id ASC) as rn
  FROM navigation_items
)
DELETE FROM navigation_items 
WHERE id IN (
  SELECT id FROM nav_to_delete WHERE rn > 1
);

-- Clean up social_links duplicates (keep oldest by id)
WITH social_to_delete AS (
  SELECT id,
    ROW_NUMBER() OVER (PARTITION BY platform ORDER BY id ASC) as rn
  FROM social_links
)
DELETE FROM social_links 
WHERE id IN (
  SELECT id FROM social_to_delete WHERE rn > 1
);

-- Clean up page_content duplicates (keep oldest by id)
WITH page_to_delete AS (
  SELECT id,
    ROW_NUMBER() OVER (PARTITION BY page_slug, section_key ORDER BY id ASC) as rn
  FROM page_content
)
DELETE FROM page_content 
WHERE id IN (
  SELECT id FROM page_to_delete WHERE rn > 1
);

-- Clean up footer_content duplicates (keep oldest by id)
WITH footer_to_delete AS (
  SELECT id,
    ROW_NUMBER() OVER (PARTITION BY section_key ORDER BY id ASC) as rn
  FROM footer_content
)
DELETE FROM footer_content 
WHERE id IN (
  SELECT id FROM footer_to_delete WHERE rn > 1
);

-- Clean up site_settings duplicates (keep newest by updated_at)
WITH settings_to_delete AS (
  SELECT id,
    ROW_NUMBER() OVER (PARTITION BY key ORDER BY updated_at DESC) as rn
  FROM site_settings
)
DELETE FROM site_settings 
WHERE id IN (
  SELECT id FROM settings_to_delete WHERE rn > 1
);

-- Show final counts after cleanup
SELECT 'Cleanup completed! Final counts:' as message;

SELECT 
  'events' as table_name, 
  COUNT(*) as final_count,
  '(should be ~5)' as expected
FROM events
UNION ALL
SELECT 'team_members', COUNT(*), '(should be ~5)' FROM team_members
UNION ALL
SELECT 'projects', COUNT(*), '(should be ~5)' FROM projects
UNION ALL
SELECT 'sponsors', COUNT(*), '(should be ~6)' FROM sponsors
UNION ALL
SELECT 'members', COUNT(*), '(should be 8)' FROM members
UNION ALL
SELECT 'navigation_items', COUNT(*), '(should be 8)' FROM navigation_items
UNION ALL
SELECT 'social_links', COUNT(*), '(should be 5)' FROM social_links
UNION ALL
SELECT 'page_content', COUNT(*), '(should be 3)' FROM page_content
UNION ALL
SELECT 'footer_content', COUNT(*), '(should be 4)' FROM footer_content
UNION ALL
SELECT 'site_settings', COUNT(*), '(should be 8+)' FROM site_settings
ORDER BY table_name;