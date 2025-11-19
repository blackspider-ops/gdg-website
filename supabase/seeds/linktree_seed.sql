-- Insert sample linktree profile
INSERT INTO linktree_profiles (username, display_name, bio, avatar_url, background_type, background_value, theme) VALUES
('gdg-psu', 'GDG @ Penn State', 'Google Developer Groups at Penn State University. Join us for tech talks, workshops, and networking!', '/favicon.png', 'gradient', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 'dark');

-- Get the profile ID for inserting links
DO $$
DECLARE
    profile_uuid UUID;
BEGIN
    SELECT id INTO profile_uuid FROM linktree_profiles WHERE username = 'gdg-psu';
    
    -- Insert sample links
    INSERT INTO linktree_links (profile_id, title, url, description, icon_type, icon_value, button_style, button_color, text_color, sort_order) VALUES
    (profile_uuid, 'Join Our Community', 'https://gdg.community.dev/gdg-penn-state/', 'Connect with fellow developers', 'social', 'users', 'filled', '#4285f4', '#ffffff', 1),
    (profile_uuid, 'Upcoming Events', '/events', 'Check out our latest events and workshops', 'link', 'calendar', 'default', '#ffffff', '#000000', 2),
    (profile_uuid, 'Our Projects', '/projects', 'Explore projects built by our community', 'link', 'code', 'outline', '#34a853', '#34a853', 3),
    (profile_uuid, 'Meet the Team', '/team', 'Get to know our organizers and leads', 'link', 'users', 'default', '#ffffff', '#000000', 4),
    (profile_uuid, 'Resources', '/resources', 'Learning materials and helpful links', 'link', 'book-open', 'minimal', '#ea4335', '#ea4335', 5),
    (profile_uuid, 'Contact Us', '/contact', 'Get in touch with our team', 'link', 'mail', 'default', '#ffffff', '#000000', 6);
END $$;