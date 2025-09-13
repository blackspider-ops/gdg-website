-- Reset all like counts to 0 to start fresh with authentic likes
UPDATE blog_posts SET likes_count = 0;

-- Note: The BlogService.syncLikeCounts() method can be called from the admin panel
-- to sync the counts with the new blog_likes table system 