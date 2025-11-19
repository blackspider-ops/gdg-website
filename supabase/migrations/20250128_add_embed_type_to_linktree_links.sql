-- Add embed_type column to linktree_links table
ALTER TABLE linktree_links 
ADD COLUMN embed_type TEXT DEFAULT 'none' CHECK (embed_type IN ('none', 'google_form', 'iframe'));

-- Update existing records to have 'none' as default
UPDATE linktree_links SET embed_type = 'none' WHERE embed_type IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN linktree_links.embed_type IS 'Determines how the link should be opened: none (new tab), google_form (optimized Google Forms embed), iframe (generic embed)';