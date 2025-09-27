-- Comprehensive seed data for GDG@PSU with sample content for all sections
-- Run this after setting up the schema and admin password

-- Update existing admin with password (replace email with your actual email)
-- Note: super_admin role includes all admin and blog_editor privileges
UPDATE admin_users 
SET password_hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
    role = 'super_admin',
    is_active = true
WHERE email = 'tms7397@psu.edu';

-- Insert additional users with different roles for demonstration
INSERT INTO admin_users (email, password_hash, role, is_active) VALUES
-- Regular admin user
('admin@psu.edu', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', true),
-- Blog editor user
('blog-editor@psu.edu', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'blog_editor', true)
ON CONFLICT (email) DO UPDATE SET 
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active;

-- Insert comprehensive site content
INSERT INTO site_content (section, key, value) VALUES 
-- Hero section
('hero', 'title', '"Google Developer Groups at Penn State"'),
('hero', 'subtitle', '"Student Chapter"'),
('hero', 'description', '"Hands-on workshops, study jams, and projects across Android, Cloud, and AI."'),

-- About section
('about', 'title', '"About GDG@PSU"'),
('about', 'description', '"We are a community of students passionate about Google technologies and development. Join us for workshops, hackathons, and networking opportunities."'),

-- Contact information
('contact', 'email', '"contact@gdgpsu.com"'),
('contact', 'discord', '"https://discord.gg/gdgpsu"'),
('contact', 'phone', '"+1 (814) 555-0123"'),
('contact', 'address', '"Penn State University, University Park, PA"'),

-- Social media links
('social', 'instagram', '"https://instagram.com/gdgpsu"'),
('social', 'linkedin', '"https://linkedin.com/company/gdgpsu"'),
('social', 'github', '"https://github.com/gdgpsu"'),
('social', 'twitter', '"https://twitter.com/gdgpsu"'),

-- Footer content
('footer', 'description', '"GDG on Campus is a program of Google Developer Groups. This chapter is student-led and not sponsored by Google."'),
('footer', 'copyright', '"© 2025 GDG@PSU. All rights reserved."')

ON CONFLICT (section, key) DO UPDATE SET value = EXCLUDED.value;

-- Insert sample events
INSERT INTO events (title, description, date, location, image_url, registration_url, is_featured) VALUES 
('Welcome to GDG@PSU', 'Join us for our first meeting of the semester! Learn about Google technologies, meet fellow developers, and discover what GDG@PSU has to offer.', '2025-02-15 18:00:00+00', 'IST Building, Room 110', 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800', 'https://forms.google.com/welcome-event', true),

('Android Development Workshop', 'Learn the basics of Android development with Kotlin and Android Studio. Build your first mobile app from scratch!', '2025-02-22 19:00:00+00', 'Westgate Building, Lab E262', 'https://images.unsplash.com/photo-1607252650355-f7fd0460ccdb?w=800', 'https://forms.google.com/android-workshop', true),

('Firebase Study Jam', 'Hands-on workshop building real-time applications with Firebase. Learn about authentication, database, and hosting.', '2025-03-01 18:30:00+00', 'IST Building, Room 220', 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800', 'https://forms.google.com/firebase-jam', false),

('Google Cloud Platform Bootcamp', 'Dive deep into Google Cloud Platform services. Learn about compute, storage, and machine learning APIs.', '2025-03-08 17:00:00+00', 'Forum Building, Auditorium', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800', 'https://forms.google.com/gcp-bootcamp', true),

('AI/ML Workshop Series - Part 1', 'Introduction to Machine Learning with TensorFlow. Build your first neural network and understand the basics of AI.', '2025-03-15 18:00:00+00', 'IST Building, Room 110', 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800', 'https://forms.google.com/ml-workshop', false);

-- Insert sample team members
INSERT INTO team_members (name, role, bio, image_url, linkedin_url, github_url, order_index, is_active) VALUES 
('Tejas Singhal', 'Chapter Lead', 'Computer Science senior passionate about building developer communities and exploring cutting-edge technologies. Loves organizing events and connecting students with industry professionals.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', 'https://linkedin.com/in/tejas-singhal', 'https://github.com/tejas-singhal', 1, true),

('Karthik Krishnan', 'Co-Organizer / Vice Lead', 'Junior studying Computer Science with expertise in web development and cloud computing. Enthusiastic about mentoring new developers and organizing technical workshops.', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400', 'https://linkedin.com/in/karthik-krishnan', 'https://github.com/karthik-krishnan', 2, true),

('Sarah Chen', 'Technical Lead', 'Software Engineering student specializing in mobile development and UI/UX design. Leads our Android development workshops and mentors students in app development.', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400', 'https://linkedin.com/in/sarah-chen', 'https://github.com/sarah-chen', 3, true),

('Michael Rodriguez', 'Community Manager', 'Information Sciences major focused on community building and event coordination. Manages our social media presence and organizes networking events.', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400', 'https://linkedin.com/in/michael-rodriguez', 'https://github.com/michael-rodriguez', 4, true),

('Emily Johnson', 'Workshop Coordinator', 'Computer Science junior with a passion for teaching and curriculum development. Designs and coordinates our technical workshops and study jams.', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400', 'https://linkedin.com/in/emily-johnson', 'https://github.com/emily-johnson', 5, true);

-- Insert sample projects
INSERT INTO projects (title, description, tech_stack, github_url, demo_url, image_url, is_featured) VALUES 
('GDG@PSU Website', 'Official website for Google Developer Groups at Penn State University. Built with modern web technologies including React, TypeScript, and Supabase for a complete full-stack solution.', ARRAY['React', 'TypeScript', 'Tailwind CSS', 'Supabase', 'Vite'], 'https://github.com/gdgpsu/website', 'https://gdgpsu.com', 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800', true),

('Campus Event Finder', 'A mobile app that helps Penn State students discover and track campus events. Features real-time notifications, event filtering, and social sharing capabilities.', ARRAY['Flutter', 'Firebase', 'Google Maps API', 'Dart'], 'https://github.com/gdgpsu/event-finder', 'https://play.google.com/store/apps/event-finder', 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800', true),

('Study Group Matcher', 'Web platform that connects Penn State students for study groups based on courses, learning preferences, and schedules. Includes chat functionality and meeting coordination.', ARRAY['React', 'Node.js', 'MongoDB', 'Socket.io', 'Express'], 'https://github.com/gdgpsu/study-matcher', 'https://study-matcher.gdgpsu.com', 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800', false),

('PSU Course Planner', 'Smart course planning tool for Penn State students. Uses machine learning to suggest optimal course schedules based on prerequisites, professor ratings, and student preferences.', ARRAY['Python', 'TensorFlow', 'Flask', 'PostgreSQL', 'React'], 'https://github.com/gdgpsu/course-planner', 'https://courses.gdgpsu.com', 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800', true),

('Campus Safety App', 'Emergency safety app for Penn State campus with features like emergency contacts, safe walk requests, and real-time location sharing with trusted contacts.', ARRAY['React Native', 'Firebase', 'Google Maps', 'Push Notifications'], 'https://github.com/gdgpsu/safety-app', 'https://safety.gdgpsu.com', 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=800', false);

-- Insert sample sponsors
INSERT INTO sponsors (name, logo_url, website_url, tier, order_index, is_active) VALUES 
('Google', 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=400', 'https://google.com', 'platinum', 1, true),
('Microsoft', 'https://images.unsplash.com/photo-1617042375876-a13e36732a04?w=400', 'https://microsoft.com', 'gold', 2, true),
('Amazon Web Services', 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=400', 'https://aws.amazon.com', 'gold', 3, true),
('GitHub', 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=400', 'https://github.com', 'silver', 4, true),
('Vercel', 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400', 'https://vercel.com', 'silver', 5, true),
('DigitalOcean', 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400', 'https://digitalocean.com', 'bronze', 6, true);

-- Insert some sample newsletter subscribers
INSERT INTO newsletter_subscribers (email, is_active) VALUES 
('student1@psu.edu', true),
('student2@psu.edu', true),
('student3@psu.edu', true),
('alumni@gdgpsu.com', true),
('mentor@industry.com', true)
ON CONFLICT (email) DO NOTHING;