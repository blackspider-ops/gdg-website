-- =============================================
-- Additional Features Migration
-- Notifications, Finance Reports Enhancement
-- =============================================

-- =============================================
-- 1. NOTIFICATIONS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(500),
  is_read BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- =============================================
-- 2. ENHANCE FINANCE ATTACHMENTS
-- =============================================

-- Add storage bucket reference if not exists
ALTER TABLE finance_attachments 
ADD COLUMN IF NOT EXISTS storage_path VARCHAR(500);

-- =============================================
-- 3. TEAM MEMBER TRANSFER HISTORY
-- =============================================

CREATE TABLE IF NOT EXISTS team_member_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id UUID NOT NULL,
  from_team_id UUID NOT NULL REFERENCES admin_teams(id),
  to_team_id UUID NOT NULL REFERENCES admin_teams(id),
  transferred_by UUID NOT NULL REFERENCES admin_users(id),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_transfers_membership ON team_member_transfers(membership_id);
CREATE INDEX IF NOT EXISTS idx_team_transfers_from_team ON team_member_transfers(from_team_id);
CREATE INDEX IF NOT EXISTS idx_team_transfers_to_team ON team_member_transfers(to_team_id);

-- =============================================
-- 4. FINANCE REPORTS CACHE (for performance)
-- =============================================

CREATE TABLE IF NOT EXISTS finance_report_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type VARCHAR(50) NOT NULL,
  team_id UUID REFERENCES admin_teams(id),
  fiscal_year VARCHAR(10),
  report_data JSONB NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 hour'
);

CREATE INDEX IF NOT EXISTS idx_finance_report_cache_type ON finance_report_cache(report_type);
CREATE INDEX IF NOT EXISTS idx_finance_report_cache_team ON finance_report_cache(team_id);
CREATE INDEX IF NOT EXISTS idx_finance_report_cache_expires ON finance_report_cache(expires_at);

-- =============================================
-- 5. RLS POLICIES
-- =============================================

-- Enable RLS on new tables
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_member_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_report_cache ENABLE ROW LEVEL SECURITY;

-- Notifications policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;
CREATE POLICY "Users can delete their own notifications" ON notifications
  FOR DELETE USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  ));

DROP POLICY IF EXISTS "Admins can create notifications" ON notifications;
CREATE POLICY "Admins can create notifications" ON notifications
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  ));

-- Team transfers policies
DROP POLICY IF EXISTS "Admins can view team transfers" ON team_member_transfers;
CREATE POLICY "Admins can view team transfers" ON team_member_transfers
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  ));

DROP POLICY IF EXISTS "Admins can create team transfers" ON team_member_transfers;
CREATE POLICY "Admins can create team transfers" ON team_member_transfers
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
  ));

-- Finance report cache policies
DROP POLICY IF EXISTS "Admins can view finance reports" ON finance_report_cache;
CREATE POLICY "Admins can view finance reports" ON finance_report_cache
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
  ));

DROP POLICY IF EXISTS "Admins can manage finance reports" ON finance_report_cache;
CREATE POLICY "Admins can manage finance reports" ON finance_report_cache
  FOR ALL USING (EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
  ));

-- =============================================
-- 6. HELPER FUNCTIONS
-- =============================================

-- Function to clean up old notifications
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM notifications 
  WHERE created_at < NOW() - INTERVAL '90 days' 
  AND is_read = true;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired report cache
CREATE OR REPLACE FUNCTION cleanup_expired_report_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM finance_report_cache 
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 7. GRANTS
-- =============================================

GRANT ALL ON notifications TO authenticated;
GRANT ALL ON team_member_transfers TO authenticated;
GRANT ALL ON finance_report_cache TO authenticated;
