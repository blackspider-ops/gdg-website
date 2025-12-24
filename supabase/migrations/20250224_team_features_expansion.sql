-- Team Features Expansion Migration
-- Adds: Activity logs, invites, team messaging, enhanced finance workflow

-- ============================================
-- 1. TEAM ACTIVITY LOG
-- ============================================
CREATE TABLE IF NOT EXISTS team_activity_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    team_id UUID NOT NULL REFERENCES admin_teams(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'member_added', 'member_removed', 'role_changed', 'announcement_posted', etc.
    target_user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_activity_team ON team_activity_log(team_id);
CREATE INDEX IF NOT EXISTS idx_team_activity_actor ON team_activity_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_team_activity_created ON team_activity_log(created_at DESC);

-- ============================================
-- 2. TEAM INVITES
-- ============================================
CREATE TABLE IF NOT EXISTS team_invites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    team_id UUID NOT NULL REFERENCES admin_teams(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('lead', 'co_lead', 'member')),
    invited_by UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_invites_team ON team_invites(team_id);
CREATE INDEX IF NOT EXISTS idx_team_invites_email ON team_invites(email);
CREATE INDEX IF NOT EXISTS idx_team_invites_token ON team_invites(token);
CREATE INDEX IF NOT EXISTS idx_team_invites_status ON team_invites(status);

-- ============================================
-- 3. TEAM MESSAGES (Internal Communication)
-- ============================================
CREATE TABLE IF NOT EXISTS team_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    team_id UUID NOT NULL REFERENCES admin_teams(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image', 'link')),
    attachment_url TEXT,
    reply_to_id UUID REFERENCES team_messages(id) ON DELETE SET NULL,
    is_pinned BOOLEAN DEFAULT FALSE,
    read_by UUID[] DEFAULT '{}',
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_messages_team ON team_messages(team_id);
CREATE INDEX IF NOT EXISTS idx_team_messages_sender ON team_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_team_messages_created ON team_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_team_messages_pinned ON team_messages(is_pinned) WHERE is_pinned = true;

-- ============================================
-- 4. FINANCE APPROVAL WORKFLOW UPDATES
-- ============================================
-- Add submitted_by field to track who submitted (different from created_by for team submissions)
ALTER TABLE finances 
ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES admin_users(id) ON DELETE SET NULL;

-- Add rejection reason
ALTER TABLE finances 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add approval level tracking
ALTER TABLE finances 
ADD COLUMN IF NOT EXISTS approval_level TEXT DEFAULT 'pending' 
CHECK (approval_level IN ('pending', 'team_lead_approved', 'admin_approved', 'super_admin_approved', 'rejected'));

-- ============================================
-- 5. TEAM STATISTICS CACHE (for performance)
-- ============================================
CREATE TABLE IF NOT EXISTS team_statistics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    team_id UUID NOT NULL REFERENCES admin_teams(id) ON DELETE CASCADE,
    stat_type TEXT NOT NULL, -- 'events_created', 'posts_published', 'members_added', etc.
    stat_period TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'all_time'
    stat_date DATE NOT NULL,
    stat_value INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, stat_type, stat_period, stat_date)
);

CREATE INDEX IF NOT EXISTS idx_team_statistics_team ON team_statistics(team_id);
CREATE INDEX IF NOT EXISTS idx_team_statistics_type ON team_statistics(stat_type);
CREATE INDEX IF NOT EXISTS idx_team_statistics_date ON team_statistics(stat_date);

-- ============================================
-- 6. TEAM PAGE PERMISSIONS (explicit page access)
-- ============================================
CREATE TABLE IF NOT EXISTS team_page_access (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    team_id UUID NOT NULL REFERENCES admin_teams(id) ON DELETE CASCADE,
    page_path TEXT NOT NULL,
    can_access BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, page_path)
);

CREATE INDEX IF NOT EXISTS idx_team_page_access_team ON team_page_access(team_id);
CREATE INDEX IF NOT EXISTS idx_team_page_access_path ON team_page_access(page_path);

