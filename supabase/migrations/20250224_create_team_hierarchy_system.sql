-- Team Hierarchy System Migration
-- Creates tables for team-based role hierarchy: Super Admin > Admin > Team Member

-- ============================================
-- 1. ADMIN TEAMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS admin_teams (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    slug TEXT UNIQUE NOT NULL,
    team_lead_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    color TEXT DEFAULT '#4285F4', -- Team color for UI
    icon TEXT DEFAULT 'users', -- Lucide icon name
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. TEAM MEMBERSHIPS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS team_memberships (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    team_id UUID NOT NULL REFERENCES admin_teams(id) ON DELETE CASCADE,
    admin_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('lead', 'co_lead', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    added_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, admin_user_id)
);

-- ============================================
-- 3. TEAM PERMISSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS team_permissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    team_id UUID NOT NULL REFERENCES admin_teams(id) ON DELETE CASCADE,
    permission TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    can_create BOOLEAN DEFAULT FALSE,
    can_read BOOLEAN DEFAULT TRUE,
    can_update BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, permission, resource_type)
);

-- ============================================
-- 4. TEAM ANNOUNCEMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS team_announcements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    team_id UUID REFERENCES admin_teams(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    author_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    is_pinned BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE,
    read_by UUID[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. FINANCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS finances (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('income', 'expense', 'transfer', 'reimbursement')),
    category TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    description TEXT NOT NULL,
    vendor_name TEXT,
    reference_number TEXT,
    transaction_date DATE NOT NULL,
    team_id UUID REFERENCES admin_teams(id) ON DELETE SET NULL,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled')),
    approved_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_by UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    notes TEXT,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_frequency TEXT CHECK (recurring_frequency IN ('weekly', 'monthly', 'quarterly', 'yearly')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 6. FINANCE ATTACHMENTS TABLE (for bills/receipts)
-- ============================================
CREATE TABLE IF NOT EXISTS finance_attachments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    finance_id UUID NOT NULL REFERENCES finances(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    uploaded_by UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 7. BUDGET ALLOCATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS budget_allocations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    total_amount DECIMAL(12, 2) NOT NULL,
    spent_amount DECIMAL(12, 2) DEFAULT 0,
    team_id UUID REFERENCES admin_teams(id) ON DELETE SET NULL,
    fiscal_year TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'closed', 'exceeded')),
    created_by UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ============================================
-- 8. UPDATE ADMIN_USERS TABLE
-- ============================================
-- Add new role type for team members
ALTER TABLE admin_users 
DROP CONSTRAINT IF EXISTS admin_users_role_check;

ALTER TABLE admin_users 
ADD CONSTRAINT admin_users_role_check 
CHECK (role IN ('super_admin', 'admin', 'team_member', 'blog_editor'));

-- Add column to track who created the admin user
ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL;

-- Add column for display name
ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- ============================================
-- 9. INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_admin_teams_slug ON admin_teams(slug);
CREATE INDEX IF NOT EXISTS idx_admin_teams_team_lead ON admin_teams(team_lead_id);
CREATE INDEX IF NOT EXISTS idx_admin_teams_active ON admin_teams(is_active);

CREATE INDEX IF NOT EXISTS idx_team_memberships_team ON team_memberships(team_id);
CREATE INDEX IF NOT EXISTS idx_team_memberships_user ON team_memberships(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_team_memberships_active ON team_memberships(is_active);

CREATE INDEX IF NOT EXISTS idx_team_permissions_team ON team_permissions(team_id);
CREATE INDEX IF NOT EXISTS idx_team_permissions_resource ON team_permissions(resource_type);

CREATE INDEX IF NOT EXISTS idx_team_announcements_team ON team_announcements(team_id);
CREATE INDEX IF NOT EXISTS idx_team_announcements_author ON team_announcements(author_id);
CREATE INDEX IF NOT EXISTS idx_team_announcements_active ON team_announcements(is_active);

CREATE INDEX IF NOT EXISTS idx_finances_team ON finances(team_id);
CREATE INDEX IF NOT EXISTS idx_finances_type ON finances(transaction_type);
CREATE INDEX IF NOT EXISTS idx_finances_status ON finances(status);
CREATE INDEX IF NOT EXISTS idx_finances_date ON finances(transaction_date);
CREATE INDEX IF NOT EXISTS idx_finances_created_by ON finances(created_by);

CREATE INDEX IF NOT EXISTS idx_finance_attachments_finance ON finance_attachments(finance_id);

CREATE INDEX IF NOT EXISTS idx_budget_allocations_team ON budget_allocations(team_id);
CREATE INDEX IF NOT EXISTS idx_budget_allocations_year ON budget_allocations(fiscal_year);

-- ============================================
-- 10. RLS POLICIES
-- ============================================
ALTER TABLE admin_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE finances ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_allocations ENABLE ROW LEVEL SECURITY;

-- Admin teams policies
DROP POLICY IF EXISTS "Allow all operations on admin_teams" ON admin_teams;
CREATE POLICY "Allow all operations on admin_teams" ON admin_teams FOR ALL USING (true);

-- Team memberships policies
DROP POLICY IF EXISTS "Allow all operations on team_memberships" ON team_memberships;
CREATE POLICY "Allow all operations on team_memberships" ON team_memberships FOR ALL USING (true);

-- Team permissions policies
DROP POLICY IF EXISTS "Allow all operations on team_permissions" ON team_permissions;
CREATE POLICY "Allow all operations on team_permissions" ON team_permissions FOR ALL USING (true);

-- Team announcements policies
DROP POLICY IF EXISTS "Allow all operations on team_announcements" ON team_announcements;
CREATE POLICY "Allow all operations on team_announcements" ON team_announcements FOR ALL USING (true);

-- Finances policies
DROP POLICY IF EXISTS "Allow all operations on finances" ON finances;
CREATE POLICY "Allow all operations on finances" ON finances FOR ALL USING (true);

-- Finance attachments policies
DROP POLICY IF EXISTS "Allow all operations on finance_attachments" ON finance_attachments;
CREATE POLICY "Allow all operations on finance_attachments" ON finance_attachments FOR ALL USING (true);

-- Budget allocations policies
DROP POLICY IF EXISTS "Allow all operations on budget_allocations" ON budget_allocations;
CREATE POLICY "Allow all operations on budget_allocations" ON budget_allocations FOR ALL USING (true);

-- ============================================
-- 11. TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_admin_teams_updated_at ON admin_teams;
CREATE TRIGGER update_admin_teams_updated_at
    BEFORE UPDATE ON admin_teams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_team_memberships_updated_at ON team_memberships;
CREATE TRIGGER update_team_memberships_updated_at
    BEFORE UPDATE ON team_memberships
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_team_permissions_updated_at ON team_permissions;
CREATE TRIGGER update_team_permissions_updated_at
    BEFORE UPDATE ON team_permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_team_announcements_updated_at ON team_announcements;
CREATE TRIGGER update_team_announcements_updated_at
    BEFORE UPDATE ON team_announcements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_finances_updated_at ON finances;
CREATE TRIGGER update_finances_updated_at
    BEFORE UPDATE ON finances
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_budget_allocations_updated_at ON budget_allocations;
CREATE TRIGGER update_budget_allocations_updated_at
    BEFORE UPDATE ON budget_allocations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 12. DEFAULT TEAMS SEED DATA
-- ============================================
-- Insert default teams (will be skipped if already exist)
INSERT INTO admin_teams (name, slug, description, color, icon) VALUES
    ('Events', 'events', 'Manages all chapter events, workshops, and meetups', '#EA4335', 'calendar'),
    ('Sponsorship & Outreach', 'sponsorship-outreach', 'Handles sponsor relations and external partnerships', '#FBBC04', 'handshake'),
    ('Marketing & Design', 'marketing-design', 'Creates promotional content and manages social media', '#34A853', 'palette'),
    ('Technical', 'technical', 'Manages technical projects and workshops', '#4285F4', 'code'),
    ('Content & Blog', 'content-blog', 'Creates and manages blog posts and documentation', '#9C27B0', 'pen-tool'),
    ('Community', 'community', 'Manages member engagement and community building', '#FF5722', 'users')
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 13. DEFAULT PERMISSIONS FOR TEAMS
-- ============================================
-- Events team permissions
INSERT INTO team_permissions (team_id, permission, resource_type, can_create, can_read, can_update, can_delete)
SELECT id, 'manage_events', 'events', true, true, true, true FROM admin_teams WHERE slug = 'events'
ON CONFLICT (team_id, permission, resource_type) DO NOTHING;

INSERT INTO team_permissions (team_id, permission, resource_type, can_create, can_read, can_update, can_delete)
SELECT id, 'view_registrations', 'event_registrations', false, true, false, false FROM admin_teams WHERE slug = 'events'
ON CONFLICT (team_id, permission, resource_type) DO NOTHING;

-- Sponsorship team permissions
INSERT INTO team_permissions (team_id, permission, resource_type, can_create, can_read, can_update, can_delete)
SELECT id, 'manage_sponsors', 'sponsors', true, true, true, true FROM admin_teams WHERE slug = 'sponsorship-outreach'
ON CONFLICT (team_id, permission, resource_type) DO NOTHING;

INSERT INTO team_permissions (team_id, permission, resource_type, can_create, can_read, can_update, can_delete)
SELECT id, 'manage_outreach', 'outreach', true, true, true, true FROM admin_teams WHERE slug = 'sponsorship-outreach'
ON CONFLICT (team_id, permission, resource_type) DO NOTHING;

-- Marketing team permissions
INSERT INTO team_permissions (team_id, permission, resource_type, can_create, can_read, can_update, can_delete)
SELECT id, 'manage_media', 'media', true, true, true, true FROM admin_teams WHERE slug = 'marketing-design'
ON CONFLICT (team_id, permission, resource_type) DO NOTHING;

INSERT INTO team_permissions (team_id, permission, resource_type, can_create, can_read, can_update, can_delete)
SELECT id, 'manage_content', 'site_content', true, true, true, false FROM admin_teams WHERE slug = 'marketing-design'
ON CONFLICT (team_id, permission, resource_type) DO NOTHING;

-- Technical team permissions
INSERT INTO team_permissions (team_id, permission, resource_type, can_create, can_read, can_update, can_delete)
SELECT id, 'manage_projects', 'projects', true, true, true, true FROM admin_teams WHERE slug = 'technical'
ON CONFLICT (team_id, permission, resource_type) DO NOTHING;

-- Content team permissions
INSERT INTO team_permissions (team_id, permission, resource_type, can_create, can_read, can_update, can_delete)
SELECT id, 'manage_blog', 'blog', true, true, true, true FROM admin_teams WHERE slug = 'content-blog'
ON CONFLICT (team_id, permission, resource_type) DO NOTHING;

-- Community team permissions
INSERT INTO team_permissions (team_id, permission, resource_type, can_create, can_read, can_update, can_delete)
SELECT id, 'manage_members', 'members', true, true, true, false FROM admin_teams WHERE slug = 'community'
ON CONFLICT (team_id, permission, resource_type) DO NOTHING;

INSERT INTO team_permissions (team_id, permission, resource_type, can_create, can_read, can_update, can_delete)
SELECT id, 'manage_newsletter', 'newsletter', true, true, true, false FROM admin_teams WHERE slug = 'community'
ON CONFLICT (team_id, permission, resource_type) DO NOTHING;
