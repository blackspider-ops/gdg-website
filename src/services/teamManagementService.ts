import { supabase } from '@/lib/supabase';
import { NotificationService } from './notificationService';
import { TeamActivityService } from './teamActivityService';
import { ResendService } from './resendService';

// Types
export interface AdminTeam {
  id: string;
  name: string;
  description?: string;
  slug: string;
  team_lead_id?: string;
  color: string;
  icon: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  team_lead?: {
    id: string;
    email: string;
    display_name?: string;
  };
  member_count?: number;
}

export interface TeamMembership {
  id: string;
  team_id: string;
  admin_user_id: string;
  role: 'lead' | 'co_lead' | 'member';
  joined_at: string;
  added_by?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  admin_user?: {
    id: string;
    email: string;
    display_name?: string;
    role: string;
  };
  team?: AdminTeam;
}

export interface TeamPermission {
  id: string;
  team_id: string;
  permission: string;
  resource_type: string;
  can_create: boolean;
  can_read: boolean;
  can_update: boolean;
  can_delete: boolean;
  created_at: string;
  updated_at: string;
}

export interface TeamAnnouncement {
  id: string;
  team_id?: string;
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  author_id: string;
  is_pinned: boolean;
  expires_at?: string;
  scheduled_for?: string;
  is_published: boolean;
  read_by: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  author?: {
    id: string;
    email: string;
    display_name?: string;
  };
  team?: AdminTeam;
}

export class TeamManagementService {
  // ============================================
  // TEAM CRUD OPERATIONS
  // ============================================
  
  static async getTeams(includeInactive = false): Promise<AdminTeam[]> {
    try {
      let query = supabase
        .from('admin_teams')
        .select(`
          *,
          team_lead:admin_users!admin_teams_team_lead_id_fkey(id, email, display_name)
        `)
        .order('name', { ascending: true });

      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Get member counts for each team
      const teamsWithCounts = await Promise.all(
        (data || []).map(async (team) => {
          const { count } = await supabase
            .from('team_memberships')
            .select('*', { count: 'exact', head: true })
            .eq('team_id', team.id)
            .eq('is_active', true);
          
          return { ...team, member_count: count || 0 };
        })
      );

      return teamsWithCounts;
    } catch (error) {
      console.error('Error fetching teams:', error);
      return [];
    }
  }

