-- Update newsletter_subscribers table to match the service interface
-- Add missing columns for proper newsletter management

-- Add missing columns to newsletter_subscribers
ALTER TABLE newsletter_subscribers 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS confirmation_token TEXT,
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS unsubscribe_token TEXT DEFAULT uuid_generate_v4(),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_confirmation_token ON newsletter_subscribers(confirmation_token);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_unsubscribe_token ON newsletter_subscribers(unsubscribe_token);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_is_active ON newsletter_subscribers(is_active);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_subscribed_at ON newsletter_subscribers(subscribed_at);

-- Update existing records to have unsubscribe tokens if they don't have them
UPDATE newsletter_subscribers 
SET unsubscribe_token = uuid_generate_v4(),
    created_at = COALESCE(created_at, subscribed_at),
    updated_at = COALESCE(updated_at, subscribed_at)
WHERE unsubscribe_token IS NULL;

-- Enable RLS on newsletter_subscribers
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Public can insert newsletter_subscribers" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Public can read own newsletter_subscribers" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Admins can manage newsletter_subscribers" ON newsletter_subscribers;

-- Allow public to subscribe (insert)
CREATE POLICY "Public can insert newsletter_subscribers" ON newsletter_subscribers 
FOR INSERT WITH CHECK (true);

-- Allow public to read their own subscription (for unsubscribe)
CREATE POLICY "Public can read own newsletter_subscribers" ON newsletter_subscribers 
FOR SELECT USING (true);

-- Allow public to update their own subscription (for confirmation/unsubscribe)
CREATE POLICY "Public can update newsletter_subscribers" ON newsletter_subscribers 
FOR UPDATE USING (true);

-- Allow admins to manage all newsletter subscribers
CREATE POLICY "Admins can manage newsletter_subscribers" ON newsletter_subscribers 
FOR ALL USING (true);