import { supabase } from '@/lib/supabase';

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  is_active: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featured_image_url?: string;
  author_name: string;
  author_email?: string;
  author_avatar_url?: string;
  category_id?: string;
  category?: BlogCategory;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  is_featured: boolean;
  read_time_minutes: number;
  views_count: number;
  likes_count: number;
  published_at?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  requires_approval?: boolean;
  approval_status?: 'pending' | 'approved' | 'rejected';
  pending_changes?: string;
  change_summary?: string;
  rejection_reason?: string;
}

export interface BlogComment {
  id: string;
  post_id: string;
  author_name: string;
  author_email: string;
  content: string;
  is_approved: boolean;
  parent_id?: string;
  created_at: string;
  updated_at: string;
}

export class BlogService {
  /**
   * Get all blog categories
   */
  static async getCategories(): Promise<BlogCategory[]> {
    try {
      const { data, error } = await supabase
        .from('blog_categories')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) {
        return [];
      }

      return data || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get all categories for admin (including inactive)
   */
  static async getAllCategories(): Promise<BlogCategory[]> {
    try {
      const { data, error } = await supabase
        .from('blog_categories')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) {
        return [];
      }

      return data || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Create a new blog category
   */
  static async createCategory(category: Omit<BlogCategory, 'id' | 'created_at' | 'updated_at'>): Promise<BlogCategory | null> {
    try {
      const { data, error } = await supabase
        .from('blog_categories')
        .insert(category)
        .select()
        .single();

      if (error) {
        return null;
      }

      return data;
    } catch (error) {
      return null;
    }
  }

  /**
   * Update a blog category
   */
  static async updateCategory(id: string, updates: Partial<BlogCategory>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('blog_categories')
        .update(updates)
        .eq('id', id);

      if (error) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Delete a blog category
   */
  static async deleteCategory(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('blog_categories')
        .delete()
        .eq('id', id);

      if (error) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get published blog posts for public view
   */
  static async getPublishedPosts(limit?: number): Promise<BlogPost[]> {
    try {
      let query = supabase
        .from('blog_posts')
        .select(`
          *,
          category:blog_categories(*)
        `)
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        return [];
      }

      return data || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get all blog posts for admin
   */
  static async getAllPosts(): Promise<BlogPost[]> {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          category:blog_categories(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        return [];
      }

      return data || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get a single blog post by slug
   */
  static async getPostBySlug(slug: string): Promise<BlogPost | null> {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          category:blog_categories(*)
        `)
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (error) {
        return null;
      }

      return data;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get a single blog post by ID (admin)
   */
  static async getPostById(id: string): Promise<BlogPost | null> {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          category:blog_categories(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        return null;
      }

      return data;
    } catch (error) {
      return null;
    }
  }

  /**
   * Create a new blog post
   */
  static async createPost(post: Omit<BlogPost, 'id' | 'created_at' | 'updated_at' | 'category'>, adminRole?: string): Promise<BlogPost | null> {
    try {
      // Use the post data as-is since BlogPostModal already sets approval status correctly
      const postData = {
        ...post,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Creating post with data:', postData);
      
      const { data, error } = await supabase
        .from('blog_posts')
        .insert(postData)
        .select()
        .single();

      if (error) {
        console.error('Database insert error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update a blog post
   */
  static async updatePost(id: string, updates: Partial<BlogPost>, adminRole?: string, adminId?: string): Promise<boolean> {
    try {
      // Get original post for change tracking
      const { data: originalPost } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', id)
        .single();

      const isBlogEditor = adminRole === 'blog_editor';
      
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
        // Blog editors: all updates require approval
        requires_approval: isBlogEditor ? true : updates.requires_approval,
        approval_status: isBlogEditor ? 'pending' : updates.approval_status || 'approved'
      };

      // Track changes for blog editors
      if (isBlogEditor && originalPost) {
        const changes = this.trackChanges(originalPost, updateData);
        updateData.pending_changes = JSON.stringify(changes);
        updateData.change_summary = this.generateChangeSummary(changes);
      }

      console.log('Updating post with data:', updateData);
      
      const { error } = await supabase
        .from('blog_posts')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Database update error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Track changes between original and updated post
   */
  private static trackChanges(original: any, updated: any): any {
    const changes: any = {};
    const fieldsToTrack = ['title', 'content', 'excerpt', 'category_id', 'tags', 'featured_image_url'];
    
    fieldsToTrack.forEach(field => {
      if (JSON.stringify(original[field]) !== JSON.stringify(updated[field])) {
        changes[field] = {
          from: original[field],
          to: updated[field]
        };
      }
    });
    
    return changes;
  }

  /**
   * Generate human-readable change summary
   */
  private static generateChangeSummary(changes: any): string {
    const summaries = [];
    
    if (changes.title) summaries.push('Title changed');
    if (changes.content) summaries.push('Content modified');
    if (changes.excerpt) summaries.push('Excerpt updated');
    if (changes.category_id) summaries.push('Category changed');
    if (changes.tags) summaries.push('Tags modified');
    if (changes.featured_image_url) summaries.push('Featured image changed');
    
    return summaries.join(', ') || 'Post updated';
  }

  /**
   * Delete a blog post
   */
  static async deletePost(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);

      if (error) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Increment view count for a blog post
   */
  static async incrementViews(id: string): Promise<boolean> {
    try {
      // First get the current post to get the current view count
      const { data: currentPost, error: fetchError } = await supabase
        .from('blog_posts')
        .select('views_count')
        .eq('id', id)
        .single();

      if (fetchError) {
        return false;
      }

      // Increment the view count
      const newViewCount = (currentPost.views_count || 0) + 1;
      
      const { error } = await supabase
        .from('blog_posts')
        .update({ views_count: newViewCount })
        .eq('id', id);

      if (error) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate slug from title
   */
  static generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  /**
   * Calculate read time based on content
   */
  static calculateReadTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  /**
   * Get blog statistics
   */
  static async getBlogStats(): Promise<{
    totalPosts: number;
    publishedPosts: number;
    draftPosts: number;
    totalViews: number;
    totalLikes: number;
    totalCategories: number;
  }> {
    try {
      const [postsResult, statsResult, categoriesResult] = await Promise.all([
        supabase.from('blog_posts').select('status', { count: 'exact' }),
        supabase.from('blog_posts').select('views_count, likes_count'),
        supabase.from('blog_categories').select('id', { count: 'exact' })
      ]);

      const posts = postsResult.data || [];
      const totalPosts = postsResult.count || 0;
      const publishedPosts = posts.filter(p => p.status === 'published').length;
      const draftPosts = posts.filter(p => p.status === 'draft').length;
      
      const statsData = statsResult.data || [];
      const totalViews = statsData.reduce((sum, post) => sum + (post.views_count || 0), 0);
      const totalLikes = statsData.reduce((sum, post) => sum + (post.likes_count || 0), 0);
      const totalCategories = categoriesResult.count || 0;

      return {
        totalPosts,
        publishedPosts,
        draftPosts,
        totalViews,
        totalLikes,
        totalCategories
      };
    } catch (error) {
      return {
        totalPosts: 0,
        publishedPosts: 0,
        draftPosts: 0,
        totalViews: 0,
        totalLikes: 0,
        totalCategories: 0
      };
    }
  }

  /**
   * Get count of blog posts pending approval
   */
  static async getPendingApprovalsCount(): Promise<number> {
    try {
      const { count } = await supabase
        .from('blog_posts')
        .select('*', { count: 'exact', head: true })
        .eq('requires_approval', true)
        .eq('approval_status', 'pending');

      return count || 0;
    } catch (error) {
      console.error('Error getting pending approvals count:', error);
      return 0;
    }
  }



  /**
   * Reject a blog post (admin only)
   */
  static async rejectPost(id: string, reason?: string): Promise<boolean> {
    try {
      const updateData = {
        approval_status: 'rejected' as const,
        rejection_reason: reason || null,
        requires_approval: false, // Clear the approval requirement
        updated_at: new Date().toISOString()
      };
      
      console.log('Rejecting post with data:', updateData);
      
      const { error } = await supabase
        .from('blog_posts')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Database rejection error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error rejecting post:', error);
      return false;
    }
  }

  /**
   * Generate a user identifier for like tracking
   * In a real app, this would use actual user authentication
   * For now, we'll use a combination of browser fingerprint and localStorage
   */
  static getUserIdentifier(): string {
    // Try to get existing identifier from localStorage
    let identifier = localStorage.getItem('gdg_user_identifier');
    
    if (!identifier) {
      // Generate a unique identifier based on browser characteristics
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx!.textBaseline = 'top';
      ctx!.font = '14px Arial';
      ctx!.fillText('GDG User Fingerprint', 2, 2);
      
      const fingerprint = canvas.toDataURL();
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2);
      
      identifier = btoa(`${fingerprint.slice(-50)}_${timestamp}_${random}`).substring(0, 32);
      localStorage.setItem('gdg_user_identifier', identifier);
    }
    
    return identifier;
  }

  /**
   * Check if user has already liked a post
   */
  static async hasUserLikedPost(postId: string, userIdentifier?: string): Promise<boolean> {
    try {
      const identifier = userIdentifier || this.getUserIdentifier();
      
      const { data, error } = await supabase
        .from('blog_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_identifier', identifier)
        .maybeSingle();

      if (error) {
        return false;
      }

      return !!data;
    } catch (error) {
      return false;
    }
  }

  /**
   * Toggle like for a blog post (like if not liked, unlike if already liked)
   */
  static async toggleLike(postId: string): Promise<{ success: boolean; isLiked: boolean; newCount: number }> {
    try {
      const userIdentifier = this.getUserIdentifier();
      const hasLiked = await this.hasUserLikedPost(postId, userIdentifier);

      if (hasLiked) {
        // Unlike the post
        const { error: deleteError } = await supabase
          .from('blog_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_identifier', userIdentifier);

        if (deleteError) {
          return { success: false, isLiked: true, newCount: 0 };
        }
      } else {
        // Like the post
        const { error: insertError } = await supabase
          .from('blog_likes')
          .insert({
            post_id: postId,
            user_identifier: userIdentifier
          });

        if (insertError) {
          return { success: false, isLiked: false, newCount: 0 };
        }
      }

      // Get the new like count
      const { data: likesData, error: countError } = await supabase
        .from('blog_likes')
        .select('id', { count: 'exact' })
        .eq('post_id', postId);

      if (countError) {
        return { success: false, isLiked: !hasLiked, newCount: 0 };
      }

      const newCount = likesData?.length || 0;

      // Update the blog post's like count
      const { error: updateError } = await supabase
        .from('blog_posts')
        .update({ likes_count: newCount })
        .eq('id', postId);

      if (updateError) {
        // Silently handle update errors
      }

      return { 
        success: true, 
        isLiked: !hasLiked, 
        newCount 
      };
    } catch (error) {
      return { success: false, isLiked: false, newCount: 0 };
    }
  }

  /**
   * Get like count for a post
   */
  static async getLikeCount(postId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('blog_likes')
        .select('id', { count: 'exact' })
        .eq('post_id', postId);

      if (error) {
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get posts pending approval
   */
  static async getPostsPendingApproval(): Promise<BlogPost[]> {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          category:blog_categories(*)
        `)
        .eq('requires_approval', true)
        .order('created_at', { ascending: false });

      if (error) {
        return [];
      }

      return data || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get posts by editor (for blog editor dashboard)
   */
  static async getPostsByEditor(editorEmail: string): Promise<BlogPost[]> {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          category:blog_categories(*)
        `)
        .eq('author_email', editorEmail)
        .order('created_at', { ascending: false });

      if (error) {
        return [];
      }

      return data || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get pending requests by editor
   */
  static async getPendingRequestsByEditor(editorEmail: string): Promise<BlogPost[]> {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          category:blog_categories(*)
        `)
        .eq('author_email', editorEmail)
        .eq('requires_approval', true)
        .in('approval_status', ['pending', 'rejected'])
        .order('created_at', { ascending: false });

      if (error) {
        return [];
      }

      return data || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get completed requests by editor (approved posts)
   */
  static async getCompletedRequestsByEditor(editorEmail: string): Promise<BlogPost[]> {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          category:blog_categories(*)
        `)
        .eq('author_email', editorEmail)
        .eq('approval_status', 'approved')
        .order('created_at', { ascending: false });

      if (error) {
        return [];
      }

      return data || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get requests by editor with filter
   */
  static async getRequestsByEditor(editorEmail: string, filter: 'pending' | 'rejected' | 'completed' | 'all' = 'pending'): Promise<BlogPost[]> {
    try {
      let query = supabase
        .from('blog_posts')
        .select(`
          *,
          category:blog_categories(*)
        `)
        .eq('author_email', editorEmail);

      if (filter === 'pending') {
        query = query.eq('requires_approval', true).eq('approval_status', 'pending');
      } else if (filter === 'rejected') {
        query = query.eq('approval_status', 'rejected');
      } else if (filter === 'completed') {
        query = query.eq('approval_status', 'approved');
      }
      // For 'all', no additional filters needed

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        return [];
      }

      return data || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Approve a blog post (admin only)
   */
  static async approvePost(id: string, adminId?: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .update({ 
          requires_approval: false,
          approval_status: 'approved' as const,
          status: 'published',
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Error approving post:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error approving post:', error);
      return false;
    }
  }



  /**
   * Sync blog post like counts with the blog_likes table
   * This is useful for migrating from the old system to the new authentic system
   */
  static async syncLikeCounts(): Promise<void> {
    try {
      // Get all blog posts
      const { data: posts, error: postsError } = await supabase
        .from('blog_posts')
        .select('id');

      if (postsError) {
        return;
      }

      // Update each post's like count based on blog_likes table
      for (const post of posts || []) {
        const actualCount = await this.getLikeCount(post.id);
        
        await supabase
          .from('blog_posts')
          .update({ likes_count: actualCount })
          .eq('id', post.id);
      }
    } catch (error) {
      // Silently handle sync errors
    }
  }

  /**
   * Get comprehensive blog analytics
   */
  static async getAnalytics(timeRange: '7d' | '30d' | '90d' | '1y' = '30d'): Promise<{
    totalPosts: number;
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    avgReadTime: number;
    publishedPosts: number;
    draftPosts: number;
    archivedPosts: number;
    topPosts: Array<{
      id: string;
      title: string;
      views: number;
      likes: number;
      published_at: string;
    }>;
    categoryStats: Array<{
      name: string;
      count: number;
      views: number;
      color: string;
    }>;
    monthlyStats: Array<{
      month: string;
      posts: number;
      views: number;
      likes: number;
    }>;
    recentActivity: Array<{
      type: 'view' | 'like' | 'publish';
      post_title: string;
      timestamp: string;
      count?: number;
    }>;
  }> {
    try {
      // Calculate date range
      const now = new Date();
      const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
      const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

      // Get all posts with categories
      const { data: allPosts, error: postsError } = await supabase
        .from('blog_posts')
        .select(`
          *,
          category:blog_categories(*)
        `)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      const posts = allPosts || [];

      // Calculate basic stats
      const totalPosts = posts.length;
      const publishedPosts = posts.filter(p => p.status === 'published').length;
      const draftPosts = posts.filter(p => p.status === 'draft').length;
      const archivedPosts = posts.filter(p => p.status === 'archived').length;
      const totalViews = posts.reduce((sum, post) => sum + (post.views_count || 0), 0);
      const totalLikes = posts.reduce((sum, post) => sum + (post.likes_count || 0), 0);
      const avgReadTime = posts.length > 0 
        ? Math.round(posts.reduce((sum, post) => sum + (post.read_time_minutes || 0), 0) / posts.length)
        : 0;

      // Get top performing posts
      const topPosts = posts
        .filter(p => p.status === 'published')
        .sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
        .slice(0, 10)
        .map(post => ({
          id: post.id,
          title: post.title,
          views: post.views_count || 0,
          likes: post.likes_count || 0,
          published_at: post.published_at || post.created_at
        }));

      // Get category stats
      const categoryMap = new Map();
      posts.forEach(post => {
        if (post.category) {
          const existing = categoryMap.get(post.category.id) || {
            name: post.category.name,
            count: 0,
            views: 0,
            color: post.category.color
          };
          existing.count++;
          existing.views += post.views_count || 0;
          categoryMap.set(post.category.id, existing);
        }
      });
      const categoryStats = Array.from(categoryMap.values());

      // Generate monthly stats for the last 12 months
      const monthlyStats = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        const monthPosts = posts.filter(post => {
          const postDate = new Date(post.created_at);
          return postDate >= monthStart && postDate <= monthEnd;
        });

        monthlyStats.push({
          month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          posts: monthPosts.length,
          views: monthPosts.reduce((sum, post) => sum + (post.views_count || 0), 0),
          likes: monthPosts.reduce((sum, post) => sum + (post.likes_count || 0), 0)
        });
      }

      // Generate recent activity (mock data for now - in a real app you'd track this)
      const recentActivity = posts
        .filter(p => p.status === 'published')
        .slice(0, 10)
        .map(post => ({
          type: 'publish' as const,
          post_title: post.title,
          timestamp: post.published_at || post.created_at,
          count: post.views_count
        }));

      return {
        totalPosts,
        totalViews,
        totalLikes,
        totalComments: 0, // TODO: Implement comments
        avgReadTime,
        publishedPosts,
        draftPosts,
        archivedPosts,
        topPosts,
        categoryStats,
        monthlyStats,
        recentActivity
      };
    } catch (error) {
      console.error('Failed to get blog analytics:', error);
      return {
        totalPosts: 0,
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
        avgReadTime: 0,
        publishedPosts: 0,
        draftPosts: 0,
        archivedPosts: 0,
        topPosts: [],
        categoryStats: [],
        monthlyStats: [],
        recentActivity: []
      };
    }
  }

  /**
   * Get engagement metrics for a specific post
   */
  static async getPostEngagement(postId: string): Promise<{
    views: number;
    likes: number;
    engagementRate: number;
    likeRate: number;
    viewsToday: number;
    likesToday: number;
  }> {
    try {
      const { data: post, error } = await supabase
        .from('blog_posts')
        .select('views_count, likes_count')
        .eq('id', postId)
        .single();

      if (error) throw error;

      const views = post.views_count || 0;
      const likes = post.likes_count || 0;
      const engagementRate = views > 0 ? (likes / views) * 100 : 0;
      const likeRate = views > 0 ? (likes / views) * 100 : 0;

      // TODO: Implement daily tracking for viewsToday and likesToday
      const viewsToday = 0;
      const likesToday = 0;

      return {
        views,
        likes,
        engagementRate: Math.round(engagementRate * 100) / 100,
        likeRate: Math.round(likeRate * 100) / 100,
        viewsToday,
        likesToday
      };
    } catch (error) {
      return {
        views: 0,
        likes: 0,
        engagementRate: 0,
        likeRate: 0,
        viewsToday: 0,
        likesToday: 0
      };
    }
  }

  /**
   * Get trending posts based on recent engagement
   */
  static async getTrendingPosts(limit: number = 5): Promise<BlogPost[]> {
    try {
      // For now, sort by a combination of views and likes
      // In a real app, you'd want to weight recent activity more heavily
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          category:blog_categories(*)
        `)
        .eq('status', 'published')
        .order('views_count', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      return [];
    }
  }
}