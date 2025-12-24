import { supabase } from '@/lib/supabase';

export interface TeamActivity {
  id: string;
  team_id: string;
  actor_id: string;
  action: string;
  target_user_id?: string;
  details: Record<string, any>;
  created_at: string;
  // Joined data
  actor?: { id: string; email: string; display_name?: string };
  target_user?: { id: string; email: string; display_name?: string };
}

export type TeamActivityAction = 
  | 'member_added'
  | 'member_removed'
  | 'role_changed'
  | 'announcement_posted'
  | 'message_sent'
  | 'invite_sent'
  | 'invite_accepted'
  | 'finance_submitted'
  | 'finance_approved'
  | 'finance_rejected';

export class TeamActivityService {
  /**
   * Log a team activity
   */
  static async logActivity(
    teamId: string,
    actorId: string,
    action: TeamActivityAction,
    targetUserId?: string,
    details?: Record<string, any>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('team_activity_log')
        .insert({
          team_id: teamId,
          actor_id: actorId,
          action,
          target_user_id: targetUserId,
          details: details || {}
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error logging team activity:', error);
      return false;
    }
  }

  /**
   * Get activity log for a team
   */
  static async getTeamActivity(
    teamId: string,
    limit = 50,
    offset = 0
  ): Promise<TeamActivity[]> {
    try {
      const { data, error } = await supabase
        .from('team_activity_log')
        .select(`
          *,
          actor:admin_users!team_activity_log_actor_id_fkey(id, email, display_name),
          target_user:admin_users!team_activity_log_target_user_id_fkey(id, email, display_name)
        `)
        .eq('team_id', teamId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching team activity:', error);
      return [];
    }
  }

  /**
   * Get recent activity across all teams a user belongs to
   */
  static async getUserTeamsActivity(
    teamIds: string[],
    limit = 20
  ): Promise<TeamActivity[]> {
    try {
      if (teamIds.length === 0) return [];

      const { data, error } = await supabase
        .from('team_activity_log')
        .select(`
          *,
          actor:admin_users!team_activity_log_actor_id_fkey(id, email, display_name),
          target_user:admin_users!team_activity_log_target_user_id_fkey(id, email, display_name)
        `)
        .in('team_id', teamIds)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user teams activity:', error);
      return [];
    }
  }

  /**
   * Get human-readable description of an activity
   */
  static getActivityDescription(activity: TeamActivity): string {
    const actorName = activity.actor?.display_name || activity.actor?.email || 'Someone';
    const targetName = activity.target_user?.display_name || activity.target_user?.email || 'a user';

    switch (activity.action) {
      case 'member_added':
        return `${actorName} added ${targetName} to the team`;
      case 'member_removed':
        return `${actorName} removed ${targetName} from the team`;
      case 'role_changed':
        const newRole = activity.details?.new_role || 'member';
        return `${actorName} changed ${targetName}'s role to ${newRole}`;
      case 'announcement_posted':
        return `${actorName} posted an announcement`;
      case 'message_sent':
        return `${actorName} sent a message`;
      case 'invite_sent':
        const inviteEmail = activity.details?.email || 'someone';
        return `${actorName} invited ${inviteEmail} to join`;
      case 'invite_accepted':
        return `${actorName} accepted the team invite`;
      case 'finance_submitted':
        const amount = activity.details?.amount || 0;
        return `${actorName} submitted an expense of $${amount}`;
      case 'finance_approved':
        return `${actorName} approved a finance request`;
      case 'finance_rejected':
        return `${actorName} rejected a finance request`;
      default:
        return `${actorName} performed an action`;
    }
  }

  /**
   * Get activity icon based on action type
   */
  static getActivityIcon(action: string): string {
    const icons: Record<string, string> = {
      member_added: 'user-plus',
      member_removed: 'user-minus',
      role_changed: 'shield',
      announcement_posted: 'megaphone',
      message_sent: 'message-circle',
      invite_sent: 'mail',
      invite_accepted: 'check-circle',
      finance_submitted: 'receipt',
      finance_approved: 'check',
      finance_rejected: 'x'
    };
    return icons[action] || 'activity';
  }

  /**
   * Get activity color based on action type
   */
  static getActivityColor(action: string): string {
    const colors: Record<string, string> = {
      member_added: 'text-green-500',
      member_removed: 'text-red-500',
      role_changed: 'text-blue-500',
      announcement_posted: 'text-purple-500',
      message_sent: 'text-gray-500',
      invite_sent: 'text-yellow-500',
      invite_accepted: 'text-green-500',
      finance_submitted: 'text-orange-500',
      finance_approved: 'text-green-500',
      finance_rejected: 'text-red-500'
    };
    return colors[action] || 'text-gray-500';
  }
}
