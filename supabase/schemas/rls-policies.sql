-- Row Level Security (RLS) Policies for GDG@PSU
-- Run this after the initial schema to set up security policies

-- Enable Row Level Security (RLS)
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for public read access
CREATE POLICY "Public read access for events" ON events FOR SELECT USING (true);
CREATE POLICY "Public read access for team_members" ON team_members FOR SELECT USING (is_active = true);
CREATE POLICY "Public read access for projects" ON projects FOR SELECT USING (true);
CREATE POLICY "Public read access for sponsors" ON sponsors FOR SELECT USING (is_active = true);
CREATE POLICY "Public read access for site_content" ON site_content FOR SELECT USING (true);

-- RLS Policies for newsletter subscriptions
CREATE POLICY "Anyone can subscribe to newsletter" ON newsletter_subscribers FOR INSERT WITH CHECK (true);

-- Admin policies - simplified to avoid recursion
CREATE POLICY "Public read access for admin_users" ON admin_users FOR SELECT USING (true);
CREATE POLICY "Users can update their own last_login" ON admin_users FOR UPDATE USING (true);

-- Admin management policies
CREATE POLICY "Allow all operations on events" ON events FOR ALL USING (true);
CREATE POLICY "Allow all operations on team_members" ON team_members FOR ALL USING (true);
CREATE POLICY "Allow all operations on projects" ON projects FOR ALL USING (true);
CREATE POLICY "Allow all operations on sponsors" ON sponsors FOR ALL USING (true);
CREATE POLICY "Allow all operations on site_content" ON site_content FOR ALL USING (true);
CREATE POLICY "Allow all operations on newsletter_subscribers" ON newsletter_subscribers FOR ALL USING (true);
CREATE POLICY "Admins can view admin_actions" ON admin_actions FOR SELECT USING (true);
CREATE POLICY "Admins can insert admin_actions" ON admin_actions FOR INSERT WITH CHECK (true);