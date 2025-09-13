-- Initial seed data for GDG@PSU website

-- Insert sample events
INSERT INTO events (title, description, date, location, image_url, registration_url, is_featured) VALUES
('Google I/O Extended 2024', 'Join us for an extended celebration of Google I/O with live streaming, discussions, and networking.', '2024-05-15 18:00:00+00', 'IST Building, Room 110', 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800', 'https://forms.google.com/io-extended', true),
('Android Development Workshop', 'Learn the basics of Android development with Kotlin in this hands-on workshop.', '2024-06-20 14:00:00+00', 'Westgate Building, Lab 205', 'https://images.unsplash.com/photo-1607252650355-f7fd0460ccdb?w=800', 'https://forms.google.com/android-workshop', true),
('Web Development Bootcamp', 'A comprehensive introduction to modern web development with React and Firebase.', '2024-07-10 10:00:00+00', 'HUB Robeson Center', 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800', 'https://forms.google.com/web-bootcamp', false),
('Machine Learning Study Group', 'Weekly study group focusing on machine learning concepts and practical applications.', '2024-08-05 16:00:00+00', 'Pattee Library, Room 302', null, null, false),
('Google Cloud Platform Workshop', 'Hands-on workshop covering GCP services and deployment strategies.', '2024-09-15 13:00:00+00', 'IST Building, Room 220', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800', 'https://forms.google.com/gcp-workshop', true);

-- Insert sample team members
INSERT INTO team_members (name, role, bio, image_url, linkedin_url, github_url, order_index, is_active) VALUES
('Alex Johnson', 'Chapter Lead', 'Computer Science senior passionate about mobile development and community building.', null, 'https://linkedin.com/in/alexjohnson', 'https://github.com/alexjohnson', 1, true),
('Sarah Chen', 'Vice President', 'Information Sciences major with expertise in web development and UX design.', null, 'https://linkedin.com/in/sarahchen', 'https://github.com/sarahchen', 2, true),
('Michael Rodriguez', 'Technical Lead', 'Graduate student specializing in machine learning and cloud computing.', null, 'https://linkedin.com/in/michaelrodriguez', 'https://github.com/mrodriguez', 3, true),
('Emily Davis', 'Events Coordinator', 'Business major with a passion for technology and event management.', null, 'https://linkedin.com/in/emilydavis', null, 4, true),
('David Park', 'Marketing Lead', 'Communications major focused on digital marketing and community outreach.', null, 'https://linkedin.com/in/davidpark', null, 5, true);

-- Insert sample projects
INSERT INTO projects (title, description, tech_stack, github_url, demo_url, image_url, is_featured) VALUES
('Campus Event Finder', 'A mobile app to help students discover and track campus events and activities.', ARRAY['React Native', 'Firebase', 'Node.js'], 'https://github.com/gdgpsu/campus-events', 'https://campus-events.gdgpsu.org', 'https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=800', true),
('Study Group Matcher', 'Web platform that connects students for collaborative study sessions based on courses and schedules.', ARRAY['React', 'Express.js', 'MongoDB', 'Socket.io'], 'https://github.com/gdgpsu/study-matcher', 'https://study-matcher.gdgpsu.org', 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800', true),
('PSU Course Planner', 'Tool to help students plan their academic schedule and track degree requirements.', ARRAY['Vue.js', 'Python', 'Django', 'PostgreSQL'], 'https://github.com/gdgpsu/course-planner', null, 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800', false),
('GDG Chapter Website', 'Official website for the GDG@PSU chapter with event management and member portal.', ARRAY['React', 'TypeScript', 'Supabase', 'Tailwind CSS'], 'https://github.com/gdgpsu/website', 'https://gdgpsu.org', null, true),
('ML Model Deployment Tool', 'Platform for deploying and monitoring machine learning models in production.', ARRAY['Python', 'FastAPI', 'Docker', 'Google Cloud'], 'https://github.com/gdgpsu/ml-deploy', null, 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800', false);

-- Insert sample sponsors
INSERT INTO sponsors (name, logo_url, website_url, tier, order_index, is_active) VALUES
('Google', 'https://logo.clearbit.com/google.com', 'https://google.com', 'platinum', 1, true),
('Microsoft', 'https://logo.clearbit.com/microsoft.com', 'https://microsoft.com', 'gold', 2, true),
('Amazon', 'https://logo.clearbit.com/amazon.com', 'https://amazon.com', 'gold', 3, true),
('Meta', 'https://logo.clearbit.com/meta.com', 'https://meta.com', 'silver', 4, true),
('Apple', 'https://logo.clearbit.com/apple.com', 'https://apple.com', 'bronze', 5, true),
('GitHub', 'https://logo.clearbit.com/github.com', 'https://github.com', 'bronze', 6, true);

-- Insert sample members
INSERT INTO members (name, email, phone, year, major, category, interests, is_active) VALUES
('John Doe', 'john.doe@psu.edu', '+1 (555) 123-4567', 'Senior', 'Computer Science', 'organizer', ARRAY['Web Development', 'Machine Learning'], true),
('Jane Smith', 'jane.smith@psu.edu', '+1 (555) 234-5678', 'Junior', 'Information Sciences', 'lead', ARRAY['Android Development', 'UI/UX Design'], true),
('Mike Johnson', 'mike.j@psu.edu', '+1 (555) 345-6789', 'Sophomore', 'Computer Engineering', 'active', ARRAY['Cloud Computing', 'DevOps'], true),
('Sarah Wilson', 'sarah.w@psu.edu', '+1 (555) 456-7890', 'Freshman', 'Data Science', 'member', ARRAY['Data Science', 'AI'], true),
('Chris Brown', 'chris.b@psu.edu', '+1 (555) 567-8901', 'Graduate', 'Computer Science', 'founder', ARRAY['Full Stack Development', 'Entrepreneurship'], true),
('Lisa Wang', 'lisa.w@psu.edu', '+1 (555) 678-9012', 'Senior', 'Information Sciences', 'lead', ARRAY['Product Management', 'Design Thinking'], true),
('Tom Anderson', 'tom.a@psu.edu', '+1 (555) 789-0123', 'Junior', 'Computer Science', 'active', ARRAY['Mobile Development', 'Game Development'], true),
('Amy Chen', 'amy.c@psu.edu', '+1 (555) 890-1234', 'Sophomore', 'Data Science', 'member', ARRAY['Statistics', 'Python'], true);

-- Insert site settings
INSERT INTO site_settings (key, value, description) VALUES
('site_title', '"GDG@PSU - Google Developer Group at Penn State"', 'Main site title'),
('site_description', '"The official Google Developer Group chapter at Penn State University. Join us for workshops, events, and networking opportunities."', 'Site meta description'),
('contact_email', '"contact@gdgpsu.org"', 'Main contact email'),
('admin_secret_code', '"gdg-secret@psu.edu"', 'Secret code for admin access'),
('chapter_founded', '"2024"', 'Year the chapter was founded'),
('member_count', '150', 'Approximate member count'),
('events_hosted', '25', 'Number of events hosted'),
('projects_completed', '12', 'Number of projects completed');

-- Insert navigation items
INSERT INTO navigation_items (label, href, icon, order_index, is_active) VALUES
('Home', '/', 'Home', 1, true),
('Events', '/events', 'Calendar', 2, true),
('Projects', '/projects', 'Code', 3, true),
('Team', '/team', 'Users', 4, true),
('Blog', '/blog', 'BookOpen', 5, true),
('Resources', '/resources', 'Library', 6, true),
('Sponsors', '/sponsors', 'Building2', 7, true),
('Contact', '/contact', 'Mail', 8, true);

-- Insert social links
INSERT INTO social_links (platform, url, icon, order_index, is_active) VALUES
('GitHub', 'https://github.com/gdgpsu', 'Github', 1, true),
('LinkedIn', 'https://linkedin.com/company/gdgpsu', 'Linkedin', 2, true),
('Twitter', 'https://twitter.com/gdgpsu', 'Twitter', 3, true),
('Instagram', 'https://instagram.com/gdgpsu', 'Instagram', 4, true),
('Discord', 'https://discord.gg/gdgpsu', 'MessageCircle', 5, true);

-- Insert page content
INSERT INTO page_content (page_slug, section_key, content, is_active, order_index) VALUES
('home', 'hero', '{"title": "Welcome to GDG@PSU", "subtitle": "Google Developer Group at Penn State University", "description": "Join our community of passionate developers, designers, and tech enthusiasts. Learn, build, and grow together.", "cta_text": "Join Us Today", "cta_link": "/contact"}', true, 1),
('home', 'about', '{"title": "About Our Chapter", "description": "GDG@PSU is the official Google Developer Group chapter at Penn State University. We organize workshops, hackathons, and networking events to help students and professionals grow their technical skills and connect with the tech community.", "stats": [{"label": "Members", "value": "150+"}, {"label": "Events", "value": "25+"}, {"label": "Projects", "value": "12+"}]}', true, 2),
('contact', 'info', '{"email": "contact@gdgpsu.org", "location": "Penn State University, University Park, PA", "meeting_time": "Thursdays at 7:00 PM", "meeting_location": "IST Building, Room 110"}', true, 1);

-- Insert footer content
INSERT INTO footer_content (section_key, content, is_active, order_index) VALUES
('about', '{"title": "GDG@PSU", "description": "The official Google Developer Group chapter at Penn State University. Building a community of passionate developers and tech enthusiasts."}', true, 1),
('quick_links', '{"title": "Quick Links", "links": [{"label": "Events", "href": "/events"}, {"label": "Projects", "href": "/projects"}, {"label": "Team", "href": "/team"}, {"label": "Join Us", "href": "/contact"}]}', true, 2),
('resources', '{"title": "Resources", "links": [{"label": "Google Developers", "href": "https://developers.google.com"}, {"label": "GDG Global", "href": "https://gdg.community.dev"}, {"label": "Penn State", "href": "https://psu.edu"}, {"label": "IST College", "href": "https://ist.psu.edu"}]}', true, 3),
('contact', '{"title": "Contact", "email": "contact@gdgpsu.org", "location": "University Park, PA"}', true, 4);