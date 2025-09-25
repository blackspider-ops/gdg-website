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
  static async createPost(post: Omit<BlogPost, 'id' | 'created_at' | 'updated_at' | 'category'>): Promise<BlogPost | null> {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .insert(post)
        .select()
        .single();

      if (error) {
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
  static async updatePost(id: string, updates: Partial<BlogPost>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .update(updates)
        .eq('id', id);

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return true;
    } catch (error) {
      throw error;
    }
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
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
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
}