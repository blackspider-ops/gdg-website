import { supabase } from '@/lib/supabase';

export type NotificationType = 
  | 'team_invite'
  | 'team_announcement'
  | 'finance_approval_needed'
  | 'finance_approved'
  | 'finance_rejected'
  | 'task_assigned'
  | 'task_due'
  | 'mention'
  | 'team_message'
  | 'member_joined'
  | 'member_left'
  | 'system';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  metadata?: Record<string, any>;
  created_at: string;
}

export class NotificationService {
  // ============================================
  // NOTIFICATION CRUD
  // ============================================

  static async getNotifications(
    userId: string,
    limit: number = 50,
    unreadOnly: boolean = false
  ): Promise<Notification[]> {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (unreadOnly) {
        query = query.eq('is_read', false);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }

  static async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    link?: string,
    metadata?: Record<string, any>
  ): Promise<Notification | null> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          title,
          message,
          link,
          metadata,
          is_read: false
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  }

  static async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  static async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  static async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }

  static async clearOldNotifications(userId: string, daysOld: number = 30): Promise<boolean> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId)
        .lt('created_at', cutoffDate.toISOString());

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error clearing old notifications:', error);
      return false;
    }
  }

  // ============================================
  // NOTIFICATION HELPERS
  // ============================================

  static async notifyTeamMembers(
    teamId: string,
    type: NotificationType,
    title: string,
    message: string,
    link?: string,
    excludeUserId?: string
  ): Promise<void> {
    try {
      // Get all team members
      const { data: members } = await supabase
        .from('team_memberships')
        .select('admin_user_id')
        .eq('team_id', teamId)
        .eq('is_active', true);

      if (!members) return;

      // Create notifications for each member
      const notifications = members
        .filter(m => m.admin_user_id !== excludeUserId)
        .map(m => ({
          user_id: m.admin_user_id,
          type,
          title,
          message,
          link,
          is_read: false
        }));

      if (notifications.length > 0) {
        await supabase.from('notifications').insert(notifications);
      }
    } catch (error) {
      console.error('Error notifying team members:', error);
    }
  }

  static async notifyUser(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    link?: string
  ): Promise<void> {
    await this.createNotification(userId, type, title, message, link);
  }

  static async notifyFinanceApprovalNeeded(
    financeId: string,
    description: string,
    amount: number,
    teamId?: string
  ): Promise<void> {
    // Notify admins and super admins
    const { data: admins } = await supabase
      .from('admin_users')
      .select('id')
      .in('role', ['admin', 'super_admin']);

    if (admins) {
      const notifications = admins.map(admin => ({
        user_id: admin.id,
        type: 'finance_approval_needed' as NotificationType,
        title: 'Finance Approval Needed',
        message: `${description} - $${amount.toLocaleString()} requires approval`,
        link: '/admin/finances',
        is_read: false
      }));

      await supabase.from('notifications').insert(notifications);
    }
  }

  static getNotificationIcon(type: NotificationType): string {
    const icons: Record<NotificationType, string> = {
      team_invite: '📨',
      team_announcement: '📢',
      finance_approval_needed: '💰',
      finance_approved: '✅',
      finance_rejected: '❌',
      task_assigned: '📋',
      task_due: '⏰',
      mention: '@',
      team_message: '💬',
      member_joined: '👋',
      member_left: '👋',
      system: '🔔'
    };
    return icons[type] || '🔔';
  }

  static getNotificationColor(type: NotificationType): string {
    const colors: Record<NotificationType, string> = {
      team_invite: 'text-blue-500',
      team_announcement: 'text-purple-500',
      finance_approval_needed: 'text-yellow-500',
      finance_approved: 'text-green-500',
      finance_rejected: 'text-red-500',
      task_assigned: 'text-cyan-500',
      task_due: 'text-orange-500',
      mention: 'text-pink-500',
      team_message: 'text-indigo-500',
      member_joined: 'text-green-500',
      member_left: 'text-gray-500',
      system: 'text-gray-500'
    };
    return colors[type] || 'text-gray-500';
  }
}
