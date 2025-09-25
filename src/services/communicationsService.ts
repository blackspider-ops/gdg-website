import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { AuditService } from './auditService';

// Email functionality
export interface DirectEmailRequest {
  to_emails: string[];
  subject: string;
  message: string;
  email_type: 'announcement' | 'task_notification' | 'direct_message' | 'custom';
  sender_name?: string;
}

export interface EmailResult {
  success: boolean;
  total_sent?: number;
  total_failed?: number;
  results?: {
    successful: number;
    failed: number;
    failed_emails: Array<{ email: string; error: string }>;
  };
  error?: string;
}

// Create service role client for communications operations
let serviceRoleClient: any = null;

const getServiceRoleClient = () => {
  if (serviceRoleClient) {
    return serviceRoleClient;
  }
  
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    serviceRoleClient = supabase;
    return supabase;
  }
  
  try {
    serviceRoleClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  } catch (error) {
    serviceRoleClient = supabase;
  }
  
  return serviceRoleClient;
};

// Types
export interface Announcement {
  id: string;
  title: string;
  message: string;
  author_id: string;
  priority: 'low' | 'medium' | 'high';
  is_pinned: boolean;
  is_archived: boolean;
  target_audience: any;
  created_at: string;
  updated_at: string;
  author?: {
    email: string;
    role: string;
  };
  read_count?: number;
  total_recipients?: number;
  is_read_by_current_user?: boolean;
}

export interface CommunicationTask {
  id: string;
  title: string;
  description?: string;
  assigned_to_id?: string;
  assigned_by_id: string;
  due_date?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  attachments: any[];
  created_at: string;
  updated_at: string;
  assigned_to?: {
    email: string;
    role: string;
  };
  assigned_by?: {
    email: string;
    role: string;
  };
  comments_count?: number;
}

export interface InternalMessage {
  id: string;
  from_user_id: string;
  to_user_id: string;
  subject: string;
  message: string;
  is_read: boolean;
  is_archived: boolean;
  reply_to_id?: string;
  attachments: any[];
  created_at: string;
  read_at?: string;
  from_user?: {
    email: string;
    role: string;
  };
  to_user?: {
    email: string;
    role: string;
  };
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  comment: string;
  comment_type: 'comment' | 'status_change' | 'assignment_change';
  metadata: any;
  created_at: string;
  user?: {
    email: string;
    role: string;
  };
}

export interface CommunicationStats {
  total_announcements: number;
  active_announcements: number;
  total_tasks: number;
  pending_tasks: number;
  overdue_tasks: number;
  total_messages: number;
  unread_messages: number;
  team_members: number;
}

