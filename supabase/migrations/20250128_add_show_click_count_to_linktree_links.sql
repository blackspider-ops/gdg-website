-- Add show_click_count column to linktree_links table
ALTER TABLE linktree_links 
ADD COLUMN show_click_count BOOLEAN DEFAULT true;

-- Update existing records to show click count by default
UPDATE linktree_links SET show_click_count = true WHERE show_click_count IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN linktree_links.show_click_count IS 'Whether to display the click count badge on the link button';