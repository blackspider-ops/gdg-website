import { TeamManagementService } from './teamManagementService';
import { supabase } from '@/lib/supabase';
import type { AdminUser } from '@/lib/supabase';

// Permission resource types
export type ResourceType = 
  | 'events'
  | 'projects'
  | 'blog'
  | 'members'
  | 'team_members'
  | 'sponsors'
  | 'newsletter'
  | 'media'
  | 'site_content'
  | 'communications'
  | 'finances'
  | 'admin_users'
  | 'admin_teams'
  | 'outreach';

// Permission actions
export type PermissionAction = 'create' | 'read' | 'update' | 'delete';

// Admin page access mapping
export const PAGE_PERMISSIONS: Record<string, { resource: ResourceType; action: PermissionAction }[]> = {
  '/admin': [], // Dashboard - accessible to all authenticated admins
  '/admin/events': [{ resource: 'events', action: 'read' }],
  '/admin/projects': [{ resource: 'projects', action: 'read' }],
  '/admin/blog': [{ resource: 'blog', action: 'read' }],
  '/admin/members': [{ resource: 'members', action: 'read' }],
  '/admin/team': [{ resource: 'team_members', action: 'read' }],
  '/admin/sponsors': [{ resource: 'sponsors', action: 'read' }],
  '/admin/newsletter': [{ resource: 'newsletter', action: 'read' }],
  '/admin/media': [{ resource: 'media', action: 'read' }],
  '/admin/content': [{ resource: 'site_content', action: 'read' }],
  '/admin/communications': [{ resource: 'communications', action: 'read' }],
  '/admin/finances': [{ resource: 'finances', action: 'read' }],
  '/admin/users': [{ resource: 'admin_users', action: 'read' }],
  '/admin/teams': [{ resource: 'admin_teams', action: 'read' }],
  '/admin/linktree': [{ resource: 'site_content', action: 'read' }],
  '/admin/resources': [{ resource: 'site_content', action: 'read' }],
  '/admin/site-status': [{ resource: 'site_content', action: 'update' }],
  '/admin/profile': [], // Profile - accessible to all authenticated admins
  '/admin/guide': [], // Guide - accessible to all authenticated admins
};

// Team-based page access (which teams can access which pages)
export const TEAM_PAGE_ACCESS: Record<string, string[]> = {
  'events': ['/admin/events'],
  'sponsorship-outreach': ['/admin/sponsors', '/admin/newsletter'],
  'marketing-design': ['/admin/media', '/admin/content'],
  'technical': ['/admin/projects'],
  'content-blog': ['/admin/blog'],
  'community': ['/admin/members', '/admin/newsletter', '/admin/communications']
};

export class PermissionsService {
  /**
   * Check if a user has a specific permission
   */
  static async hasPermission(
    user: AdminUser | null,
    resource: ResourceType,
    action: PermissionAction
  ): Promise<boolean> {
    if (!user) return false;

    // Super admins have all permissions
    if (user.role === 'super_admin') return true;

    // Regular admins have most permissions except admin_users management
    if (user.role === 'admin') {
      if (resource === 'admin_users') {
        return action === 'read'; // Admins can only view other admins
      }
      return true;
    }

    // Blog editors only have blog permissions
    if (user.role === 'blog_editor') {
      return resource === 'blog';
    }

    // Team members - check team-based permissions
    if (user.role === 'team_member') {
      return await TeamManagementService.hasPermission(user.id, resource, action);
    }

    return false;
  }

  /**
   * Check if a user can access a specific admin page
   */
  static async canAccessPage(user: AdminUser | null, path: string): Promise<boolean> {
    if (!user) return false;

    // Super admins can access everything
    if (user.role === 'super_admin') return true;

    // Regular admins can access most pages
    if (user.role === 'admin') {
      // Admins cannot access user management (only super admins)
      if (path === '/admin/users') return false;
      return true;
    }

    // Blog editors can only access blog-related pages
    if (user.role === 'blog_editor') {
      return path === '/admin/blog-editor' || 
             path === '/admin/blog-media' || 
             path === '/admin/profile';
    }

    // Team members - check team-based access
    if (user.role === 'team_member') {
      // Always allow dashboard, profile, guide, teams, finances, communications
      if (['/admin', '/admin/profile', '/admin/guide', '/admin/teams', '/admin/finances', '/admin/communications'].includes(path)) {
        return true;
      }

      // Check database for explicit page access
      const hasDbAccess = await this.checkDatabasePageAccess(user.id, path);
      if (hasDbAccess) return true;

      // Check page permissions from team permissions
      const pagePerms = PAGE_PERMISSIONS[path];
      if (!pagePerms || pagePerms.length === 0) return true;

      // Check if user has any of the required permissions
      for (const perm of pagePerms) {
        const hasAccess = await TeamManagementService.hasPermission(
          user.id, 
          perm.resource, 
          perm.action
        );
        if (hasAccess) return true;
      }

      // Check team-based page access from static mapping
      const userTeams = await TeamManagementService.getUserTeams(user.id);
      for (const membership of userTeams) {
        const teamSlug = membership.team?.slug;
        if (teamSlug && TEAM_PAGE_ACCESS[teamSlug]) {
          if (TEAM_PAGE_ACCESS[teamSlug].includes(path)) {
            return true;
          }
        }
      }

      return false;
    }

    return false;
  }

  /**
   * Get all accessible pages for a user
   */
  static async getAccessiblePages(user: AdminUser | null): Promise<string[]> {
    if (!user) return [];

    const allPages = Object.keys(PAGE_PERMISSIONS);
    const accessiblePages: string[] = [];

    for (const page of allPages) {
      const canAccess = await this.canAccessPage(user, page);
      if (canAccess) {
        accessiblePages.push(page);
      }
    }

    return accessiblePages;
  }

