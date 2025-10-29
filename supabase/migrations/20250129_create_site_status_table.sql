-- Create site_status table for managing site maintenance mode
CREATE TABLE IF NOT EXISTS site_status (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    is_live BOOLEAN NOT NULL DEFAULT true,
    redirect_url TEXT,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_site_status_created_at ON site_status(created_at DESC);

-- Insert default record (site is live by default)
INSERT INTO site_status (is_live, redirect_url, message) 
VALUES (true, 'https://www.gdgpsu.dev/l/applicationcabn', 'Site is currently under maintenance. Please check back soon!')
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE site_status ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read site status (needed for redirect functionality)
CREATE POLICY "Anyone can read site status" ON site_status
    FOR SELECT USING (true);

-- Policy: Only authenticated users can modify site status (admin only)
CREATE POLICY "Only authenticated users can modify site status" ON site_status
    FOR ALL USING (auth.role() = 'authenticated');

-- Add comment
COMMENT ON TABLE site_status IS 'Manages site-wide status and maintenance mode redirects';