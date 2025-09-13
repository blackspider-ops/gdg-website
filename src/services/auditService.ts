import { supabase } from '@/lib/supabase';

export type AuditActionType = 
  // User Management
  | 'login' | 'logout' | 'create_admin' | 'update_admin' | 'delete_admin' | 'reset_password' | 'promote_team_member'
  // Content Management  
  | 'create_event' | 'update_event' | 'delete_event' | 'publish_event' | 'unpublish_event'
  | 'create_team_member' | 'update_team_member' | 'delete_team_member'
  | 'create_sponsor' | 'update_sponsor' | 'delete_sponsor'
  | 'create_project' | 'update_project' | 'delete_project'
  | 'create_member' | 'update_member' | 'delete_member'
  // Newsletter Management
  | 'create_newsletter_campaign' | 'send_newsletter' | 'schedule_newsletter' | 'delete_newsletter'
  | 'export_subscribers' | 'import_subscribers' | 'update_subscriber'
  // Communications Management
  | 'create_announcement' | 'update_announcement' | 'delete_announcement'
  | 'create_task' | 'update_task' | 'delete_task'
  | 'send_message' | 'view_communications'
  // Media Management
  | 'view_media_library' | 'create_media_folder' | 'update_media_folder' | 'delete_media_folder'
  | 'upload_media_file' | 'update_media_file' | 'delete_media_file' | 'bulk_delete_media_files'
  | 'bulk_update_media_tags'
  // Settings Management
  | 'update_site_settings' | 'update_page_content' | 'update_footer_content' | 'update_navigation'
  | 'update_social_links' | 'update_admin_secret_code'
  // Security Actions
  | 'change_password' | 'update_security_settings' | 'view_audit_log' | 'export_audit_log'
  // System Actions
  | 'backup_database' | 'restore_database' | 'clear_cache' | 'update_system_settings';

