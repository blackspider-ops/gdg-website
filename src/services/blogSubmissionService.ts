import { supabase } from '@/lib/supabase';

export interface BlogSubmission {
  id: string;
  file_path: string;
  original_name: string;
  submitter_name: string;
  submitter_email: string;
  file_size: number;
  mime_type: string;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BlogSubmissionComment {
  id: string;
  submission_id: string;
  admin_id: string;
  comment: string;
  comment_type: 'general' | 'feedback' | 'status_change' | 'internal';
  created_at: string;
  updated_at: string;
  admin_users?: {
    email: string;
    role: string;
  };
}

export class BlogSubmissionService {
  /**
   * Upload a blog submission file to the dedicated blog-submissions bucket
   */
  static async uploadBlogSubmission(
    file: File,
    submitterName: string,
    submitterEmail: string
  ): Promise<{ id: string; file_path: string; original_name: string } | null> {
    try {
      // Validate file size (50MB limit)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        throw new Error('File size exceeds 50MB limit');
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = fileName;

      // Upload file to the blog-submissions bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('blog-submissions')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      if (!uploadData) {
        throw new Error('Upload returned no data');
      }

      // Create database record for tracking
      const { data: submissionData, error: dbError } = await supabase
        .from('blog_submissions')
        .insert({
          file_path: uploadData.path,
          original_name: file.name,
          submitter_name: submitterName,
          submitter_email: submitterEmail,
          file_size: file.size,
          mime_type: file.type,
          status: 'pending'
        })
        .select('id')
        .single();

      if (dbError) {
        // Clean up uploaded file if database insert fails
        await supabase.storage.from('blog-submissions').remove([uploadData.path]);
        throw dbError;
      }

      return {
        id: submissionData.id,
        file_path: uploadData.path,
        original_name: file.name
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Get file from blog-submissions bucket
   */
  static async getSubmissionFile(filePath: string): Promise<Blob | null> {
    try {
      const { data, error } = await supabase.storage
        .from('blog-submissions')
        .download(filePath);

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get all blog submissions (admin only)
   */
  static async getAllSubmissions(): Promise<BlogSubmission[]> {
    try {
      const { data, error } = await supabase
        .from('blog_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Update submission notes (admin only)
   */
  static async updateSubmissionStatus(
    id: string,
    status: BlogSubmission['status'],
    adminNotes?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('blog_submissions')
        .update({
          status,
          admin_notes: adminNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Delete submission and file (admin only)
   */
  static async deleteSubmission(id: string): Promise<boolean> {
    try {
      // Get submission data first
      const { data: submission, error: fetchError } = await supabase
        .from('blog_submissions')
        .select('file_path')
        .eq('id', id)
        .single();

      if (submission && !fetchError) {
        // Delete file from storage
        await supabase.storage
          .from('blog-submissions')
          .remove([submission.file_path]);
      }

      // Delete database record
      const { error } = await supabase
        .from('blog_submissions')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get comments for a blog submission
   */
  static async getSubmissionComments(submissionId: string): Promise<BlogSubmissionComment[]> {
    try {
      const { data, error } = await supabase
        .from('blog_submission_comments')
        .select(`
          *,
          admin_users (
            email,
            role
          )
        `)
        .eq('submission_id', submissionId)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching submission comments:', error);
      return [];
    }
  }

  /**
   * Add a comment to a blog submission
   */
  static async addSubmissionComment(
    submissionId: string,
    adminId: string,
    comment: string,
    commentType: BlogSubmissionComment['comment_type'] = 'general'
  ): Promise<BlogSubmissionComment | null> {
    try {
      const { data, error } = await supabase
        .from('blog_submission_comments')
        .insert({
          submission_id: submissionId,
          admin_id: adminId,
          comment,
          comment_type: commentType
        })
        .select(`
          *,
          admin_users (
            email,
            role
          )
        `)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error adding submission comment:', error);
      return null;
    }
  }

  /**
   * Update a comment (only by the author)
   */
  static async updateSubmissionComment(
    commentId: string,
    comment: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('blog_submission_comments')
        .update({ comment })
        .eq('id', commentId);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error updating submission comment:', error);
      return false;
    }
  }

  /**
   * Delete a comment (super admin only)
   */
  static async deleteSubmissionComment(commentId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('blog_submission_comments')
        .delete()
        .eq('id', commentId);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error deleting submission comment:', error);
      return false;
    }
  }

  /**
   * Update submission status with automatic comment
   */
  static async updateSubmissionStatusWithComment(
    id: string,
    status: BlogSubmission['status'],
    adminId: string,
    adminNotes?: string
  ): Promise<boolean> {
    try {
      // Update the submission status
      const { error: updateError } = await supabase
        .from('blog_submissions')
        .update({
          status,
          admin_notes: adminNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }

      // Add a status change comment
      const statusComment = `Status changed to: ${status.charAt(0).toUpperCase() + status.slice(1)}${adminNotes ? `\n\nNotes: ${adminNotes}` : ''}`;
      
      await this.addSubmissionComment(
        id,
        adminId,
        statusComment,
        'status_change'
      );

      return true;
    } catch (error) {
      console.error('Error updating submission status:', error);
      return false;
    }
  }
}