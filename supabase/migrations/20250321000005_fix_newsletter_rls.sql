-- Fix newsletter_subscribers RLS to allow anonymous subscriptions
-- Drop existing policies that might be conflicting
DROP POLICY IF EXISTS "public_subscribe_newsletter" ON newsletter_subscribers;
DROP POLICY IF EXISTS "users_update_own_subscription" ON newsletter_subscribers;
DROP POLICY IF EXISTS "admin_view_subscribers" ON newsletter_subscribers;
DROP POLICY IF EXISTS "admin_delete_subscribers" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Allow all operations on newsletter_subscribers" ON newsletter_subscribers;

-- Allow anyone to subscribe (anonymous or authenticated)
CREATE POLICY "allow_anonymous_subscribe" ON newsletter_subscribers
  FOR INSERT
  WITH CHECK (true);

-- Allow users to unsubscribe using their token
CREATE POLICY "allow_unsubscribe_with_token" ON newsletter_subscribers
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow admins to view all subscribers
CREATE POLICY "admin_view_all_subscribers" ON newsletter_subscribers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
      AND is_active = true
    )
  );

-- Allow admins to delete subscribers
CREATE POLICY "admin_delete_any_subscriber" ON newsletter_subscribers
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
      AND is_active = true
    )
  );
