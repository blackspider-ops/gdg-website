-- Create linktree_profiles table
CREATE TABLE IF NOT EXISTS linktree_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    background_type VARCHAR(20) DEFAULT 'color' CHECK (background_type IN ('color', 'gradient', 'image')),
    background_value TEXT DEFAULT '#1a1a1a',
    theme VARCHAR(20) DEFAULT 'dark' CHECK (theme IN ('light', 'dark', 'auto')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create linktree_links table
CREATE TABLE IF NOT EXISTS linktree_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES linktree_profiles(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    icon_type VARCHAR(20) DEFAULT 'link' CHECK (icon_type IN ('link', 'social', 'custom')),
    icon_value TEXT,
    button_style VARCHAR(20) DEFAULT 'default' CHECK (button_style IN ('default', 'outline', 'filled', 'minimal')),
    button_color VARCHAR(7) DEFAULT '#ffffff',
    text_color VARCHAR(7) DEFAULT '#000000',
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create linktree_analytics table
CREATE TABLE IF NOT EXISTS linktree_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES linktree_profiles(id) ON DELETE CASCADE,
    link_id UUID REFERENCES linktree_links(id) ON DELETE CASCADE,
    visitor_ip INET,
    user_agent TEXT,
    referrer TEXT,
    country VARCHAR(2),
    city VARCHAR(100),
    clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_linktree_profiles_username ON linktree_profiles(username);
CREATE INDEX IF NOT EXISTS idx_linktree_links_profile_id ON linktree_links(profile_id);
CREATE INDEX IF NOT EXISTS idx_linktree_links_sort_order ON linktree_links(profile_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_linktree_analytics_profile_id ON linktree_analytics(profile_id);
CREATE INDEX IF NOT EXISTS idx_linktree_analytics_link_id ON linktree_analytics(link_id);
CREATE INDEX IF NOT EXISTS idx_linktree_analytics_clicked_at ON linktree_analytics(clicked_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_linktree_profiles_updated_at 
    BEFORE UPDATE ON linktree_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_linktree_links_updated_at 
    BEFORE UPDATE ON linktree_links 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE linktree_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE linktree_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE linktree_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for public access to view profiles and links
CREATE POLICY "Public can view active profiles" ON linktree_profiles
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view active links" ON linktree_links
    FOR SELECT USING (is_active = true);

-- RLS Policies for admin access
CREATE POLICY "Admins can manage profiles" ON linktree_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.is_active = true
        )
    );

CREATE POLICY "Admins can manage links" ON linktree_links
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.is_active = true
        )
    );

CREATE POLICY "Admins can view analytics" ON linktree_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.is_active = true
        )
    );

-- Policy for inserting analytics (public can insert)
CREATE POLICY "Public can insert analytics" ON linktree_analytics
    FOR INSERT WITH CHECK (true);