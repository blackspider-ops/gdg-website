-- Initial seed data for GDG@PSU
-- Run this after setting up the schema to populate with default data

-- Insert default admin user (replace email with your actual email)
-- Default password is 'admin123' - CHANGE THIS IMMEDIATELY!
INSERT INTO admin_users (email, password_hash, role) VALUES 
('tms7397@psu.edu', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'super_admin');

-- Insert default site content
INSERT INTO site_content (section, key, value) VALUES 
('hero', 'title', '"Welcome to GDG@PSU"'),
('hero', 'subtitle', '"Google Developer Groups at Penn State University"'),
('hero', 'description', '"Join our community of developers, designers, and tech enthusiasts!"'),
('about', 'title', '"About GDG@PSU"'),
('about', 'description', '"We are a community of students passionate about Google technologies and development."'),
('contact', 'email', '"contact@gdgpsu.com"'),
('contact', 'discord', '"https://discord.gg/gdgpsu"'),
('social', 'instagram', '"https://instagram.com/gdgpsu"'),
('social', 'linkedin', '"https://linkedin.com/company/gdgpsu"'),
('social', 'github', '"https://github.com/gdgpsu"');

-- Insert sample events (optional)
INSERT INTO events (title, description, date, location, is_featured) VALUES 
('Welcome to GDG@PSU', 'Join us for our first meeting of the semester! Learn about Google technologies and meet fellow developers.', '2025-02-15 18:00:00+00', 'IST Building, Room 110', true),
('Android Development Workshop', 'Learn the basics of Android development with Kotlin and Android Studio.', '2025-02-22 19:00:00+00', 'Westgate Building, Lab E262', false);

-- Insert sample team members (optional)
INSERT INTO team_members (name, role, bio, order_index, is_active) VALUES 
('John Doe', 'President', 'Computer Science major passionate about mobile development and machine learning.', 1, true),
('Jane Smith', 'Vice President', 'Software Engineering student with expertise in web development and cloud computing.', 2, true);

-- Insert sample projects (optional)
INSERT INTO projects (title, description, tech_stack, is_featured) VALUES 
('GDG@PSU Website', 'Official website for Google Developer Groups at Penn State University built with modern web technologies.', ARRAY['React', 'TypeScript', 'Tailwind CSS', 'Supabase'], true),
('Event Management App', 'Mobile app for managing GDG events and member registration.', ARRAY['Flutter', 'Firebase', 'Dart'], false);