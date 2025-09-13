-- Add email logs table for tracking newsletter sends
-- This helps with debugging and analytics

CREATE TABLE IF NOT EXISTS newsletter_email_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    campaign_id UUID REFERENCES newsletter_campaigns(id) ON DELETE CASCADE,
    subscriber_id UUID REFERENCES newsletter_subscribers(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'bounced', 'opened', 'clicked')),
    resend_id TEXT, -- Resend email ID for tracking
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_newsletter_email_logs_campaign_id ON newsletter_email_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_email_logs_subscriber_id ON newsletter_email_logs(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_email_logs_status ON newsletter_email_logs(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_email_logs_sent_at ON newsletter_email_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_newsletter_email_logs_resend_id ON newsletter_email_logs(resend_id);

-- Enable RLS
ALTER TABLE newsletter_email_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Admins can manage newsletter_email_logs" ON newsletter_email_logs 
FOR ALL USING (true);

-- Add webhook endpoint tracking table for Resend webhooks
CREATE TABLE IF NOT EXISTS newsletter_webhooks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    resend_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    email TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    data JSONB,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for webhook processing
CREATE INDEX IF NOT EXISTS idx_newsletter_webhooks_resend_id ON newsletter_webhooks(resend_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_webhooks_event_type ON newsletter_webhooks(event_type);
CREATE INDEX IF NOT EXISTS idx_newsletter_webhooks_processed ON newsletter_webhooks(processed);

-- Enable RLS
ALTER TABLE newsletter_webhooks ENABLE ROW LEVEL SECURITY;

-- Create RLS policy (webhooks are processed by system, not users)
CREATE POLICY "System can manage newsletter_webhooks" ON newsletter_webhooks 
FOR ALL USING (true);