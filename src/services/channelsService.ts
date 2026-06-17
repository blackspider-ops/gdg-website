import { supabase } from '@/lib/supabase';

export interface Channel {
  id: string;
  name: string;
  description?: string;
  created_by?: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChannelMessage {
  id: string;
  channel_id: string;
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
  sender?: { id: string; email: string; display_name?: string };
}

/**
 * Org-wide communication channels (topic rooms, not tied to a team).
 * Mirrors TeamMessagingService but scoped by channel_id. See the
 * 20260616000002_channels.sql migration.
 */
export class ChannelsService {
  // ---- Channels ----

  static async getChannels(includeArchived = false): Promise<Channel[]> {
    try {
      let query = supabase
        .from('channels')
        .select('*')
        .order('name', { ascending: true });

      if (!includeArchived) {
        query = query.eq('is_archived', false);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching channels:', error);
      return [];
    }
  }

  static async createChannel(
    name: string,
    description: string | undefined,
    createdBy: string
  ): Promise<Channel | null> {
    try {
      const { data, error } = await supabase
        .from('channels')
        .insert({ name: name.trim(), description: description?.trim() || null, created_by: createdBy })
        .select('*')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating channel:', error);
      return null;
    }
  }

  static async archiveChannel(channelId: string, isArchived = true): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('channels')
        .update({ is_archived: isArchived, updated_at: new Date().toISOString() })
        .eq('id', channelId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error archiving channel:', error);
      return false;
    }
  }

  // ---- Messages ----

  static async getMessages(channelId: string, limit = 100): Promise<ChannelMessage[]> {
    try {
      const { data, error } = await supabase
        .from('channel_messages')
        .select(`
          *,
          sender:admin_users!channel_messages_sender_id_fkey(id, email, display_name)
        `)
        .eq('channel_id', channelId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      // Return chronological for display
      return (data || []).reverse();
    } catch (error) {
      console.error('Error fetching channel messages:', error);
      return [];
    }
  }

  static async sendMessage(
    channelId: string,
    senderId: string,
    message: string,
    replyToId?: string
  ): Promise<ChannelMessage | null> {
    try {
      const { data, error } = await supabase
        .from('channel_messages')
        .insert({
          channel_id: channelId,
          sender_id: senderId,
          message: message.trim(),
          message_type: 'text',
          reply_to_id: replyToId,
          read_by: [senderId]
        })
        .select(`
          *,
          sender:admin_users!channel_messages_sender_id_fkey(id, email, display_name)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error sending channel message:', error);
      return null;
    }
  }

  static async togglePin(messageId: string, isPinned: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('channel_messages')
        .update({ is_pinned: isPinned })
        .eq('id', messageId);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error toggling pin:', error);
      return false;
    }
  }

  static async deleteMessage(messageId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('channel_messages')
        .update({ is_deleted: true })
        .eq('id', messageId);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting channel message:', error);
      return false;
    }
  }
}

export default ChannelsService;
