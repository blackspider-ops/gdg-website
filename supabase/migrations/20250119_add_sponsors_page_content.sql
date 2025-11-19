-- Add tables for managing all sponsors page content

-- Sponsorship tiers with benefits
CREATE TABLE IF NOT EXISTS sponsorship_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tier_name TEXT NOT NULL,
  tier_level TEXT NOT NULL UNIQUE,
  amount TEXT NOT NULL,
  color_gradient TEXT NOT NULL,
  benefits TEXT[] NOT NULL DEFAULT '{}',
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Impact statistics
CREATE TABLE IF NOT EXISTS sponsor_impact_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stat_label TEXT NOT NULL,
  stat_value TEXT NOT NULL,
  stat_description TEXT NOT NULL,
  icon_name TEXT NOT NULL DEFAULT 'users',
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Insert default sponsorship tiers
INSERT INTO sponsorship_tiers (tier_name, tier_level, amount, color_gradient, benefits, order_index) VALUES
('Platinum', 'platinum', '$5,000+', 'bg-gradient-to-r from-gray-300 to-gray-500', 
  ARRAY['Logo on all event materials', 'Speaking opportunities', 'Recruiting access', 'Custom workshop sponsorship', 'Year-round partnership'], 0),
('Gold', 'gold', '$2,500+', 'bg-gradient-to-r from-yellow-400 to-yellow-600',
  ARRAY['Logo on event materials', 'Booth at major events', 'Newsletter mentions', 'Social media recognition'], 1),
('Silver', 'silver', '$1,000+', 'bg-gradient-to-r from-gray-400 to-gray-600',
  ARRAY['Logo on website', 'Event mentions', 'Social media shoutouts', 'Networking opportunities'], 2),
('Bronze', 'bronze', '$500+', 'bg-gradient-to-r from-orange-400 to-orange-600',
  ARRAY['Website listing', 'Thank you mentions', 'Community recognition'], 3);

-- Insert default impact stats
INSERT INTO sponsor_impact_stats (stat_label, stat_value, stat_description, icon_name, order_index) VALUES
('Active Members', '500+', 'Active Members', 'users', 0),
('Events This Year', '24', 'Events This Year', 'calendar', 1),
('Student Projects', '15', 'Student Projects', 'award', 2),
('Satisfaction Rate', '95%', 'Satisfaction Rate', 'heart', 3);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sponsorship_tiers_active ON sponsorship_tiers(is_active);
CREATE INDEX IF NOT EXISTS idx_sponsorship_tiers_order ON sponsorship_tiers(order_index);
CREATE INDEX IF NOT EXISTS idx_sponsor_impact_stats_active ON sponsor_impact_stats(is_active);
CREATE INDEX IF NOT EXISTS idx_sponsor_impact_stats_order ON sponsor_impact_stats(order_index);

-- Enable RLS
ALTER TABLE sponsorship_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsor_impact_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow public read, authenticated write
CREATE POLICY "Allow public read access to sponsorship tiers"
  ON sponsorship_tiers FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated insert to sponsorship tiers"
  ON sponsorship_tiers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update to sponsorship tiers"
  ON sponsorship_tiers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete to sponsorship tiers"
  ON sponsorship_tiers FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Allow public read access to impact stats"
  ON sponsor_impact_stats FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated insert to impact stats"
  ON sponsor_impact_stats FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update to impact stats"
  ON sponsor_impact_stats FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete to impact stats"
  ON sponsor_impact_stats FOR DELETE
  TO authenticated
  USING (true);
