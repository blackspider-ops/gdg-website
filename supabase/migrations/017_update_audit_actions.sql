-- Update admin_actions constraint to include all current action types

DO $$
BEGIN
    -- Drop the existing constraint if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'admin_actions_action_check' 
               AND table_name = 'admin_actions') THEN
        ALTER TABLE admin_actions DROP CONSTRAINT admin_actions_action_check;
    END IF;
    
    -- Add the updated constraint with all action types
    ALTER TABLE admin_actions ADD CONSTRAINT admin_actions_action_check 
    CHECK (action IN (
        -- User Management
        'login', 'logout', 'create_admin', 'update_admin', 'delete_admin', 'reset_password', 'promote_team_member',
        -- Content Management  
        'create_event', 'update_event', 'delete_event', 'publish_event', 'unpublish_event',
        'create_team_member', 'update_team_member', 'delete_team_member',
        'create_sponsor', 'update_sponsor', 'delete_sponsor',
        'create_project', 'update_project', 'delete_project',
        'create_member', 'update_member', 'delete_member',
        -- Newsletter Management
        'create_newsletter_campaign', 'send_newsletter', 'schedule_newsletter', 'delete_newsletter',
        'export_subscribers', 'import_subscribers', 'update_subscriber',
        -- Communications Management
        'create_announcement', 'update_announcement', 'delete_announcement',
        'create_task', 'update_task', 'delete_task', 'send_message', 'view_communications',
        -- Media Management (MISSING FROM PREVIOUS CONSTRAINT)
        'view_media_library', 'create_media_folder', 'update_media_folder', 'delete_media_folder',
        'upload_media_file', 'update_media_file', 'delete_media_file', 'bulk_delete_media_files',
        'bulk_update_media_tags',
        -- Settings Management
        'update_site_settings', 'update_page_content', 'update_footer_content', 'update_navigation',
        'update_social_links', 'update_admin_secret_code',
        -- Security Actions
        'change_password', 'update_security_settings', 'view_audit_log', 'export_audit_log',
        -- System Actions
        'backup_database', 'restore_database', 'clear_cache', 'update_system_settings'
    ));
END $$;

-- Add helpful notice
DO $$
BEGIN
    RAISE NOTICE 'Updated admin_actions constraint to include all current action types';
    RAISE NOTICE 'Added missing media management actions: view_media_library, create_media_folder, etc.';
END $$;