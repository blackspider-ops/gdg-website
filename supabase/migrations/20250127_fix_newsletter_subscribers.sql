-- Fix newsletter_subscribers table and policies
-- Ensure the table exists and has proper RLS policies

-- Create newsletter_subscribers table if it doesn't exist
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    confirmation_token TEXT,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    unsubscribe_token TEXT DEFAULT gen_random_uuid()::TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Allow all operations on newsletter_subscribers" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Public can insert newsletter_subscribers" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Public can read own newsletter_subscribers" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Public can update newsletter_subscribers" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Admins can manage newsletter_subscribers" ON newsletter_subscribers;

-- Create comprehensive policies
CREATE POLICY "Enable all operations for newsletter_subscribers" ON newsletter_subscribers
    FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON newsletter_subscribers TO authenticated;
GRANT ALL ON newsletter_subscribers TO anon;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_confirmed_at ON newsletter_subscribers(confirmed_at);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_is_active ON newsletter_subscribers(is_active);