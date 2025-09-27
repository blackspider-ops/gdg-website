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
  // Blog Submission Management
  | 'update_blog_submission' | 'delete_blog_submission' | 'download_blog_submission'
  // Settings Management
  | 'update_site_settings' | 'update_page_content' | 'update_footer_content' | 'update_navigation'
  | 'update_social_links' | 'update_admin_secret_code'
  // Security Actions
  | 'change_password' | 'update_security_settings' | 'view_audit_log' | 'export_audit_log'
  // System Actions
  | 'backup_database' | 'restore_database' | 'clear_cache' | 'update_system_settings'
  // Navigation & Page Access
  | 'view_admin_dashboard' | 'view_admin_page' | 'change_admin_tab' | 'access_admin_section'
  | 'view_admin_users' | 'view_admin_events' | 'view_admin_team' | 'view_admin_members'
  | 'view_admin_resources' | 'view_admin_newsletter' | 'view_admin_blog' | 'view_admin_profile'
  | 'view_admin_sponsors' | 'view_admin_communications' | 'view_admin_media' | 'view_admin_guide'
  | 'view_admin_linktree' | 'view_admin_content' | 'view_admin_security';

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
  // Deduplication cache to prevent duplicate logs for the same user/action within a time window
  private static recentActions = new Map<string, number>();
  private static readonly DEDUP_WINDOW = 5000; // 5 seconds

  /**
   * Log an admin action with comprehensive details and deduplication
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
      // Create deduplication key
      const dedupKey = `${adminId}-${action}-${targetEmail || targetId || 'no-target'}`;
      const now = Date.now();
      
      // Check if this action was recently logged by the same user
      const lastLogged = this.recentActions.get(dedupKey);
      if (lastLogged && (now - lastLogged) < this.DEDUP_WINDOW) {
        return true; // Skip duplicate, but return success
      }

      // Skip IP address from client-side since we can't get real IP reliably
      // IP address should be set server-side if needed
      
      if (!userAgent && typeof navigator !== 'undefined') {
        userAgent = navigator.userAgent;
      }

      // Enhanced details with context
      const enhancedDetails = {
        ...details,
        timestamp: new Date().toISOString(),
        session_id: this.getSessionId(),
        page_url: typeof window !== 'undefined' ? window.location.href : undefined,
        referrer: typeof document !== 'undefined' ? document.referrer : undefined,
        screen_resolution: typeof screen !== 'undefined' ? `${screen.width}x${screen.height}` : undefined,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: typeof navigator !== 'undefined' ? navigator.language : undefined
      };

      // Use only the basic columns that definitely exist in the database
      const auditData = {
        admin_id: adminId,
        action,
        target_email: targetEmail,
        details: enhancedDetails,
        created_at: new Date().toISOString()
      };

      // Only add optional columns if they have values and are valid
      if (targetId) {
        (auditData as any).target_id = targetId;
      }
      if (targetType) {
        (auditData as any).target_type = targetType;
      }
      // Skip IP address from client-side to avoid database type errors
      if (ipAddress && ipAddress !== 'client-side' && /^(\d{1,3}\.){3}\d{1,3}$/.test(ipAddress)) {
        (auditData as any).ip_address = ipAddress;
      }
      if (userAgent && userAgent.length < 500) { // Limit user agent length
        (auditData as any).user_agent = userAgent.substring(0, 500);
      }

      const { error } = await supabase
        .from('admin_actions')
        .insert(auditData);

      if (error) {
        // Log error to console in development but don't break the app
        if (process.env.NODE_ENV === 'development') {
          console.warn('Audit logging failed:', error.message);
        }
        return false;
      }

      // Update deduplication cache
      this.recentActions.set(dedupKey, now);
      
      // Clean up old entries from cache
      this.cleanupDeduplicationCache();

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get or create a session ID for tracking user sessions
   */
  private static getSessionId(): string {
    if (typeof window === 'undefined') return 'server-side';
    
    let sessionId = sessionStorage.getItem('gdg-admin-session-id');
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('gdg-admin-session-id', sessionId);
    }
    return sessionId;
  }

  /**
   * Clean up old entries from deduplication cache
   */
  private static cleanupDeduplicationCache(): void {
    const now = Date.now();
    const cutoff = now - this.DEDUP_WINDOW * 2; // Keep entries for 2x the dedup window
    
    for (const [key, timestamp] of this.recentActions.entries()) {
      if (timestamp < cutoff) {
        this.recentActions.delete(key);
      }
    }
  }

  /**
   * Log multiple actions in batch (useful for bulk operations)
   */
  static async logBatchActions(
    adminId: string,
    actions: Array<{
      action: AuditActionType;
      targetEmail?: string;
      details?: any;
      targetId?: string;
      targetType?: string;
    }>
  ): Promise<boolean> {
    try {
      const timestamp = new Date().toISOString();
      const sessionId = this.getSessionId();
      // Skip IP address for batch operations to avoid database errors
      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent?.substring(0, 500) : undefined;

      const auditEntries = actions.map(actionData => {
        const baseEntry = {
          admin_id: adminId,
          action: actionData.action,
          target_email: actionData.targetEmail,
          details: {
            ...actionData.details,
            timestamp,
            session_id: sessionId,
            batch_operation: true,
            batch_size: actions.length
          },
          created_at: timestamp
        };

        // Only add optional columns if they have values and are valid
        if (actionData.targetId) {
          (baseEntry as any).target_id = actionData.targetId;
        }
        if (actionData.targetType) {
          (baseEntry as any).target_type = actionData.targetType;
        }
        // Skip IP address for batch operations
        if (userAgent) {
          (baseEntry as any).user_agent = userAgent;
        }

        return baseEntry;
      });

      const { error } = await supabase
        .from('admin_actions')
        .insert(auditEntries);

      if (error && process.env.NODE_ENV === 'development') {
        console.warn('Batch audit logging failed:', error.message);
      }

      return !error;
    } catch (error) {
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
      // Build the select query with only the columns that definitely exist
      const selectColumns = [
        'id',
        'admin_id', 
        'action',
        'target_email',
        'details',
        'created_at'
      ];

      // Add optional columns if they exist (from newer migrations)
      const optionalColumns = ['target_id', 'target_type', 'ip_address', 'user_agent'];
      
      let query = supabase
        .from('admin_actions')
        .select(selectColumns.join(','))
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
      
      if (filters?.search && filters.search.trim()) {
        // Enhanced search in multiple fields
        const searchTerm = filters.search.trim();
        query = query.or(`target_email.ilike.%${searchTerm}%,action.ilike.%${searchTerm}%,details->>description.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) {
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Get unique admin IDs to batch fetch admin info
      const adminIds = [...new Set(data.map(entry => entry.admin_id))];
      const adminMap: Record<string, { email: string; role: string }> = {};

      // Batch fetch admin info
      if (adminIds.length > 0) {
        const { data: adminData } = await supabase
          .from('admin_users')
          .select('id, email, role')
          .in('id', adminIds);

        if (adminData) {
          adminData.forEach(admin => {
            adminMap[admin.id] = { email: admin.email, role: admin.role };
          });
        }
      }

      // Enrich data with admin info
      const enrichedData = data.map(entry => ({
        ...entry,
        admin_users: adminMap[entry.admin_id] || { email: 'Unknown', role: 'unknown' }
      }));

      return enrichedData;
    } catch (error) {
      return [];
    }
  }

  /**
   * Get all admins who have performed actions (for filter dropdown)
   */
  static async getActiveAdmins(): Promise<Array<{id: string, email: string}>> {
    try {
      // Get unique admin IDs from audit log
      const { data: auditData } = await supabase
        .from('admin_actions')
        .select('admin_id')
        .limit(5000);

      if (!auditData) return [];

      const uniqueAdminIds = [...new Set(auditData.map(entry => entry.admin_id))];
      
      if (uniqueAdminIds.length === 0) return [];

      // Get admin details
      const { data: adminData } = await supabase
        .from('admin_users')
        .select('id, email')
        .in('id', uniqueAdminIds)
        .order('email');

      return adminData || [];
    } catch (error) {
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

      // Use simpler queries to avoid potential issues
      const [totalResult, todayResult, weekResult, monthResult] = await Promise.all([
        // Total actions
        supabase.from('admin_actions').select('*', { count: 'exact', head: true }),
        // Today's actions
        supabase.from('admin_actions').select('*', { count: 'exact', head: true }).gte('created_at', today),
        // Week's actions
        supabase.from('admin_actions').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
        // Month's actions
        supabase.from('admin_actions').select('*', { count: 'exact', head: true }).gte('created_at', monthAgo)
      ]);

      // Get recent actions for top actions and admins analysis
      const { data: recentActions } = await supabase
        .from('admin_actions')
        .select('action, admin_id')
        .gte('created_at', monthAgo)
        .limit(1000);

      // Calculate top actions
      const actionCounts = recentActions?.reduce((acc, item) => {
        acc[item.action] = (acc[item.action] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const topActions = Object.entries(actionCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([action, count]) => ({ action, count }));

      // Calculate top admins
      const adminCounts = recentActions?.reduce((acc, item) => {
        acc[item.admin_id] = (acc[item.admin_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Get admin emails for top admins
      const topAdminIds = Object.entries(adminCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([adminId]) => adminId);

      const topAdmins: { admin: string; count: number }[] = [];
      
      for (const adminId of topAdminIds) {
        try {
          const { data: adminData } = await supabase
            .from('admin_users')
            .select('email')
            .eq('id', adminId)
            .single();
          
          topAdmins.push({
            admin: adminData?.email || 'Unknown',
            count: adminCounts[adminId]
          });
        } catch (error) {
          topAdmins.push({
            admin: 'Unknown',
            count: adminCounts[adminId]
          });
        }
      }

      return {
        totalActions: totalResult.count || 0,
        todayActions: todayResult.count || 0,
        weekActions: weekResult.count || 0,
        monthActions: monthResult.count || 0,
        topActions,
        topAdmins
      };
    } catch (error) {
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
      'Blog Submissions': [
        'update_blog_submission', 'delete_blog_submission', 'download_blog_submission'
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
      ],
      'Navigation & Access': [
        'view_admin_dashboard', 'view_admin_page', 'change_admin_tab', 'access_admin_section',
        'view_admin_users', 'view_admin_events', 'view_admin_team', 'view_admin_members',
        'view_admin_resources', 'view_admin_newsletter', 'view_admin_blog', 'view_admin_profile',
        'view_admin_sponsors', 'view_admin_communications', 'view_admin_media', 'view_admin_guide',
        'view_admin_linktree', 'view_admin_content', 'view_admin_security'
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
      
      // Blog Submission Management
      'update_blog_submission': 'Updated blog submission status',
      'delete_blog_submission': 'Deleted blog submission',
      'download_blog_submission': 'Downloaded blog submission file',
      
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
      'update_system_settings': 'Updated system settings',
      
      // Navigation & Page Access
      'view_admin_dashboard': 'Accessed admin dashboard',
      'view_admin_page': 'Viewed admin page',
      'change_admin_tab': 'Changed admin tab',
      'access_admin_section': 'Accessed admin section',
      'view_admin_users': 'Viewed admin users management',
      'view_admin_events': 'Viewed events management',
      'view_admin_team': 'Viewed team management',
      'view_admin_members': 'Viewed members management',
      'view_admin_resources': 'Viewed resources management',
      'view_admin_newsletter': 'Viewed newsletter management',
      'view_admin_blog': 'Viewed blog management',
      'view_admin_profile': 'Viewed admin profile',
      'view_admin_sponsors': 'Viewed sponsors management',
      'view_admin_communications': 'Viewed communications hub',
      'view_admin_media': 'Viewed media library',
      'view_admin_guide': 'Viewed admin guide',
      'view_admin_linktree': 'Viewed linktree management',
      'view_admin_content': 'Viewed content management',
      'view_admin_security': 'Viewed security management'
    };

    let description = descriptions[action] || action.replace('_', ' ');
    
    // Add details if available
    if (details?.description) {
      description += `: ${details.description}`;
    }
    
    return description;
  }
}