export interface AuditLogEntry {
  id: string;
  action: AuditActionType;
  admin_id: string;
  admin_users?: {
    email: string;
    role: string;
  };
  target_email?: string;
  target_id?: string;
  target_type?: string;
  details?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface AuditFilters {
  action?: AuditActionType;
  adminId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface AuditStats {
  totalActions: number;
  todayActions: number;
  weekActions: number;
  monthActions: number;
  topActions: { action: string; count: number }[];
  topAdmins: { admin: string; count: number }[];
}

export class AuditService {
  /**
   * Log an admin action with comprehensive details
   */
  static async logAction(
    adminId: string,
    action: AuditActionType,
    targetEmail?: string,
    details?: any,
    targetId?: string,
    targetType?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('admin_actions')
        .insert({
          admin_id: adminId,
          action,
          target_email: targetEmail,
          target_id: targetId,
          target_type: targetType,
          details: details || {},
          ip_address: ipAddress,
          user_agent: userAgent,
          created_at: new Date().toISOString()
        });

      return !error;
    } catch (error) {
      console.error('Error logging admin action:', error);
      return false;
    }
  }

  /**
   * Get audit log entries with filtering and pagination
   */
  static async getAuditLog(
    filters?: AuditFilters,
    limit: number = 100,
    offset: number = 0
  ): Promise<AuditLogEntry[]> {
    try {
      // First, try to get admin actions with join
      let query = supabase
        .from('admin_actions')
        .select(`
          id,
          action,
          admin_id,
          target_email,
          target_id,
          target_type,
          details,
          ip_address,
          user_agent,
          created_at,
          admin_users(email, role)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Apply filters
      if (filters?.action) {
        query = query.eq('action', filters.action);
      }
      
      if (filters?.adminId) {
        query = query.eq('admin_id', filters.adminId);
      }
      
      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      
      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }
      
      if (filters?.search) {
        query = query.or(`
          target_email.ilike.%${filters.search}%,
          details->>description.ilike.%${filters.search}%
        `);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error with join query, trying simple query:', error);
        
        // Fallback to simple query without join
        const { data: simpleData, error: simpleError } = await supabase
          .from('admin_actions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (simpleError) throw simpleError;
        
        // Manually fetch admin info for each entry
        const enrichedData = await Promise.all(
          (simpleData || []).map(async (entry) => {
            const { data: adminData } = await supabase
              .from('admin_users')
              .select('email, role')
              .eq('id', entry.admin_id)
              .single();

            return {
              ...entry,
              admin_users: adminData
            };
          })
        );

        return enrichedData;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching audit log:', error);
      return [];
    }
  }

  /**
   * Get audit statistics
   */
  static async getAuditStats(): Promise<AuditStats> {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const [totalResult, todayResult, weekResult, monthResult, actionsResult, adminsResult] = await Promise.all([
        // Total actions
        supabase.from('admin_actions').select('id', { count: 'exact' }),
        // Today's actions
        supabase.from('admin_actions').select('id', { count: 'exact' }).gte('created_at', today),
        // Week's actions
        supabase.from('admin_actions').select('id', { count: 'exact' }).gte('created_at', weekAgo),
        // Month's actions
        supabase.from('admin_actions').select('id', { count: 'exact' }).gte('created_at', monthAgo),
        // Top actions
        supabase.from('admin_actions').select('action').gte('created_at', monthAgo),
        // Top admins
        supabase.from('admin_actions').select('admin_id, admin_users!inner(email)').gte('created_at', monthAgo)
      ]);

      // Calculate top actions
      const actionCounts = actionsResult.data?.reduce((acc, item) => {
        acc[item.action] = (acc[item.action] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const topActions = Object.entries(actionCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([action, count]) => ({ action, count }));

      // Calculate top admins
      const adminCounts = adminsResult.data?.reduce((acc, item) => {
        const email = item.admin_users?.email || 'Unknown';
        acc[email] = (acc[email] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const topAdmins = Object.entries(adminCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([admin, count]) => ({ admin, count }));

      return {
        totalActions: totalResult.count || 0,
        todayActions: todayResult.count || 0,
        weekActions: weekResult.count || 0,
        monthActions: monthResult.count || 0,
        topActions,
        topAdmins
      };
    } catch (error) {
      console.error('Error fetching audit stats:', error);
      return {
        totalActions: 0,
        todayActions: 0,
        weekActions: 0,
        monthActions: 0,
        topActions: [],
        topAdmins: []
      };
    }
  }

  /**
   * Export audit log to CSV
   */
  static async exportAuditLog(filters?: AuditFilters): Promise<string> {
    try {
      const entries = await this.getAuditLog(filters, 10000); // Get up to 10k entries
      
      const headers = [
        'Timestamp',
        'Admin',
        'Action',
        'Target',
        'Details',
        'IP Address'
      ];

      const csvRows = [
        headers.join(','),
        ...entries.map(entry => [
          new Date(entry.created_at).toLocaleString(),
          entry.admin_users?.email || 'Unknown',
          entry.action.replace('_', ' '),
          entry.target_email || entry.target_id || '-',
          JSON.stringify(entry.details || {}).replace(/"/g, '""'),
          entry.ip_address || '-'
        ].map(field => `"${field}"`).join(','))
      ];

      return csvRows.join('\n');
    } catch (error) {
      console.error('Error exporting audit log:', error);
      return '';
    }
  }

  /**
   * Get action categories for filtering
   */
  static getActionCategories(): Record<string, AuditActionType[]> {
    return {
      'User Management': [
        'login', 'logout', 'create_admin', 'update_admin', 'delete_admin', 
        'reset_password', 'promote_team_member'
      ],
      'Content Management': [
        'create_event', 'update_event', 'delete_event', 'publish_event', 'unpublish_event',
        'create_team_member', 'update_team_member', 'delete_team_member',
        'create_sponsor', 'update_sponsor', 'delete_sponsor',
        'create_project', 'update_project', 'delete_project',
        'create_member', 'update_member', 'delete_member'
      ],
      'Newsletter Management': [
        'create_newsletter_campaign', 'send_newsletter', 'schedule_newsletter', 'delete_newsletter',
        'export_subscribers', 'import_subscribers', 'update_subscriber'
      ],
      'Communications Management': [
        'create_announcement', 'update_announcement', 'delete_announcement',
        'create_task', 'update_task', 'delete_task',
        'send_message', 'view_communications'
      ],
      'Media Management': [
        'view_media_library', 'create_media_folder', 'update_media_folder', 'delete_media_folder',
        'upload_media_file', 'update_media_file', 'delete_media_file', 'bulk_delete_media_files',
        'bulk_update_media_tags'
      ],
      'Settings Management': [
        'update_site_settings', 'update_page_content', 'update_footer_content', 
        'update_navigation', 'update_social_links', 'update_admin_secret_code'
      ],
      'Security Actions': [
        'change_password', 'update_security_settings', 'view_audit_log', 'export_audit_log'
      ],
      'System Actions': [
        'backup_database', 'restore_database', 'clear_cache', 'update_system_settings'
      ]
    };
  }

  /**
   * Add sample audit data for testing (development only)
   */
  static async addSampleAuditData(adminId: string): Promise<boolean> {
    try {
      const sampleActions = [
        {
          action: 'login' as AuditActionType,
          description: 'Logged into admin panel'
        },
        {
          action: 'view_audit_log' as AuditActionType,
          description: 'Viewed comprehensive audit log'
        },
        {
          action: 'update_site_settings' as AuditActionType,
          description: 'Updated site configuration'
        }
      ];

      for (const sample of sampleActions) {
        await this.logAction(
          adminId,
          sample.action,
          undefined,
          { description: sample.description, sample: true }
        );
      }

      return true;
    } catch (error) {
      console.error('Error adding sample audit data:', error);
      return false;
    }
  }

  /**
   * Get human-readable action description
   */
  static getActionDescription(action: AuditActionType, details?: any): string {
    const descriptions: Record<AuditActionType, string> = {
      // User Management
      'login': 'Logged into admin panel',
      'logout': 'Logged out of admin panel',
      'create_admin': 'Created new admin user',
      'update_admin': 'Updated admin user details',
      'delete_admin': 'Deleted admin user',
      'reset_password': 'Reset admin password',
      'promote_team_member': 'Promoted team member to admin',
      
      // Content Management
      'create_event': 'Created new event',
      'update_event': 'Updated event details',
      'delete_event': 'Deleted event',
      'publish_event': 'Published event',
      'unpublish_event': 'Unpublished event',
      'create_team_member': 'Added new team member',
      'update_team_member': 'Updated team member details',
      'delete_team_member': 'Removed team member',
      'create_sponsor': 'Added new sponsor',
      'update_sponsor': 'Updated sponsor details',
      'delete_sponsor': 'Removed sponsor',
      'create_project': 'Created new project',
      'update_project': 'Updated project details',
      'delete_project': 'Deleted project',
      'create_member': 'Added new member',
      'update_member': 'Updated member details',
      'delete_member': 'Removed member',
      
      // Newsletter Management
      'create_newsletter_campaign': 'Created newsletter campaign',
      'send_newsletter': 'Sent newsletter campaign',
      'schedule_newsletter': 'Scheduled newsletter campaign',
      'delete_newsletter': 'Deleted newsletter campaign',
      'export_subscribers': 'Exported subscriber list',
      'import_subscribers': 'Imported subscriber list',
      'update_subscriber': 'Updated subscriber details',
      
      // Communications Management
      'create_announcement': 'Created team announcement',
      'update_announcement': 'Updated team announcement',
      'delete_announcement': 'Deleted team announcement',
      'create_task': 'Created new task',
      'update_task': 'Updated task details',
      'delete_task': 'Deleted task',
      'send_message': 'Sent internal message',
      'view_communications': 'Viewed communications hub',
      
      // Media Management
      'view_media_library': 'Viewed media library',
      'create_media_folder': 'Created media folder',
      'update_media_folder': 'Updated media folder',
      'delete_media_folder': 'Deleted media folder',
      'upload_media_file': 'Uploaded media file',
      'update_media_file': 'Updated media file',
      'delete_media_file': 'Deleted media file',
      'bulk_delete_media_files': 'Bulk deleted media files',
      'bulk_update_media_tags': 'Bulk updated media file tags',
      
      // Settings Management
      'update_site_settings': 'Updated site settings',
      'update_page_content': 'Updated page content',
      'update_footer_content': 'Updated footer content',
      'update_navigation': 'Updated navigation menu',
      'update_social_links': 'Updated social media links',
      'update_admin_secret_code': 'Changed admin secret code',
      
      // Security Actions
      'change_password': 'Changed password',
      'update_security_settings': 'Updated security settings',
      'view_audit_log': 'Viewed audit log',
      'export_audit_log': 'Exported audit log',
      
      // System Actions
      'backup_database': 'Created database backup',
      'restore_database': 'Restored database from backup',
      'clear_cache': 'Cleared system cache',
      'update_system_settings': 'Updated system settings'
    };

    let description = descriptions[action] || action.replace('_', ' ');
    
    // Add details if available
    if (details?.description) {
      description += `: ${details.description}`;
    }
    
    return description;
  }
}