  /**
   * Check if user can manage another user (for hierarchy enforcement)
   * Super Admin > Admin > Team Member > Blog Editor
   */
  static canManageUser(currentUser: AdminUser | null, targetUser: AdminUser): boolean {
    if (!currentUser) return false;

    // Can't manage yourself
    if (currentUser.id === targetUser.id) return false;

    // Super admins can manage everyone
    if (currentUser.role === 'super_admin') return true;

    // Admins can manage team members and blog editors
    if (currentUser.role === 'admin') {
      return targetUser.role === 'team_member' || targetUser.role === 'blog_editor';
    }

    // Team members cannot manage other users directly
    // (they can only manage team memberships for their own teams)
    return false;
  }

  /**
   * Get the roles a user can assign to new users
   */
  static getAssignableRoles(user: AdminUser | null): string[] {
    if (!user) return [];

    if (user.role === 'super_admin') {
      return ['super_admin', 'admin', 'team_member', 'blog_editor'];
    }

    if (user.role === 'admin') {
      return ['team_member', 'blog_editor'];
    }

    // Team leads can only add team_member role users to their teams
    return ['team_member'];
  }

  /**
   * Check if user can create new admin users
   */
  static canCreateAdminUsers(user: AdminUser | null): boolean {
    if (!user) return false;
    return user.role === 'super_admin' || user.role === 'admin';
  }

  /**
   * Check if user can create teams
   */
  static canCreateTeams(user: AdminUser | null): boolean {
    if (!user) return false;
    return user.role === 'super_admin';
  }

  /**
   * Check if user can delete teams
   */
  static canDeleteTeams(user: AdminUser | null): boolean {
    if (!user) return false;
    return user.role === 'super_admin';
  }

  /**
   * Check if user can edit team settings (name, color, etc.)
   */
  static canEditTeamSettings(user: AdminUser | null): boolean {
    if (!user) return false;
    return user.role === 'super_admin';
  }

  /**
   * Check if user is a team lead for any team
   */
  static async isTeamLead(userId: string): Promise<boolean> {
    const userTeams = await TeamManagementService.getUserTeams(userId);
    return userTeams.some(t => t.role === 'lead' || t.role === 'co_lead');
  }

  /**
   * Check if user is a lead of a specific team
   */
  static async isTeamLeadOf(userId: string, teamId: string): Promise<boolean> {
    const role = await TeamManagementService.getUserRoleInTeam(userId, teamId);
    return role === 'lead' || role === 'co_lead';
  }

  /**
   * Get role display name
   */
  static getRoleDisplayName(role: string): string {
    const roleNames: Record<string, string> = {
      'super_admin': 'Super Admin',
      'admin': 'Admin',
      'team_member': 'Team Member',
      'blog_editor': 'Blog Editor',
      'lead': 'Team Lead',
      'co_lead': 'Co-Lead',
      'member': 'Member'
    };
    return roleNames[role] || role;
  }

  /**
   * Get role badge color
   */
  static getRoleBadgeColor(role: string): string {
    const colors: Record<string, string> = {
      'super_admin': 'bg-red-100 text-red-800',
      'admin': 'bg-blue-100 text-blue-800',
      'team_member': 'bg-green-100 text-green-800',
      'blog_editor': 'bg-purple-100 text-purple-800',
      'lead': 'bg-yellow-100 text-yellow-800',
      'co_lead': 'bg-orange-100 text-orange-800',
      'member': 'bg-gray-100 text-gray-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Check page access from database (team_page_access table)
   */
  static async checkDatabasePageAccess(userId: string, path: string): Promise<boolean> {
    try {
      // Get user's teams
      const userTeams = await TeamManagementService.getUserTeams(userId);
      const teamIds = userTeams.map(t => t.team_id);

      if (teamIds.length === 0) return false;

      // Check if any of user's teams have access to this page
      const { data, error } = await supabase
        .from('team_page_access')
        .select('can_access')
        .in('team_id', teamIds)
        .eq('page_path', path)
        .eq('can_access', true);

      if (error) throw error;
      return (data || []).length > 0;
    } catch (error) {
      console.error('Error checking database page access:', error);
      return false;
    }
  }

  /**
   * Get all pages a team has access to
   */
  static async getTeamPageAccess(teamId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('team_page_access')
        .select('page_path')
        .eq('team_id', teamId)
        .eq('can_access', true);

      if (error) throw error;
      return (data || []).map(d => d.page_path);
    } catch (error) {
      console.error('Error fetching team page access:', error);
      return [];
    }
  }

  /**
   * Set page access for a team
   */
  static async setTeamPageAccess(
    teamId: string,
    pagePath: string,
    canAccess: boolean
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('team_page_access')
        .upsert({
          team_id: teamId,
          page_path: pagePath,
          can_access: canAccess
        }, {
          onConflict: 'team_id,page_path'
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error setting team page access:', error);
      return false;
    }
  }

  /**
   * Bulk set page access for a team
   */
  static async bulkSetTeamPageAccess(
    teamId: string,
    pageAccess: Array<{ path: string; canAccess: boolean }>
  ): Promise<boolean> {
    try {
      const records = pageAccess.map(pa => ({
        team_id: teamId,
        page_path: pa.path,
        can_access: pa.canAccess
      }));

      const { error } = await supabase
        .from('team_page_access')
        .upsert(records, {
          onConflict: 'team_id,page_path'
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error bulk setting team page access:', error);
      return false;
    }
  }
}
