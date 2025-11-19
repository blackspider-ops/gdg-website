-- Add newsletter campaigns and templates tables
-- This enables full newsletter management functionality

-- Newsletter campaigns table
CREATE TABLE IF NOT EXISTS newsletter_campaigns (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    html_content TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    recipient_count INTEGER DEFAULT 0,
    open_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Newsletter templates table
CREATE TABLE IF NOT EXISTS newsletter_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    html_content TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_status ON newsletter_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_created_at ON newsletter_campaigns(created_at);
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_sent_at ON newsletter_campaigns(sent_at);
CREATE INDEX IF NOT EXISTS idx_newsletter_templates_is_active ON newsletter_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_newsletter_templates_created_at ON newsletter_templates(created_at);

-- Enable RLS
ALTER TABLE newsletter_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Newsletter campaigns - admin only
CREATE POLICY "Admins can manage newsletter_campaigns" ON newsletter_campaigns 
FOR ALL USING (true);

-- Newsletter templates - admin only
CREATE POLICY "Admins can manage newsletter_templates" ON newsletter_templates 
FOR ALL USING (true);

-- Insert some default templates
INSERT INTO newsletter_templates (name, description, content, html_content) VALUES
(
    'Welcome Newsletter',
    'Template for welcoming new members',
    'Welcome to GDG@PSU!

We''re excited to have you join our community of developers and tech enthusiasts.

What to expect:
- Regular updates about upcoming events
- Workshop announcements
- Tech industry insights
- Networking opportunities

Stay tuned for more updates!

Best regards,
The GDG@PSU Team',
    '<h1>Welcome to GDG@PSU!</h1>
<p>We''re excited to have you join our community of developers and tech enthusiasts.</p>
<h2>What to expect:</h2>
<ul>
<li>Regular updates about upcoming events</li>
<li>Workshop announcements</li>
<li>Tech industry insights</li>
<li>Networking opportunities</li>
</ul>
<p>Stay tuned for more updates!</p>
<p>Best regards,<br>The GDG@PSU Team</p>'
),
(
    'Event Announcement',
    'Template for announcing upcoming events',
    'Exciting Event Coming Up!

Event: [EVENT_NAME]
Date: [EVENT_DATE]
Time: [EVENT_TIME]
Location: [EVENT_LOCATION]

[EVENT_DESCRIPTION]

Registration: [REGISTRATION_LINK]

Don''t miss out on this amazing opportunity!

See you there,
The GDG@PSU Team',
    '<h1>Exciting Event Coming Up!</h1>
<h2>[EVENT_NAME]</h2>
<p><strong>Date:</strong> [EVENT_DATE]<br>
<strong>Time:</strong> [EVENT_TIME]<br>
<strong>Location:</strong> [EVENT_LOCATION]</p>
<p>[EVENT_DESCRIPTION]</p>
<p><a href="[REGISTRATION_LINK]" style="background-color: #4285f4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Register Now</a></p>
<p>Don''t miss out on this amazing opportunity!</p>
<p>See you there,<br>The GDG@PSU Team</p>'
),
(
    'Monthly Update',
    'Template for monthly newsletter updates',
    'GDG@PSU Monthly Update

Hello GDG@PSU Community!

Here''s what happened this month:

Recent Events:
- [EVENT_1]
- [EVENT_2]

Upcoming Events:
- [UPCOMING_EVENT_1]
- [UPCOMING_EVENT_2]

Community Highlights:
- [HIGHLIGHT_1]
- [HIGHLIGHT_2]

Tech News:
- [NEWS_1]
- [NEWS_2]

Thank you for being part of our community!

Best regards,
The GDG@PSU Team',
    '<h1>GDG@PSU Monthly Update</h1>
<p>Hello GDG@PSU Community!</p>
<p>Here''s what happened this month:</p>
<h2>Recent Events:</h2>
<ul><li>[EVENT_1]</li><li>[EVENT_2]</li></ul>
<h2>Upcoming Events:</h2>
<ul><li>[UPCOMING_EVENT_1]</li><li>[UPCOMING_EVENT_2]</li></ul>
<h2>Community Highlights:</h2>
<ul><li>[HIGHLIGHT_1]</li><li>[HIGHLIGHT_2]</li></ul>
<h2>Tech News:</h2>
<ul><li>[NEWS_1]</li><li>[NEWS_2]</li></ul>
<p>Thank you for being part of our community!</p>
<p>Best regards,<br>The GDG@PSU Team</p>'
)
ON CONFLICT DO NOTHING;