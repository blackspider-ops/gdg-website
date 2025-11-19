-- Content Management System Migration
-- This creates tables for managing all website content dynamically

-- Site settings table for global configurations
CREATE TABLE IF NOT EXISTS site_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES admin_users(id)
);

-- Page content table for managing individual page content
CREATE TABLE IF NOT EXISTS page_content (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    page_slug TEXT NOT NULL, -- 'home', 'about', 'contact', etc.
    section_key TEXT NOT NULL, -- 'hero', 'features', 'cta', etc.
    content JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    order_index INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES admin_users(id),
    UNIQUE(page_slug, section_key)
);

-- Navigation menu management
CREATE TABLE IF NOT EXISTS navigation_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    label TEXT NOT NULL,
    href TEXT NOT NULL,
    icon TEXT, -- lucide icon name
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    parent_id UUID REFERENCES navigation_items(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES admin_users(id)
);

-- Social links management
CREATE TABLE IF NOT EXISTS social_links (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    platform TEXT NOT NULL, -- 'github', 'twitter', 'instagram', etc.
    url TEXT NOT NULL,
    icon TEXT NOT NULL, -- lucide icon name
    is_active BOOLEAN DEFAULT TRUE,
    order_index INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES admin_users(id)
);

-- Footer content management
CREATE TABLE IF NOT EXISTS footer_content (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    section_key TEXT UNIQUE NOT NULL, -- 'about', 'quick_links', 'resources', 'contact'
    content JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    order_index INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES admin_users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(key);
CREATE INDEX IF NOT EXISTS idx_page_content_page_slug ON page_content(page_slug);
CREATE INDEX IF NOT EXISTS idx_page_content_section_key ON page_content(section_key);
CREATE INDEX IF NOT EXISTS idx_navigation_items_order ON navigation_items(order_index);
CREATE INDEX IF NOT EXISTS idx_navigation_items_active ON navigation_items(is_active);
CREATE INDEX IF NOT EXISTS idx_social_links_order ON social_links(order_index);
CREATE INDEX IF NOT EXISTS idx_social_links_active ON social_links(is_active);
CREATE INDEX IF NOT EXISTS idx_footer_content_section ON footer_content(section_key);

-- Add RLS policies
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE navigation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE footer_content ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public can read site_settings" ON site_settings FOR SELECT USING (true);
CREATE POLICY "Public can read page_content" ON page_content FOR SELECT USING (is_active = true);
CREATE POLICY "Public can read navigation_items" ON navigation_items FOR SELECT USING (is_active = true);
CREATE POLICY "Public can read social_links" ON social_links FOR SELECT USING (is_active = true);
CREATE POLICY "Public can read footer_content" ON footer_content FOR SELECT USING (is_active = true);

-- Admin can do everything
CREATE POLICY "Admins can manage site_settings" ON site_settings FOR ALL USING (true);
CREATE POLICY "Admins can manage page_content" ON page_content FOR ALL USING (true);
CREATE POLICY "Admins can manage navigation_items" ON navigation_items FOR ALL USING (true);
CREATE POLICY "Admins can manage social_links" ON social_links FOR ALL USING (true);
CREATE POLICY "Admins can manage footer_content" ON footer_content FOR ALL USING (true);
