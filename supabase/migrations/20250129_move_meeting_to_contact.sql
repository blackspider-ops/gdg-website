-- Move meeting information from site_settings to contact page content
-- This migration moves meeting_time and meeting_location to the contact page content

-- First, get the current meeting values from site_settings (if they exist)
DO $$
DECLARE
    current_meeting_time TEXT;
    current_meeting_location TEXT;
    contact_content JSONB;
BEGIN
    -- Get current meeting values from site_settings
    SELECT value INTO current_meeting_time FROM site_settings WHERE key = 'meeting_time';
    SELECT value INTO current_meeting_location FROM site_settings WHERE key = 'meeting_location';
    
    -- Get current contact page content
    SELECT content INTO contact_content FROM page_content WHERE page_slug = 'contact' AND section_key = 'main';
    
    -- If contact content doesn't exist, create it with default values
    IF contact_content IS NULL THEN
        contact_content := '{
            "title": "Get in Touch",
            "subtitle": "Ready to join our community?",
            "description": "We''d love to hear from you! Whether you''re interested in joining our chapter, have questions about upcoming events, or want to collaborate with us.",
            "form_title": "Send us a message",
            "success_message": "Thank you for your message! We''ll get back to you soon.",
            "button_text": "Send Message",
            "quick_contact_title": "Quick Contact",
            "email_label": "Email",
            "email_url": "",
            "discord_label": "Discord",
            "discord_url": "",
            "discord_description": "Join our server for real-time chat",
            "office_hours_label": "Office Hours",
            "office_hours_info": "Wednesdays 4-6 PM, IST Building",
            "additional_links_title": "Additional Links",
            "contact_links": "[]"
        }'::jsonb;
    END IF;
    
    -- Add meeting information to contact content
    contact_content := contact_content || jsonb_build_object(
        'meeting_time', COALESCE(current_meeting_time, '"Thursdays at 7:00 PM"'::jsonb),
        'meeting_location', COALESCE(current_meeting_location, '"Thomas Building 100"'::jsonb)
    );
    
    -- Update or insert the contact page content
    INSERT INTO page_content (page_slug, section_key, content, is_active, order_index, updated_at)
    VALUES ('contact', 'main', contact_content, true, 0, NOW())
    ON CONFLICT (page_slug, section_key) 
    DO UPDATE SET 
        content = EXCLUDED.content,
        updated_at = NOW();
        
    -- Remove meeting fields and unused contact_email from site_settings
    DELETE FROM site_settings WHERE key IN ('meeting_time', 'meeting_location', 'contact_email');
    
END $$;