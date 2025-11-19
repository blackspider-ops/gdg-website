-- Create function to increment link click count
CREATE OR REPLACE FUNCTION increment_link_clicks(link_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE linktree_links 
    SET click_count = click_count + 1 
    WHERE id = link_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;