  static async getTeamById(teamId: string): Promise<AdminTeam | null> {
    try {
      const { data, error } = await supabase
        .from('admin_teams')
        .select(`
          *,
          team_lead:admin_users!admin_teams_team_lead_id_fkey(id, email, display_name)
        `)
        .eq('id', teamId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching team:', error);
      return null;
    }
  }

  static async getTeamBySlug(slug: string): Promise<AdminTeam | null> {
    try {
      const { data, error } = await supabase
        .from('admin_teams')
        .select(`
          *,
          team_lead:admin_users!admin_teams_team_lead_id_fkey(id, email, display_name)
        `)
        .eq('slug', slug)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching team by slug:', error);
      return null;
    }
  }

  static async createTeam(team: Partial<AdminTeam>, createdBy: string): Promise<AdminTeam | null> {
    try {
      const slug = team.slug || team.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      
      const { data, error } = await supabase
        .from('admin_teams')
        .insert({
          name: team.name,
          description: team.description,
          slug,
          team_lead_id: team.team_lead_id,
          color: team.color || '#4285F4',
          icon: team.icon || 'users',
          is_active: true,
          created_by: createdBy
        })
        .select()
        .single();

      if (error) throw error;

      // If team lead is specified, add them as a member with 'lead' role
      if (team.team_lead_id && data) {
        await this.addTeamMember(data.id, team.team_lead_id, 'lead', createdBy);
      }

      return data;
    } catch (error) {
      console.error('Error creating team:', error);
      return null;
    }
  }

  static async updateTeam(teamId: string, updates: Partial<AdminTeam>): Promise<AdminTeam | null> {
    try {
      const { data, error } = await supabase
        .from('admin_teams')
        .update({
          name: updates.name,
          description: updates.description,
          team_lead_id: updates.team_lead_id,
          color: updates.color,
          icon: updates.icon,
          is_active: updates.is_active
        })
        .eq('id', teamId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating team:', error);
      return null;
    }
  }

  static async deleteTeam(teamId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('admin_teams')
        .update({ is_active: false })
        .eq('id', teamId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting team:', error);
      return false;
    }
  }


  // ============================================
  // TEAM MEMBERSHIP OPERATIONS
  // ============================================

  static async getTeamMembers(teamId: string): Promise<TeamMembership[]> {
    try {
      // First get the memberships
      const { data: memberships, error: membershipError } = await supabase
        .from('team_memberships')
        .select('*')
        .eq('team_id', teamId)
        .eq('is_active', true)
        .order('role', { ascending: true });

      if (membershipError) throw membershipError;
      if (!memberships || memberships.length === 0) return [];

      // Then get the admin users for these memberships
      const userIds = memberships.map(m => m.admin_user_id);
      const { data: users, error: usersError } = await supabase
        .from('admin_users')
        .select('id, email, display_name, role')
        .in('id', userIds);

      if (usersError) throw usersError;

      // Combine the data
      const result = memberships.map(membership => ({
        ...membership,
        admin_user: users?.find(u => u.id === membership.admin_user_id) || null
      }));

      return result;
    } catch (error) {
      console.error('Error fetching team members:', error);
      return [];
    }
  }

  /**
   * Check if a user can manage a specific team
   * Super admins can manage all teams
   * Team leads/co-leads can only manage their own team
   */
  static async canManageTeam(userId: string, userRole: string, teamId: string): Promise<boolean> {
    // Super admins can manage any team
    if (userRole === 'super_admin') return true;
    
    // Admins can manage any team
    if (userRole === 'admin') return true;

    // Team members can only manage teams they lead
    const memberRole = await this.getUserRoleInTeam(userId, teamId);
    return memberRole === 'lead' || memberRole === 'co_lead';
  }

  /**
   * Get teams that a user can manage (for team leads, only their teams)
   */
  static async getManageableTeams(userId: string, userRole: string): Promise<AdminTeam[]> {
    // Super admins and admins can manage all teams
    if (userRole === 'super_admin' || userRole === 'admin') {
      return this.getTeams(true);
    }

    // Team members can only manage teams they lead
    const userTeams = await this.getUserTeams(userId);
    const leadTeams = userTeams.filter(t => t.role === 'lead' || t.role === 'co_lead');
    
    return leadTeams
      .map(t => t.team)
      .filter((team): team is AdminTeam => team !== undefined);
  }

  static async getUserTeams(userId: string): Promise<TeamMembership[]> {
    try {
      const { data, error } = await supabase
        .from('team_memberships')
        .select(`
          *,
          team:admin_teams(*)
        `)
        .eq('admin_user_id', userId)
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user teams:', error);
      return [];
    }
  }

  static async addTeamMember(
    teamId: string, 
    userId: string, 
    role: 'lead' | 'co_lead' | 'member' = 'member',
    addedBy: string,
    addedByRole?: string
  ): Promise<TeamMembership | null> {
    try {
      // Check if the person adding has permission to manage this team
      if (addedByRole && addedByRole !== 'super_admin' && addedByRole !== 'admin') {
        const canManage = await this.canManageTeam(addedBy, addedByRole, teamId);
        if (!canManage) {
          console.error('User does not have permission to add members to this team');
          return null;
        }
      }

      const { data, error } = await supabase
        .from('team_memberships')
        .insert({
          team_id: teamId,
          admin_user_id: userId,
          role,
          added_by: addedBy,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      // Send notification to the new member
      if (data) {
        const team = await this.getTeamById(teamId);
        if (team) {
          // Notify the new member
          await NotificationService.notifyUser(
            userId,
            'member_joined',
            `Welcome to ${team.name}!`,
            `You've been added to the ${team.name} team as a ${role.replace('_', ' ')}.`,
            `/admin/team/${teamId}`
          );

          // Notify other team members
          await NotificationService.notifyTeamMembers(
            teamId,
            'member_joined',
            'New Team Member',
            `A new member has joined ${team.name}.`,
            `/admin/teams`,
            userId // Exclude the new member from this notification
          );

          // Log activity
          await TeamActivityService.logActivity(
            teamId,
            addedBy,
            'member_added',
            userId,
            { role }
          );

          // Send email notification to the new member
          try {
            const { data: newMember } = await supabase
              .from('admin_users')
              .select('email, display_name')
              .eq('id', userId)
              .single();
            
            const { data: addedByUser } = await supabase
              .from('admin_users')
              .select('email, display_name')
              .eq('id', addedBy)
              .single();

            if (newMember && addedByUser) {
              await ResendService.sendTeamMemberAddedEmail(
                newMember.email,
                newMember.display_name || newMember.email,
                team.name,
                role,
                addedByUser.display_name || addedByUser.email
              );
            }
          } catch (emailError) {
            console.error('Failed to send member added email:', emailError);
            // Don't fail the operation if email fails
          }
        }
      }

      return data;
    } catch (error) {
      console.error('Error adding team member:', error);
      return null;
    }
  }

  static async updateTeamMemberRole(
    membershipId: string, 
    role: 'lead' | 'co_lead' | 'member',
    updatedBy?: string,
    updatedByRole?: string
  ): Promise<boolean> {
    try {
      // Get the membership to check the team
      const { data: membership } = await supabase
        .from('team_memberships')
        .select('team_id, admin_user_id, role')
        .eq('id', membershipId)
        .single();

      // Only super_admin or team lead can change roles (not co_lead)
      if (updatedBy && updatedByRole) {
        if (updatedByRole === 'super_admin') {
          // Super admin can always change roles
        } else if (membership) {
          // Check if the user is specifically a lead (not co_lead) of this team
          const userRoleInTeam = await this.getUserRoleInTeam(updatedBy, membership.team_id);
          if (userRoleInTeam !== 'lead') {
            console.error('Only team leads and super admins can change member roles');
            return false;
          }
        }
      }

      const { error } = await supabase
        .from('team_memberships')
        .update({ role })
        .eq('id', membershipId);

      if (error) throw error;

      // Log activity
      if (updatedBy && membership) {
        await TeamActivityService.logActivity(
          membership.team_id,
          updatedBy,
          'role_changed',
          membership.admin_user_id,
          { old_role: membership.role, new_role: role }
        );
      }

      return true;
    } catch (error) {
      console.error('Error updating team member role:', error);
      return false;
    }
  }

  static async removeTeamMember(
    membershipId: string,
    removedBy?: string,
    removedByRole?: string
  ): Promise<boolean> {
    try {
      // Get the membership to check the team and user
      const { data: membership } = await supabase
        .from('team_memberships')
        .select('team_id, admin_user_id')
        .eq('id', membershipId)
        .single();

      if (removedBy && removedByRole && removedByRole !== 'super_admin' && removedByRole !== 'admin') {
        if (membership) {
          const canManage = await this.canManageTeam(removedBy, removedByRole, membership.team_id);
          if (!canManage) {
            console.error('User does not have permission to remove members from this team');
            return false;
          }
        }
      }

      const { error } = await supabase
        .from('team_memberships')
        .update({ is_active: false })
        .eq('id', membershipId);

      if (error) throw error;

      // Send notification to the removed member
      if (membership) {
        const team = await this.getTeamById(membership.team_id);
        if (team) {
          await NotificationService.notifyUser(
            membership.admin_user_id,
            'member_left',
            `Removed from ${team.name}`,
            `You've been removed from the ${team.name} team.`,
            '/admin/teams'
          );

          // Notify other team members
          await NotificationService.notifyTeamMembers(
            membership.team_id,
            'member_left',
            'Team Member Left',
            `A member has left ${team.name}.`,
            `/admin/teams`,
            membership.admin_user_id
          );

          // Log activity
          if (removedBy) {
            await TeamActivityService.logActivity(
              membership.team_id,
              removedBy,
              'member_removed',
              membership.admin_user_id
            );
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Error removing team member:', error);
      return false;
    }
  }

  static async isUserInTeam(userId: string, teamId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('team_memberships')
        .select('id')
        .eq('admin_user_id', userId)
        .eq('team_id', teamId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking team membership:', error);
      return false;
    }
  }

  static async getUserRoleInTeam(userId: string, teamId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('team_memberships')
        .select('role')
        .eq('admin_user_id', userId)
        .eq('team_id', teamId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data?.role || null;
    } catch (error) {
      console.error('Error getting user role in team:', error);
      return null;
    }
  }

  // ============================================
  // TEAM PERMISSIONS OPERATIONS
  // ============================================

  static async getTeamPermissions(teamId: string): Promise<TeamPermission[]> {
    try {
      const { data, error } = await supabase
        .from('team_permissions')
        .select('*')
        .eq('team_id', teamId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching team permissions:', error);
      return [];
    }
  }

  static async getUserPermissions(userId: string): Promise<TeamPermission[]> {
    try {
      // Get all teams the user belongs to
      const userTeams = await this.getUserTeams(userId);
      const teamIds = userTeams.map(t => t.team_id);

      if (teamIds.length === 0) return [];

      const { data, error } = await supabase
        .from('team_permissions')
        .select('*')
        .in('team_id', teamIds);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      return [];
    }
  }

  static async hasPermission(
    userId: string, 
    resourceType: string, 
    action: 'create' | 'read' | 'update' | 'delete'
  ): Promise<boolean> {
    try {
      const permissions = await this.getUserPermissions(userId);
      const actionField = `can_${action}` as keyof TeamPermission;
      
      return permissions.some(
        p => p.resource_type === resourceType && p[actionField] === true
      );
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  static async setTeamPermission(
    teamId: string,
    permission: string,
    resourceType: string,
    permissions: { can_create?: boolean; can_read?: boolean; can_update?: boolean; can_delete?: boolean }
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('team_permissions')
        .upsert({
          team_id: teamId,
          permission,
          resource_type: resourceType,
          ...permissions
        }, {
          onConflict: 'team_id,permission,resource_type'
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error setting team permission:', error);
      return false;
    }
  }

  // ============================================
  // TEAM ANNOUNCEMENTS OPERATIONS
  // ============================================

  static async getTeamAnnouncements(teamId?: string, includeGlobal = true, includeScheduled = false): Promise<TeamAnnouncement[]> {
    try {
      let query = supabase
        .from('team_announcements')
        .select(`
          *,
          author:admin_users!team_announcements_author_id_fkey(id, email, display_name),
          team:admin_teams(id, name, slug, color)
        `)
        .eq('is_active', true)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      // Filter by published status (scheduled announcements should only show if scheduled_for is past)
      if (!includeScheduled) {
        query = query.or('scheduled_for.is.null,scheduled_for.lte.' + new Date().toISOString());
      }

      if (teamId) {
        if (includeGlobal) {
          query = query.or(`team_id.eq.${teamId},team_id.is.null`);
        } else {
          query = query.eq('team_id', teamId);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching team announcements:', error);
      return [];
    }
  }

  static async getScheduledAnnouncements(teamId?: string): Promise<TeamAnnouncement[]> {
    try {
      let query = supabase
        .from('team_announcements')
        .select(`
          *,
          author:admin_users!team_announcements_author_id_fkey(id, email, display_name),
          team:admin_teams(id, name, slug, color)
        `)
        .eq('is_active', true)
        .not('scheduled_for', 'is', null)
        .gt('scheduled_for', new Date().toISOString())
        .order('scheduled_for', { ascending: true });

      if (teamId) {
        query = query.eq('team_id', teamId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching scheduled announcements:', error);
      return [];
    }
  }

  static async createTeamAnnouncement(
    announcement: Partial<TeamAnnouncement>,
    authorId: string
  ): Promise<TeamAnnouncement | null> {
    try {
      const isScheduled = announcement.scheduled_for && new Date(announcement.scheduled_for) > new Date();
      
      const { data, error } = await supabase
        .from('team_announcements')
        .insert({
          team_id: announcement.team_id,
          title: announcement.title,
          message: announcement.message,
          priority: announcement.priority || 'normal',
          author_id: authorId,
          is_pinned: announcement.is_pinned || false,
          expires_at: announcement.expires_at,
          scheduled_for: announcement.scheduled_for,
          is_published: !isScheduled,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      // Send notifications to team members (only if not scheduled)
      if (data && !isScheduled && announcement.team_id) {
        const team = await this.getTeamById(announcement.team_id);
        if (team) {
          await NotificationService.notifyTeamMembers(
            announcement.team_id,
            'team_announcement',
            announcement.title || 'New Announcement',
            announcement.message?.substring(0, 100) + (announcement.message && announcement.message.length > 100 ? '...' : '') || '',
            `/admin/team/${announcement.team_id}`,
            authorId // Exclude the author
          );

          // Log activity
          await TeamActivityService.logActivity(
            announcement.team_id,
            authorId,
            'announcement_posted',
            undefined,
            { title: announcement.title, priority: announcement.priority }
          );

          // Send email notifications to team members (for high/urgent priority)
          if (announcement.priority === 'high' || announcement.priority === 'urgent') {
            try {
              const members = await this.getTeamMembers(announcement.team_id);
              const { data: author } = await supabase
                .from('admin_users')
                .select('email, display_name')
                .eq('id', authorId)
                .single();

              if (author) {
                for (const member of members) {
                  if (member.admin_user_id !== authorId && member.admin_user?.email) {
                    await ResendService.sendTeamAnnouncementEmail(
                      member.admin_user.email,
                      member.admin_user.display_name || member.admin_user.email,
                      team.name,
                      announcement.title || 'New Announcement',
                      announcement.message || '',
                      announcement.priority || 'normal',
                      author.display_name || author.email
                    );
                  }
                }
              }
            } catch (emailError) {
              console.error('Failed to send announcement emails:', emailError);
              // Don't fail the operation if email fails
            }
          }
        }
      }

      return data;
    } catch (error) {
      console.error('Error creating team announcement:', error);
      return null;
    }
  }

  static async publishScheduledAnnouncements(): Promise<number> {
    try {
      // Find announcements that should be published now
      const { data: announcements, error: fetchError } = await supabase
        .from('team_announcements')
        .select('*')
        .eq('is_active', true)
        .eq('is_published', false)
        .not('scheduled_for', 'is', null)
        .lte('scheduled_for', new Date().toISOString());

      if (fetchError) throw fetchError;
      if (!announcements || announcements.length === 0) return 0;

      // Update them to published
      const { error: updateError } = await supabase
        .from('team_announcements')
        .update({ is_published: true })
        .in('id', announcements.map(a => a.id));

      if (updateError) throw updateError;

      // Send notifications for each
      for (const announcement of announcements) {
        if (announcement.team_id) {
          await NotificationService.notifyTeamMembers(
            announcement.team_id,
            'team_announcement',
            announcement.title || 'New Announcement',
            announcement.message?.substring(0, 100) + '...' || '',
            `/admin/team/${announcement.team_id}`,
            announcement.author_id
          );
        }
      }

      return announcements.length;
    } catch (error) {
      console.error('Error publishing scheduled announcements:', error);
      return 0;
    }
  }

  static async markAnnouncementAsRead(announcementId: string, userId: string): Promise<boolean> {
    try {
      // Get current read_by array
      const { data: announcement, error: fetchError } = await supabase
        .from('team_announcements')
        .select('read_by')
        .eq('id', announcementId)
        .single();

      if (fetchError) throw fetchError;

      const readBy = announcement?.read_by || [];
      if (!readBy.includes(userId)) {
        readBy.push(userId);
        
        const { error } = await supabase
          .from('team_announcements')
          .update({ read_by: readBy })
          .eq('id', announcementId);

        if (error) throw error;
      }

      return true;
    } catch (error) {
      console.error('Error marking announcement as read:', error);
      return false;
    }
  }

  static async deleteTeamAnnouncement(announcementId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('team_announcements')
        .update({ is_active: false })
        .eq('id', announcementId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting team announcement:', error);
      return false;
    }
  }

  // ============================================
  // STATISTICS
  // ============================================

  static async getTeamStats(): Promise<{
    totalTeams: number;
    activeTeams: number;
    totalMemberships: number;
    teamDistribution: Record<string, number>;
  }> {
    try {
      const [teamsResult, membershipsResult] = await Promise.all([
        supabase.from('admin_teams').select('*', { count: 'exact' }),
        supabase.from('team_memberships').select('team_id', { count: 'exact' }).eq('is_active', true)
      ]);

      const teams = teamsResult.data || [];
      const activeTeams = teams.filter(t => t.is_active).length;

      // Get distribution
      const distribution: Record<string, number> = {};
      const memberships = membershipsResult.data || [];
      
      for (const m of memberships) {
        const team = teams.find(t => t.id === m.team_id);
        if (team) {
          distribution[team.name] = (distribution[team.name] || 0) + 1;
        }
      }

      return {
        totalTeams: teams.length,
        activeTeams,
        totalMemberships: membershipsResult.count || 0,
        teamDistribution: distribution
      };
    } catch (error) {
      console.error('Error fetching team stats:', error);
      return {
        totalTeams: 0,
        activeTeams: 0,
        totalMemberships: 0,
        teamDistribution: {}
      };
    }
  }
}
