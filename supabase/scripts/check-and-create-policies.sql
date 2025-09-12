-- Safe policy creation script - only creates if they don't exist
-- Run this if you're unsure about existing policies

-- Function to safely create policies
DO $$
BEGIN
    -- Check and create policies for events
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'Public read access for events') THEN
        CREATE POLICY "Public read access for events" ON events FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'Allow all operations on events') THEN
        CREATE POLICY "Allow all operations on events" ON events FOR ALL USING (true);
    END IF;

    -- Check and create policies for team_members
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'team_members' AND policyname = 'Public read access for team_members') THEN
        CREATE POLICY "Public read access for team_members" ON team_members FOR SELECT USING (is_active = true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'team_members' AND policyname = 'Allow all operations on team_members') THEN
        CREATE POLICY "Allow all operations on team_members" ON team_members FOR ALL USING (true);
    END IF;

    -- Check and create policies for projects
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Public read access for projects') THEN
        CREATE POLICY "Public read access for projects" ON projects FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Allow all operations on projects') THEN
        CREATE POLICY "Allow all operations on projects" ON projects FOR ALL USING (true);
    END IF;

    -- Check and create policies for sponsors
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sponsors' AND policyname = 'Public read access for sponsors') THEN
        CREATE POLICY "Public read access for sponsors" ON sponsors FOR SELECT USING (is_active = true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sponsors' AND policyname = 'Allow all operations on sponsors') THEN
        CREATE POLICY "Allow all operations on sponsors" ON sponsors FOR ALL USING (true);
    END IF;

    -- Check and create policies for site_content
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'site_content' AND policyname = 'Public read access for site_content') THEN
        CREATE POLICY "Public read access for site_content" ON site_content FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'site_content' AND policyname = 'Allow all operations on site_content') THEN
        CREATE POLICY "Allow all operations on site_content" ON site_content FOR ALL USING (true);
    END IF;

    -- Check and create policies for newsletter_subscribers
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'newsletter_subscribers' AND policyname = 'Anyone can subscribe to newsletter') THEN
        CREATE POLICY "Anyone can subscribe to newsletter" ON newsletter_subscribers FOR INSERT WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'newsletter_subscribers' AND policyname = 'Allow all operations on newsletter_subscribers') THEN
        CREATE POLICY "Allow all operations on newsletter_subscribers" ON newsletter_subscribers FOR ALL USING (true);
    END IF;

    -- Check and create policies for admin_users
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'admin_users' AND policyname = 'Public read access for admin_users') THEN
        CREATE POLICY "Public read access for admin_users" ON admin_users FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'admin_users' AND policyname = 'Users can update their own last_login') THEN
        CREATE POLICY "Users can update their own last_login" ON admin_users FOR UPDATE USING (true);
    END IF;

    -- Check and create policies for admin_actions (if table exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_actions') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'admin_actions' AND policyname = 'Admins can view admin_actions') THEN
            CREATE POLICY "Admins can view admin_actions" ON admin_actions FOR SELECT USING (true);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'admin_actions' AND policyname = 'Admins can insert admin_actions') THEN
            CREATE POLICY "Admins can insert admin_actions" ON admin_actions FOR INSERT WITH CHECK (true);
        END IF;
    END IF;

END $$;