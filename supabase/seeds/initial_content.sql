-- Initial content seed for the CMS
-- This populates the database with default content

-- Site settings
INSERT INTO site_settings (key, value, description) VALUES
('site_title', '"GDG@PSU"', 'Main site title'),
('site_subtitle', '"Penn State University"', 'Site subtitle'),
('site_description', '"A student-led community passionate about Google technologies, development, and building the future together at Penn State University."', 'Site description'),
('contact_email', '"contact@gdgpsu.org"', 'Main contact email'),
('meeting_time', '"Thursdays at 7:00 PM"', 'Regular meeting time'),
('meeting_location', '"Thomas Building 100"', 'Meeting location')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Home page content
INSERT INTO page_content (page_slug, section_key, content) VALUES
('home', 'hero', '{
  "title": "Google Developer Group",
  "subtitle": "at Penn State University",
  "description": "Join our community of passionate developers, designers, and tech enthusiasts. Learn, build, and grow together with Google technologies.",
  "cta_text": "Join Chapter",
  "cta_link": "/contact",
  "background_type": "3d_scene"
}'),
('home', 'stats', '{
  "members": 247,
  "events": 25,
  "projects": 12,
  "workshops": 18
}'),
('home', 'features', '{
  "title": "What We Offer",
  "items": [
    {
      "title": "Workshops & Study Jams",
      "description": "Hands-on learning sessions covering the latest Google technologies and development practices.",
      "icon": "Code"
    },
    {
      "title": "Networking Events",
      "description": "Connect with fellow developers, industry professionals, and Google experts.",
      "icon": "Users"
    },
    {
      "title": "Project Collaboration",
      "description": "Work on real-world projects and build your portfolio with like-minded developers.",
      "icon": "Briefcase"
    }
  ]
}')
ON CONFLICT (page_slug, section_key) DO UPDATE SET content = EXCLUDED.content;

-- Contact page content
INSERT INTO page_content (page_slug, section_key, content) VALUES
('contact', 'hero', '{
  "title": "Get in Touch",
  "subtitle": "with GDG PSU",
  "description": "Ready to join our community? Have questions about events? Let''s connect.",
  "background_type": "3d_scene"
}'),
('contact', 'info', '{
  "email": "contact@gdgpsu.org",
  "discord": "Join our server for real-time chat",
  "office_hours": "Wednesdays 4-6 PM, IST Building"
}')
ON CONFLICT (page_slug, section_key) DO UPDATE SET content = EXCLUDED.content;

-- Events page content
INSERT INTO page_content (page_slug, section_key, content) VALUES
('events', 'hero', '{
  "title": "Upcoming Events",
  "subtitle": "Join Us",
  "description": "Discover workshops, study jams, networking events, and more. Stay connected with the latest in tech.",
  "background_type": "gradient"
}')
ON CONFLICT (page_slug, section_key) DO UPDATE SET content = EXCLUDED.content;

-- Navigation items
INSERT INTO navigation_items (label, href, icon, order_index) VALUES
('Events', '/events', 'Calendar', 1),
('Blog', '/blog', 'BookOpen', 2),
('Projects', '/projects', 'Code', 3),
('Team', '/team', 'Users', 4),
('Resources', '/resources', 'BookOpen', 5),
('Sponsors', '/sponsors', 'Briefcase', 6)
ON CONFLICT DO NOTHING;

-- Social links
INSERT INTO social_links (platform, url, icon, order_index) VALUES
('GitHub', 'https://github.com/gdgpsu', 'Github', 1),
('Twitter', 'https://twitter.com/gdgpsu', 'Twitter', 2),
('Instagram', 'https://instagram.com/gdg.psu', 'Instagram', 3),
('Email', 'mailto:contact@gdgpsu.org', 'Mail', 4)
ON CONFLICT DO NOTHING;

-- Footer content
INSERT INTO footer_content (section_key, content) VALUES
('about', '{
  "title": "GDG@PSU",
  "subtitle": "Penn State University",
  "description": "A student-led community passionate about Google technologies, development, and building the future together at Penn State University."
}'),
('quick_links', '{
  "title": "Quick Links",
  "links": [
    {"name": "Events", "href": "/events"},
    {"name": "Blog", "href": "/blog"},
    {"name": "Projects", "href": "/projects"},
    {"name": "Team", "href": "/team"}
  ]
}'),
('resources', '{
  "title": "Resources",
  "links": [
    {"name": "Study Jams", "href": "/resources"},
    {"name": "Cloud Credits", "href": "/resources"},
    {"name": "Documentation", "href": "/resources"},
    {"name": "Recordings", "href": "/resources"}
  ]
}'),
('contact_info', '{
  "title": "Connect With Us",
  "email": "contact@gdgpsu.org",
  "location": "Penn State University\\nUniversity Park, PA",
  "meeting_times": "Thursdays at 7:00 PM\\nThomas Building 100"
}'),
('newsletter', '{
  "title": "Stay Updated",
  "description": "Get the latest updates on events, workshops, and opportunities delivered to your inbox.",
  "placeholder": "Enter your email"
}')
ON CONFLICT (section_key) DO UPDATE SET content = EXCLUDED.content;