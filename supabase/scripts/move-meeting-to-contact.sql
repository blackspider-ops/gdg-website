-- Simple script to move meeting information to contact page content
-- Run this to update existing contact page content with meeting fields

-- Update contact page content to include meeting information
UPDATE page_content 
SET content = content || jsonb_build_object(
    'meeting_time', 'Thursdays at 7:00 PM',
    'meeting_location', 'Thomas Building 100'
)
WHERE page_slug = 'contact' AND section_key = 'main';

-- If contact page content doesn't exist, create it
INSERT INTO page_content (page_slug, section_key, content, is_active, order_index, updated_at)
SELECT 'contact', 'main', '{
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
    "meeting_time": "Thursdays at 7:00 PM",
    "meeting_location": "Thomas Building 100",
    "additional_links_title": "Additional Links",
    "contact_links": "[]"
}'::jsonb, true, 0, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM page_content WHERE page_slug = 'contact' AND section_key = 'main'
);

-- Remove meeting fields from site_settings (optional - only if you want to clean up)
-- DELETE FROM site_settings WHERE key IN ('meeting_time', 'meeting_location');

-- Verify the update
SELECT 
    page_slug,
    section_key,
    content->>'meeting_time' as meeting_time,
    content->>'meeting_location' as meeting_location,
    updated_at
FROM page_content 
WHERE page_slug = 'contact' AND section_key = 'main';