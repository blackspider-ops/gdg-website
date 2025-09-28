import { supabase } from '@/lib/supabase';

export interface BlogComment {
  id: string;
  post_id: string;
  author_name: string;
  author_email: string;
  content: string;
  is_approved: boolean;
  is_flagged: boolean;
  parent_comment_id?: string;
  created_at: string;
  updated_at: string;
  replies?: BlogComment[];
}

export interface CreateCommentData {
  post_id: string;
  author_name: string;
  author_email: string;
  content: string;
  parent_comment_id?: string;
}

export class BlogCommentsService {
  /**
   * Get approved comments for a blog post
   */
  static async getComments(blogPostId: string): Promise<BlogComment[]> {
    try {
      const { data, error } = await supabase
        .from('blog_comments')
        .select('*')
        .eq('post_id', blogPostId)
        .eq('is_approved', true)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Organize comments into a tree structure (parent comments with replies)
      const comments = data || [];
      const commentMap = new Map<string, BlogComment>();
      const rootComments: BlogComment[] = [];

      // First pass: create comment objects
      comments.forEach(comment => {
        commentMap.set(comment.id, { ...comment, replies: [] });
      });

      // Second pass: organize into tree structure
      comments.forEach(comment => {
        const commentObj = commentMap.get(comment.id)!;
        
        if (comment.parent_comment_id) {
          // This is a reply
          const parentComment = commentMap.get(comment.parent_comment_id);
          if (parentComment) {
            parentComment.replies!.push(commentObj);
          }
        } else {
          // This is a root comment
          rootComments.push(commentObj);
        }
      });

      return rootComments;
    } catch (error) {
      return [];
    }
  }

  /**
   * Create a new comment (starts as unapproved)
   */
  static async createComment(commentData: CreateCommentData): Promise<BlogComment | null> {
    try {
      // Validate input
      if (!commentData.author_name.trim() || commentData.author_name.length > 100) {
        throw new Error('Author name must be between 1 and 100 characters');
      }

      if (!commentData.author_email.trim() || !this.isValidEmail(commentData.author_email)) {
        throw new Error('Please provide a valid email address');
      }

      if (!commentData.content.trim() || commentData.content.length > 2000) {
        throw new Error('Comment must be between 1 and 2000 characters');
      }

      // Clean the content (basic sanitization)
      const cleanContent = this.sanitizeContent(commentData.content);

      const insertData = {
        post_id: commentData.post_id,
        author_name: commentData.author_name.trim(),
        author_email: commentData.author_email.trim().toLowerCase(),
        content: cleanContent,
        parent_comment_id: commentData.parent_comment_id || null,
        is_approved: false,
        is_flagged: false
      };

      const { data, error } = await supabase
        .from('blog_comments')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      // Send email notification for new comment (optional - don't block comment creation)
      if (data) {
        // Run email notification in background without blocking
        this.sendCommentNotification(data).catch(() => {
          // Email notification failed, but comment was created successfully
        });
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Send email notification for new comment
   */
  private static async sendCommentNotification(comment: BlogComment): Promise<void> {
    try {
      // Get blog post details
      const { data: blogPost, error: postError } = await supabase
        .from('blog_posts')
        .select('title, slug')
        .eq('id', comment.post_id)
        .single();

      if (postError || !blogPost) {
        throw new Error('Could not fetch blog post details');
      }

      // Call the Edge Function
      const { error: functionError } = await supabase.functions.invoke('send-comment-notification', {
        body: {
          comment_id: comment.id,
          blog_post_title: blogPost.title,
          blog_post_slug: blogPost.slug,
          author_name: comment.author_name,
          author_email: comment.author_email,
          comment_content: comment.content
        }
      });

      if (functionError) {
        throw functionError;
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all comments for admin management (including unapproved)
   */
  static async getAllComments(filters?: {
    blogPostId?: string;
    isApproved?: boolean;
    isFlagged?: boolean;
  }): Promise<BlogComment[]> {
    try {
      let query = supabase
        .from('blog_comments')
        .select(`
          *,
          blog_post:blog_posts(title, slug)
        `)
        .order('created_at', { ascending: false });

      if (filters?.blogPostId) {
        query = query.eq('post_id', filters.blogPostId);
      }

      if (filters?.isApproved !== undefined) {
        query = query.eq('is_approved', filters.isApproved);
      }

      if (filters?.isFlagged !== undefined) {
        query = query.eq('is_flagged', filters.isFlagged);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Approve a comment
   */
  static async approveComment(commentId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('blog_comments')
        .update({ 
          is_approved: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId);

      if (error) throw error;
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Reject/unapprove a comment
   */
  static async rejectComment(commentId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('blog_comments')
        .update({ 
          is_approved: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId);

      if (error) throw error;
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Flag a comment as inappropriate
   */
  static async flagComment(commentId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('blog_comments')
        .update({ 
          is_flagged: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId);

      if (error) throw error;
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Delete a comment
   */
  static async deleteComment(commentId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('blog_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get comment statistics
   */
  static async getCommentStats(): Promise<{
    total: number;
    approved: number;
    pending: number;
    flagged: number;
  }> {
    try {
      const [totalResult, approvedResult, pendingResult, flaggedResult] = await Promise.all([
        supabase.from('blog_comments').select('id', { count: 'exact' }),
        supabase.from('blog_comments').select('id', { count: 'exact' }).eq('is_approved', true),
        supabase.from('blog_comments').select('id', { count: 'exact' }).eq('is_approved', false),
        supabase.from('blog_comments').select('id', { count: 'exact' }).eq('is_flagged', true)
      ]);

      return {
        total: totalResult.count || 0,
        approved: approvedResult.count || 0,
        pending: pendingResult.count || 0,
        flagged: flaggedResult.count || 0
      };
    } catch (error) {
      return { total: 0, approved: 0, pending: 0, flagged: 0 };
    }
  }

  /**
   * Validate email format
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    return emailRegex.test(email);
  }

  /**
   * Basic content sanitization
   */
  private static sanitizeContent(content: string): string {
    // Remove potentially harmful HTML tags and scripts
    return content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
      .replace(/<link\b[^<]*>/gi, '')
      .replace(/<meta\b[^<]*>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }
}