-- Create comprehensive communications system tables

-- Announcements table
CREATE TABLE IF NOT EXISTS announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    author_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    is_pinned BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    target_audience JSONB DEFAULT '{"type": "all"}', -- all, admins, team_members, specific_users
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Announcement reads tracking
CREATE TABLE IF NOT EXISTS announcement_reads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(announcement_id, user_id)
);

-- Tasks table
CREATE TABLE IF NOT EXISTS communication_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    assigned_by_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    due_date DATE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed', 'overdue')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    tags JSONB DEFAULT '[]',
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Internal messages table
CREATE TABLE IF NOT EXISTS internal_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    from_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    reply_to_id UUID REFERENCES internal_messages(id) ON DELETE SET NULL,
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- Task comments/updates
CREATE TABLE IF NOT EXISTS task_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES communication_tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    comment_type VARCHAR(20) DEFAULT 'comment' CHECK (comment_type IN ('comment', 'status_change', 'assignment_change')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_announcements_author_id ON announcements(author_id);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_priority ON announcements(priority);
CREATE INDEX IF NOT EXISTS idx_announcements_pinned ON announcements(is_pinned);

CREATE INDEX IF NOT EXISTS idx_announcement_reads_announcement_id ON announcement_reads(announcement_id);
CREATE INDEX IF NOT EXISTS idx_announcement_reads_user_id ON announcement_reads(user_id);

CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON communication_tasks(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_by ON communication_tasks(assigned_by_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON communication_tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON communication_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON communication_tasks(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_from_user ON internal_messages(from_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_to_user ON internal_messages(to_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON internal_messages(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON internal_messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_user_id ON task_comments(user_id);

-- Enable RLS
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for announcements
CREATE POLICY "Admins can view all announcements" ON announcements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.is_active = true
        )
    );

CREATE POLICY "Admins can create announcements" ON announcements
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.is_active = true
        )
    );

CREATE POLICY "Authors can update their announcements" ON announcements
    FOR UPDATE USING (
        author_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.role = 'super_admin'
            AND admin_users.is_active = true
        )
    );

CREATE POLICY "Authors and super admins can delete announcements" ON announcements
    FOR DELETE USING (
        author_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.role = 'super_admin'
            AND admin_users.is_active = true
        )
    );

-- RLS Policies for announcement reads
CREATE POLICY "Users can manage their own reads" ON announcement_reads
    FOR ALL USING (user_id = auth.uid());

-- RLS Policies for tasks
CREATE POLICY "Admins can view all tasks" ON communication_tasks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.is_active = true
        )
    );

CREATE POLICY "Admins can create tasks" ON communication_tasks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.is_active = true
        )
    );

CREATE POLICY "Task creators and assignees can update tasks" ON communication_tasks
    FOR UPDATE USING (
        assigned_by_id = auth.uid() OR 
        assigned_to_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.role = 'super_admin'
            AND admin_users.is_active = true
        )
    );

CREATE POLICY "Task creators and super admins can delete tasks" ON communication_tasks
    FOR DELETE USING (
        assigned_by_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.role = 'super_admin'
            AND admin_users.is_active = true
        )
    );

-- RLS Policies for messages
CREATE POLICY "Users can view their messages" ON internal_messages
    FOR SELECT USING (
        from_user_id = auth.uid() OR 
        to_user_id = auth.uid()
    );

CREATE POLICY "Users can send messages" ON internal_messages
    FOR INSERT WITH CHECK (from_user_id = auth.uid());

CREATE POLICY "Recipients can update message read status" ON internal_messages
    FOR UPDATE USING (to_user_id = auth.uid());

CREATE POLICY "Senders can delete their messages" ON internal_messages
    FOR DELETE USING (from_user_id = auth.uid());

-- RLS Policies for task comments
CREATE POLICY "Admins can view task comments" ON task_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.is_active = true
        )
    );

CREATE POLICY "Admins can create task comments" ON task_comments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.is_active = true
        )
    );

-- Functions to automatically update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_announcements_updated_at 
    BEFORE UPDATE ON announcements 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at 
    BEFORE UPDATE ON communication_tasks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically mark overdue tasks
CREATE OR REPLACE FUNCTION mark_overdue_tasks()
RETURNS void AS $$
BEGIN
    UPDATE communication_tasks 
    SET status = 'overdue' 
    WHERE due_date < CURRENT_DATE 
    AND status IN ('pending', 'in-progress');
END;
$$ LANGUAGE plpgsql;

-- Add sample data if admin users exist
DO $$
DECLARE
    admin_user_id UUID;
    second_admin_id UUID;
    announcement_id UUID;
    task_id UUID;
BEGIN
    -- Get admin users
    SELECT id INTO admin_user_id FROM admin_users WHERE role = 'super_admin' LIMIT 1;
    SELECT id INTO second_admin_id FROM admin_users WHERE id != admin_user_id LIMIT 1;
    
    IF admin_user_id IS NOT NULL THEN
        -- Add sample announcement
        INSERT INTO announcements (title, message, author_id, priority, is_pinned)
        VALUES (
            'Welcome to the Communications Hub',
            'This is your central hub for team communications, task management, and internal messaging. Use this space to coordinate activities and stay connected with your team.',
            admin_user_id,
            'high',
            true
        ) RETURNING id INTO announcement_id;
        
        -- Add sample task
        INSERT INTO communication_tasks (title, description, assigned_to_id, assigned_by_id, due_date, priority)
        VALUES (
            'Set up team communication guidelines',
            'Create guidelines for using the communications hub effectively, including best practices for announcements, task management, and messaging.',
            COALESCE(second_admin_id, admin_user_id),
            admin_user_id,
            CURRENT_DATE + INTERVAL '7 days',
            'medium'
        ) RETURNING id INTO task_id;
        
        -- Add sample message if we have two admins
        IF second_admin_id IS NOT NULL THEN
            INSERT INTO internal_messages (from_user_id, to_user_id, subject, message)
            VALUES (
                admin_user_id,
                second_admin_id,
                'Communications Hub Setup Complete',
                'The communications hub is now ready for use. Please review the sample announcement and task to get familiar with the system.'
            );
        END IF;
        
        -- Mark announcement as read by author
        INSERT INTO announcement_reads (announcement_id, user_id)
        VALUES (announcement_id, admin_user_id);
        
        -- Add sample task comment
        INSERT INTO task_comments (task_id, user_id, comment, comment_type)
        VALUES (
            task_id,
            admin_user_id,
            'Task created and assigned. Please review the requirements and let me know if you have any questions.',
            'comment'
        );
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON TABLE announcements IS 'Team announcements and important communications';
COMMENT ON TABLE announcement_reads IS 'Tracks which users have read which announcements';
COMMENT ON TABLE communication_tasks IS 'Task management for team coordination';
COMMENT ON TABLE internal_messages IS 'Internal messaging between team members';
COMMENT ON TABLE task_comments IS 'Comments and updates on tasks';