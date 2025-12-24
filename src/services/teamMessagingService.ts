import { supabase } from '@/lib/supabase';
import { TeamActivityService } from './teamActivityService';

export interface TeamMessage {
  id: string;
  team_id: string;
  sender_id: string;
  message: string;
  message_type: 'text' | 'file' | 'image' | 'link';
  attachment_url?: string;
  reply_to_id?: string;
  is_pinned: boolean;
  read_by: string[];
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  sender?: { id: string; email: string; display_name?: string };
  reply_to?: TeamMessage;
}

export class TeamMessagingService {
  /**
   * Send a message to a team
   */
  static async sendMessage(
    teamId: string,
    senderId: string,
    message: string,
    messageType: 'text' | 'file' | 'image' | 'link' = 'text',
    attachmentUrl?: string,
    replyToId?: string
  ): Promise<TeamMessage | null> {
    try {
      const { data, error } = await supabase
        .from('team_messages')
        .insert({
          team_id: teamId,
          sender_id: senderId,
          message,
          message_type: messageType,
          attachment_url: attachmentUrl,
          reply_to_id: replyToId,
          read_by: [senderId] // Sender has read their own message
        })
        .select(`
          *,
          sender:admin_users!team_messages_sender_id_fkey(id, email, display_name)
        `)
        .single();

      if (error) throw error;

      // Log activity (but not for every message to avoid spam)
      // Only log if it's a pinned message or has attachment
      if (attachmentUrl) {
        await TeamActivityService.logActivity(
          teamId,
          senderId,
          'message_sent',
          undefined,
          { message_type: messageType, has_attachment: true }
        );
      }

      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  }

  /**
   * Get messages for a team
   */
  static async getTeamMessages(
    teamId: string,
    limit = 50,
    before?: string
  ): Promise<TeamMessage[]> {
    try {
      let query = supabase
        .from('team_messages')
        .select(`
          *,
          sender:admin_users!team_messages_sender_id_fkey(id, email, display_name)
        `)
        .eq('team_id', teamId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (before) {
        query = query.lt('created_at', before);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Return in chronological order for display
      return (data || []).reverse();
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  /**
   * Get pinned messages for a team
   */
  static async getPinnedMessages(teamId: string): Promise<TeamMessage[]> {
    try {
      const { data, error } = await supabase
        .from('team_messages')
        .select(`
          *,
          sender:admin_users!team_messages_sender_id_fkey(id, email, display_name)
        `)
        .eq('team_id', teamId)
        .eq('is_pinned', true)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching pinned messages:', error);
      return [];
    }
  }

  /**
   * Mark messages as read
   */
  static async markAsRead(messageIds: string[], userId: string): Promise<boolean> {
    try {
      for (const messageId of messageIds) {
        // Get current read_by array
        const { data: message } = await supabase
          .from('team_messages')
          .select('read_by')
          .eq('id', messageId)
          .single();

        if (message) {
          const readBy = message.read_by || [];
          if (!readBy.includes(userId)) {
            readBy.push(userId);
            await supabase
              .from('team_messages')
              .update({ read_by: readBy })
              .eq('id', messageId);
          }
        }
      }
      return true;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return false;
    }
  }

  /**
   * Pin/unpin a message
   */
  static async togglePin(messageId: string, isPinned: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('team_messages')
        .update({ is_pinned: isPinned })
        .eq('id', messageId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error toggling pin:', error);
      return false;
    }
  }

  /**
   * Delete a message (soft delete)
   */
  static async deleteMessage(messageId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('team_messages')
        .update({ is_deleted: true })
        .eq('id', messageId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting message:', error);
      return false;
    }
  }

  /**
   * Edit a message
   */
  static async editMessage(messageId: string, newMessage: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('team_messages')
        .update({ message: newMessage })
        .eq('id', messageId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error editing message:', error);
      return false;
    }
  }

  /**
   * Get unread message count for a user in a team
   */
  static async getUnreadCount(teamId: string, userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('team_messages')
        .select('id, read_by')
        .eq('team_id', teamId)
        .eq('is_deleted', false);

      if (error) throw error;

      const unreadCount = (data || []).filter(
        msg => !msg.read_by?.includes(userId)
      ).length;

      return unreadCount;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Get unread counts for multiple teams
   */
  static async getUnreadCountsForTeams(
    teamIds: string[],
    userId: string
  ): Promise<Record<string, number>> {
    try {
      if (teamIds.length === 0) return {};

      const { data, error } = await supabase
        .from('team_messages')
        .select('id, team_id, read_by')
        .in('team_id', teamIds)
        .eq('is_deleted', false);

      if (error) throw error;

      const counts: Record<string, number> = {};
      for (const teamId of teamIds) {
        counts[teamId] = 0;
      }

      for (const msg of data || []) {
        if (!msg.read_by?.includes(userId)) {
          counts[msg.team_id] = (counts[msg.team_id] || 0) + 1;
        }
      }

      return counts;
    } catch (error) {
      console.error('Error getting unread counts:', error);
      return {};
    }
  }

  /**
   * Search messages in a team
   */
  static async searchMessages(
    teamId: string,
    query: string,
    limit = 20
  ): Promise<TeamMessage[]> {
    try {
      const { data, error } = await supabase
        .from('team_messages')
        .select(`
          *,
          sender:admin_users!team_messages_sender_id_fkey(id, email, display_name)
        `)
        .eq('team_id', teamId)
        .eq('is_deleted', false)
        .ilike('message', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching messages:', error);
      return [];
    }
  }
}