export class CommunicationsService {
  // ANNOUNCEMENTS
  static async getAnnouncements(
    filters?: {
      priority?: string;
      is_pinned?: boolean;
      is_archived?: boolean;
      search?: string;
    }
  ): Promise<Announcement[]> {
    try {
      let query = getServiceRoleClient()
        .from('announcements')
        .select(`
          *,
          author:admin_users!announcements_author_id_fkey(email, role)
        `)
        .eq('is_archived', false)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }

      if (filters?.is_pinned !== undefined) {
        query = query.eq('is_pinned', filters.is_pinned);
      }

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,message.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Get current user ID safely
      const currentUser = await supabase.auth.getUser();
      const currentUserId = currentUser.data.user?.id;

      // Get read counts and current user read status
      const enrichedData = await Promise.all(
        (data || []).map(async (announcement) => {
          const readCountResult = await getServiceRoleClient()
            .from('announcement_reads')
            .select('id', { count: 'exact' })
            .eq('announcement_id', announcement.id);

          let currentUserReadResult = { data: null };
          if (currentUserId) {
            currentUserReadResult = await getServiceRoleClient()
              .from('announcement_reads')
              .select('id')
              .eq('announcement_id', announcement.id)
              .eq('user_id', currentUserId)
              .single();
          }

          return {
            ...announcement,
            read_count: readCountResult.count || 0,
            total_recipients: 5, // Calculated based on target audience
            is_read_by_current_user: !!currentUserReadResult.data
          };
        })
      );

      return enrichedData;
    } catch (error) {
      return [];
    }
  }

  static async createAnnouncement(
    announcement: {
      title: string;
      message: string;
      priority: 'low' | 'medium' | 'high';
      is_pinned?: boolean;
      target_audience?: any;
    },
    authorId: string
  ): Promise<Announcement | null> {
    try {
      const { data, error } = await getServiceRoleClient()
        .from('announcements')
        .insert({
          ...announcement,
          author_id: authorId,
          is_pinned: announcement.is_pinned || false,
          target_audience: announcement.target_audience || { type: 'all' }
        })
        .select(`
          *,
          author:admin_users!announcements_author_id_fkey(email, role)
        `)
        .single();

      if (error) throw error;

      // Log the action
      await AuditService.logAction(
        authorId,
        'create_announcement',
        undefined,
        {
          description: `Created announcement: ${announcement.title}`,
          priority: announcement.priority,
          is_pinned: announcement.is_pinned
        }
      );

      return data;
    } catch (error) {
      return null;
    }
  }

  static async updateAnnouncement(
    id: string,
    updates: Partial<Announcement>,
    userId: string
  ): Promise<boolean> {
    try {
      const { error } = await getServiceRoleClient()
        .from('announcements')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      // Log the action
      await AuditService.logAction(
        userId,
        'update_announcement',
        undefined,
        {
          description: `Updated announcement: ${updates.title || 'Unknown'}`,
          announcement_id: id,
          changes: updates
        }
      );

      return true;
    } catch (error) {
      return false;
    }
  }

  static async deleteAnnouncement(id: string, userId: string): Promise<boolean> {
    try {
      const { error } = await getServiceRoleClient()
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Log the action
      await AuditService.logAction(
        userId,
        'delete_announcement',
        undefined,
        {
          description: 'Deleted announcement',
          announcement_id: id
        }
      );

      return true;
    } catch (error) {
      return false;
    }
  }

  static async markAnnouncementAsRead(announcementId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await getServiceRoleClient()
        .from('announcement_reads')
        .upsert({
          announcement_id: announcementId,
          user_id: userId
        });

      if (error) throw error;
      return true;
    } catch (error) {
      return false;
    }
  }

  // TASKS
  static async getTasks(
    filters?: {
      status?: string;
      priority?: string;
      assigned_to?: string;
      search?: string;
    }
  ): Promise<CommunicationTask[]> {
    try {
      let query = getServiceRoleClient()
        .from('communication_tasks')
        .select(`
          *,
          assigned_to:admin_users!communication_tasks_assigned_to_id_fkey(email, role),
          assigned_by:admin_users!communication_tasks_assigned_by_id_fkey(email, role)
        `)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }

      if (filters?.assigned_to) {
        query = query.eq('assigned_to_id', filters.assigned_to);
      }

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Get comment counts
      const enrichedData = await Promise.all(
        (data || []).map(async (task) => {
          const { count } = await getServiceRoleClient()
            .from('task_comments')
            .select('id', { count: 'exact' })
            .eq('task_id', task.id);

          return {
            ...task,
            comments_count: count || 0
          };
        })
      );

      return enrichedData;
    } catch (error) {
      return [];
    }
  }

  static async createTask(
    task: {
      title: string;
      description?: string;
      assigned_to_id?: string;
      due_date?: string;
      priority: 'low' | 'medium' | 'high';
      tags?: string[];
    },
    assignedById: string
  ): Promise<CommunicationTask | null> {
    try {
      const { data, error } = await getServiceRoleClient()
        .from('communication_tasks')
        .insert({
          ...task,
          assigned_by_id: assignedById,
          tags: task.tags || [],
          attachments: []
        })
        .select(`
          *,
          assigned_to:admin_users!communication_tasks_assigned_to_id_fkey(email, role),
          assigned_by:admin_users!communication_tasks_assigned_by_id_fkey(email, role)
        `)
        .single();

      if (error) throw error;

      // Log the action
      await AuditService.logAction(
        assignedById,
        'create_task',
        task.assigned_to_id,
        {
          description: `Created task: ${task.title}`,
          task_id: data.id,
          assigned_to: task.assigned_to_id,
          priority: task.priority,
          due_date: task.due_date
        }
      );

      return data;
    } catch (error) {
      return null;
    }
  }

  static async updateTask(
    id: string,
    updates: Partial<CommunicationTask>,
    userId: string
  ): Promise<boolean> {
    try {
      const { error } = await getServiceRoleClient()
        .from('communication_tasks')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      // Log the action
      await AuditService.logAction(
        userId,
        'update_task',
        undefined,
        {
          description: `Updated task: ${updates.title || 'Unknown'}`,
          task_id: id,
          changes: updates
        }
      );

      return true;
    } catch (error) {
      return false;
    }
  }

  static async deleteTask(id: string, userId: string): Promise<boolean> {
    try {
      const { error } = await getServiceRoleClient()
        .from('communication_tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Log the action
      await AuditService.logAction(
        userId,
        'delete_task',
        undefined,
        {
          description: 'Deleted task',
          task_id: id
        }
      );

      return true;
    } catch (error) {
      return false;
    }
  }

  // MESSAGES
  static async getMessages(userId: string): Promise<InternalMessage[]> {
    try {
      const { data, error } = await getServiceRoleClient()
        .from('internal_messages')
        .select(`
          *,
          from_user:admin_users!internal_messages_from_user_id_fkey(email, role),
          to_user:admin_users!internal_messages_to_user_id_fkey(email, role)
        `)
        .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      return [];
    }
  }

  static async sendMessage(
    message: {
      to_user_id: string;
      subject: string;
      message: string;
      reply_to_id?: string;
    },
    fromUserId: string
  ): Promise<InternalMessage | null> {
    try {
      const { data, error } = await getServiceRoleClient()
        .from('internal_messages')
        .insert({
          ...message,
          from_user_id: fromUserId,
          attachments: []
        })
        .select(`
          *,
          from_user:admin_users!internal_messages_from_user_id_fkey(email, role),
          to_user:admin_users!internal_messages_to_user_id_fkey(email, role)
        `)
        .single();

      if (error) throw error;

      // Log the action
      await AuditService.logAction(
        fromUserId,
        'send_message',
        message.to_user_id,
        {
          description: `Sent message: ${message.subject}`,
          message_id: data.id,
          recipient: message.to_user_id
        }
      );

      return data;
    } catch (error) {
      return null;
    }
  }

  static async markMessageAsRead(id: string, userId: string): Promise<boolean> {
    try {
      const { error } = await getServiceRoleClient()
        .from('internal_messages')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('to_user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      return false;
    }
  }

  // TASK COMMENTS
  static async getTaskComments(taskId: string): Promise<TaskComment[]> {
    try {
      const { data, error } = await getServiceRoleClient()
        .from('task_comments')
        .select(`
          *,
          user:admin_users!task_comments_user_id_fkey(email, role)
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      return [];
    }
  }

  static async addTaskComment(
    taskId: string,
    comment: string,
    userId: string,
    commentType: 'comment' | 'status_change' | 'assignment_change' = 'comment',
    metadata: any = {}
  ): Promise<TaskComment | null> {
    try {
      const { data, error } = await getServiceRoleClient()
        .from('task_comments')
        .insert({
          task_id: taskId,
          user_id: userId,
          comment,
          comment_type: commentType,
          metadata
        })
        .select(`
          *,
          user:admin_users!task_comments_user_id_fkey(email, role)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      return null;
    }
  }

  // STATISTICS
  static async getCommunicationStats(userId?: string): Promise<CommunicationStats> {
    try {
      const [
        announcementsResult,
        activeAnnouncementsResult,
        tasksResult,
        pendingTasksResult,
        overdueTasksResult,
        messagesResult,
        unreadMessagesResult,
        teamMembersResult
      ] = await Promise.all([
        getServiceRoleClient().from('announcements').select('id', { count: 'exact' }),
        getServiceRoleClient().from('announcements').select('id', { count: 'exact' }).eq('is_archived', false),
        getServiceRoleClient().from('communication_tasks').select('id', { count: 'exact' }),
        getServiceRoleClient().from('communication_tasks').select('id', { count: 'exact' }).in('status', ['pending', 'in-progress']),
        getServiceRoleClient().from('communication_tasks').select('id', { count: 'exact' }).eq('status', 'overdue'),
        userId ? getServiceRoleClient().from('internal_messages').select('id', { count: 'exact' }).or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`) : { count: 0 },
        userId ? getServiceRoleClient().from('internal_messages').select('id', { count: 'exact' }).eq('to_user_id', userId).eq('is_read', false) : { count: 0 },
        getServiceRoleClient().from('admin_users').select('id', { count: 'exact' }).eq('is_active', true)
      ]);

      return {
        total_announcements: announcementsResult.count || 0,
        active_announcements: activeAnnouncementsResult.count || 0,
        total_tasks: tasksResult.count || 0,
        pending_tasks: pendingTasksResult.count || 0,
        overdue_tasks: overdueTasksResult.count || 0,
        total_messages: messagesResult.count || 0,
        unread_messages: unreadMessagesResult.count || 0,
        team_members: teamMembersResult.count || 0
      };
    } catch (error) {
      return {
        total_announcements: 0,
        active_announcements: 0,
        total_tasks: 0,
        pending_tasks: 0,
        overdue_tasks: 0,
        total_messages: 0,
        unread_messages: 0,
        team_members: 0
      };
    }
  }

  // UTILITY FUNCTIONS
  static async getAllAdminUsers(): Promise<Array<{ id: string; email: string; role: string }>> {
    try {
      const { data, error } = await getServiceRoleClient()
        .from('admin_users')
        .select('id, email, role')
        .eq('is_active', true)
        .order('email');

      if (error) throw error;
      return data || [];
    } catch (error) {
      return [];
    }
  }

  static async markOverdueTasks(): Promise<void> {
    try {
      await getServiceRoleClient().rpc('mark_overdue_tasks');
    } catch (error) {
    }
  }

  // EMAIL FUNCTIONALITY
  static async sendDirectEmail(emailData: DirectEmailRequest, senderId: string): Promise<EmailResult> {
    try {
      // Use Supabase Edge Function for sending communications emails
      const { data, error } = await supabase.functions.invoke('send-communication-email', {
        body: {
          to_emails: emailData.to_emails,
          subject: emailData.subject,
          message: emailData.message,
          email_type: emailData.email_type,
          sender_name: emailData.sender_name || 'GDG@PSU Communications'
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to send emails');
      }

      // Log the email action
      try {
        await AuditService.logAction(
          senderId,
          'send_message',
          undefined,
          {
            description: `Sent direct email: ${emailData.subject}`,
            recipients_count: emailData.to_emails.length,
            email_type: emailData.email_type,
            subject: emailData.subject,
            sent: data?.total_sent || 0,
            failed: data?.total_failed || 0
          }
        );
      } catch (auditError) {
        // Continue execution even if audit logging fails
      }

      return {
        success: data?.success || false,
        total_sent: data?.total_sent || 0,
        total_failed: data?.total_failed || 0,
        results: data?.results || {
          successful: 0,
          failed: 0,
          failed_emails: []
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to send direct email'
      };
    }
  }

  static async sendAnnouncementEmail(
    announcementId: string, 
    customEmails?: string[], 
    senderId?: string
  ): Promise<EmailResult> {
    try {
      // Get announcement details
      const { data: announcement } = await getServiceRoleClient()
        .from('announcements')
        .select('*, author:admin_users!announcements_author_id_fkey(email, role)')
        .eq('id', announcementId)
        .single();

      if (!announcement) {
        throw new Error('Announcement not found');
      }

      // Get recipient emails
      let recipientEmails: string[] = [];
      
      if (customEmails && customEmails.length > 0) {
        recipientEmails = customEmails;
      } else {
        // Get all active admin users
        const { data: adminUsers } = await getServiceRoleClient()
          .from('admin_users')
          .select('email')
          .eq('is_active', true);
        
        recipientEmails = adminUsers?.map(user => user.email) || [];
      }

      if (recipientEmails.length === 0) {
        throw new Error('No recipients found');
      }

      // Send email
      const emailResult = await this.sendDirectEmail({
        to_emails: recipientEmails,
        subject: `[Announcement] ${announcement.title}`,
        message: `
          <h2>${announcement.title}</h2>
          <p><strong>Priority:</strong> ${announcement.priority.toUpperCase()}</p>
          <div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-left: 4px solid #007bff;">
            ${announcement.message.replace(/\n/g, '<br>')}
          </div>
          <p><small>Sent by: ${announcement.author?.email || 'Unknown'}</small></p>
          <p><small>This is an automated message from the GDG@PSU Communications Hub.</small></p>
        `,
        email_type: 'announcement',
        sender_name: 'GDG@PSU Communications'
      }, senderId || announcement.author_id);

      return emailResult;
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to send announcement email'
      };
    }
  }

  static async sendTaskNotificationEmail(
    taskId: string, 
    customEmails?: string[],
    senderId?: string
  ): Promise<EmailResult> {
    try {
      // Get task details
      const { data: task } = await getServiceRoleClient()
        .from('communication_tasks')
        .select(`
          *,
          assigned_to:admin_users!communication_tasks_assigned_to_id_fkey(email, role),
          assigned_by:admin_users!communication_tasks_assigned_by_id_fkey(email, role)
        `)
        .eq('id', taskId)
        .single();

      if (!task) {
        throw new Error('Task not found');
      }

      // Get recipient emails
      let recipientEmails: string[] = [];
      
      if (customEmails && customEmails.length > 0) {
        recipientEmails = customEmails;
      } else if (task.assigned_to?.email) {
        recipientEmails = [task.assigned_to.email];
      } else {
        // Get all active admin users as fallback
        const { data: adminUsers } = await getServiceRoleClient()
          .from('admin_users')
          .select('email')
          .eq('is_active', true);
        
        recipientEmails = adminUsers?.map(user => user.email) || [];
      }

      if (recipientEmails.length === 0) {
        throw new Error('No recipients found');
      }

      // Create task notification email
      const subject = `[Task] ${task.title}`;
      const messageContent = `
        <h2>Task Notification</h2>
        <p><strong>Task:</strong> ${task.title}</p>
        <p><strong>Status:</strong> ${task.status.split('-').join(' ').toUpperCase()}</p>
        <p><strong>Priority:</strong> ${task.priority.toUpperCase()}</p>
        ${task.due_date ? `<p><strong>Due Date:</strong> ${new Date(task.due_date).toLocaleDateString()}</p>` : ''}
        ${task.assigned_to?.email ? `<p><strong>Assigned to:</strong> ${task.assigned_to.email}</p>` : ''}
        <div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-left: 4px solid #007bff;">
          ${task.description?.replace(/\n/g, '<br>') || 'No description provided.'}
        </div>
        <p><small>Assigned by: ${task.assigned_by?.email || 'Unknown'}</small></p>
        <p><small>This is an automated message from the GDG@PSU Communications Hub.</small></p>
      `;

      // Send email
      const emailResult = await this.sendDirectEmail({
        to_emails: recipientEmails,
        subject,
        message: messageContent,
        email_type: 'task_notification',
        sender_name: 'GDG@PSU Task Manager'
      }, senderId || task.assigned_by_id);

      return emailResult;
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to send task notification email'
      };
    }
  }
}