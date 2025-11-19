-- Add default content for new pages (Events, Projects, Team, Blog, Sponsors, Resources)
-- This migration ensures all new pages have default content that can be edited from the admin panel

-- Events Page Content
INSERT INTO page_content (page_slug, section_key, content, is_active, order_index) 
VALUES (
    'events',
    'header',
    '{
        "title": "Events & Workshops",
        "description": "Join our community for hands-on workshops, inspiring talks, and networking opportunities. From beginner-friendly introductions to advanced deep dives, there''s something for every developer.",
        "upcoming_section_title": "Upcoming Events",
        "past_section_title": "Past Events",
        "no_events_message": "No events scheduled at the moment. Check back soon!"
    }'::jsonb,
    true,
    0
) ON CONFLICT (page_slug, section_key) DO NOTHING;

-- Projects Page Content
INSERT INTO page_content (page_slug, section_key, content, is_active, order_index) 
VALUES (
    'projects',
    'header',
    '{
        "title": "Student",
        "subtitle": "Projects",
        "description": "Discover innovative projects built by our community members. From mobile apps to AI research, see what happens when students collaborate and create.",
        "featured_section_title": "Featured Projects",
        "all_projects_title": "All Projects",
        "contribute_cta": "Want to showcase your project?",
        "contribute_button": "Submit Project"
    }'::jsonb,
    true,
    0
) ON CONFLICT (page_slug, section_key) DO NOTHING;

-- Team Page Content
INSERT INTO page_content (page_slug, section_key, content, is_active, order_index) 
VALUES (
    'team',
    'header',
    '{
        "title": "Meet Our",
        "subtitle": "Team",
        "description": "The passionate students and mentors who make GDG@PSU a thriving community for developers and tech enthusiasts.",
        "leadership_title": "Leadership Team",
        "organizers_title": "Organizers",
        "members_title": "Active Members",
        "join_team_cta": "Interested in joining our team?",
        "join_team_button": "Get Involved"
    }'::jsonb,
    true,
    0
) ON CONFLICT (page_slug, section_key) DO NOTHING;

-- Blog Page Content
INSERT INTO page_content (page_slug, section_key, content, is_active, order_index) 
VALUES (
    'blog',
    'header',
    '{
        "title": "Blog & Updates",
        "description": "Insights, tutorials, and updates from our community. Learn about the latest technologies, workshop recaps, and member spotlights.",
        "featured_title": "Featured Posts",
        "recent_title": "Recent Posts",
        "categories_title": "Categories",
        "search_placeholder": "Search articles...",
        "no_posts_message": "No blog posts available yet."
    }'::jsonb,
    true,
    0
) ON CONFLICT (page_slug, section_key) DO NOTHING;

-- Sponsors Page Content
INSERT INTO page_content (page_slug, section_key, content, is_active, order_index) 
VALUES (
    'sponsors',
    'header',
    '{
        "title": "Our",
        "subtitle": "Sponsors",
        "description": "We''re grateful to our sponsors and partners who make our events, workshops, and community initiatives possible.",
        "platinum_title": "Platinum Sponsors",
        "gold_title": "Gold Sponsors",
        "silver_title": "Silver Sponsors",
        "community_title": "Community Partners",
        "become_sponsor_cta": "Interested in sponsoring us?",
        "become_sponsor_button": "Partner With Us"
    }'::jsonb,
    true,
    0
) ON CONFLICT (page_slug, section_key) DO NOTHING;

-- Resources Page Content
INSERT INTO page_content (page_slug, section_key, content, is_active, order_index) 
VALUES (
    'resources',
    'header',
    '{
        "title": "Learning",
        "subtitle": "Resources",
        "description": "Access study materials, cloud credits, documentation, and recorded sessions to accelerate your learning journey.",
        "study_materials_title": "Study Materials",
        "cloud_credits_title": "Cloud Credits",
        "documentation_title": "Documentation",
        "recordings_title": "Session Recordings",
        "tools_title": "Developer Tools"
    }'::jsonb,
    true,
    0
) ON CONFLICT (page_slug, section_key) DO NOTHING;

-- Update the updated_at timestamp for all new records
UPDATE page_content 
SET updated_at = NOW() 
WHERE page_slug IN ('events', 'projects', 'team', 'blog', 'sponsors', 'resources')
AND section_key = 'header';