-- ============================================
-- 7. RLS POLICIES
-- ============================================
ALTER TABLE team_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_page_access ENABLE ROW LEVEL SECURITY;

-- Allow all operations (we handle permissions in application layer)
DROP POLICY IF EXISTS "Allow all on team_activity_log" ON team_activity_log;
CREATE POLICY "Allow all on team_activity_log" ON team_activity_log FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all on team_invites" ON team_invites;
CREATE POLICY "Allow all on team_invites" ON team_invites FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all on team_messages" ON team_messages;
CREATE POLICY "Allow all on team_messages" ON team_messages FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all on team_statistics" ON team_statistics;
CREATE POLICY "Allow all on team_statistics" ON team_statistics FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all on team_page_access" ON team_page_access;
CREATE POLICY "Allow all on team_page_access" ON team_page_access FOR ALL USING (true);

-- ============================================
-- 8. TRIGGERS
-- ============================================
DROP TRIGGER IF EXISTS update_team_messages_updated_at ON team_messages;
CREATE TRIGGER update_team_messages_updated_at
    BEFORE UPDATE ON team_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_team_statistics_updated_at ON team_statistics;
CREATE TRIGGER update_team_statistics_updated_at
    BEFORE UPDATE ON team_statistics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. DEFAULT PAGE ACCESS FOR EXISTING TEAMS
-- ============================================
-- Events team -> Events page
INSERT INTO team_page_access (team_id, page_path, can_access)
SELECT id, '/admin/events', true FROM admin_teams WHERE slug = 'events'
ON CONFLICT (team_id, page_path) DO NOTHING;

-- Sponsorship team -> Sponsors page
INSERT INTO team_page_access (team_id, page_path, can_access)
SELECT id, '/admin/sponsors', true FROM admin_teams WHERE slug = 'sponsorship-outreach'
ON CONFLICT (team_id, page_path) DO NOTHING;

INSERT INTO team_page_access (team_id, page_path, can_access)
SELECT id, '/admin/newsletter', true FROM admin_teams WHERE slug = 'sponsorship-outreach'
ON CONFLICT (team_id, page_path) DO NOTHING;

-- Marketing team -> Media, Content pages
INSERT INTO team_page_access (team_id, page_path, can_access)
SELECT id, '/admin/media', true FROM admin_teams WHERE slug = 'marketing-design'
ON CONFLICT (team_id, page_path) DO NOTHING;

INSERT INTO team_page_access (team_id, page_path, can_access)
SELECT id, '/admin/content', true FROM admin_teams WHERE slug = 'marketing-design'
ON CONFLICT (team_id, page_path) DO NOTHING;

-- Technical team -> Projects page
INSERT INTO team_page_access (team_id, page_path, can_access)
SELECT id, '/admin/projects', true FROM admin_teams WHERE slug = 'technical'
ON CONFLICT (team_id, page_path) DO NOTHING;

-- Content team -> Blog page
INSERT INTO team_page_access (team_id, page_path, can_access)
SELECT id, '/admin/blog', true FROM admin_teams WHERE slug = 'content-blog'
ON CONFLICT (team_id, page_path) DO NOTHING;

-- Community team -> Members, Newsletter pages
INSERT INTO team_page_access (team_id, page_path, can_access)
SELECT id, '/admin/members', true FROM admin_teams WHERE slug = 'community'
ON CONFLICT (team_id, page_path) DO NOTHING;

INSERT INTO team_page_access (team_id, page_path, can_access)
SELECT id, '/admin/newsletter', true FROM admin_teams WHERE slug = 'community'
ON CONFLICT (team_id, page_path) DO NOTHING;

INSERT INTO team_page_access (team_id, page_path, can_access)
SELECT id, '/admin/communications', true FROM admin_teams WHERE slug = 'community'
ON CONFLICT (team_id, page_path) DO NOTHING;
