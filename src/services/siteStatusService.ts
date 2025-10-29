import { supabase } from '@/lib/supabase';

export interface SiteStatus {
  id: string;
  is_live: boolean;
  redirect_url: string;
  message?: string;
  created_at: string;
  updated_at: string;
}

class SiteStatusService {
  private static readonly CACHE_KEY = 'site_status';
  private static cache: SiteStatus | null = null;
  private static cacheExpiry: number = 0;
  private static readonly CACHE_DURATION = 30000; // 30 seconds

  // Get current site status with caching
  static async getSiteStatus(): Promise<SiteStatus | null> {
    const now = Date.now();
    
    // Return cached data if still valid
    if (this.cache && now < this.cacheExpiry) {
      return this.cache;
    }

    try {
      const { data, error } = await supabase
        .from('site_status')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching site status:', error);
        return null;
      }

      // Update cache
      this.cache = data;
      this.cacheExpiry = now + this.CACHE_DURATION;

      return data;
    } catch (error) {
      console.error('Error in getSiteStatus:', error);
      return null;
    }
  }

  // Update site status (admin only)
  static async updateSiteStatus(updates: {
    is_live: boolean;
    redirect_url?: string;
    message?: string;
  }): Promise<SiteStatus | null> {
    try {
      // First, try to get existing record
      const { data: existing } = await supabase
        .from('site_status')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      let result;

      if (existing) {
        // Update existing record
        const { data, error } = await supabase
          .from('site_status')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Create new record
        const { data, error } = await supabase
          .from('site_status')
          .insert({
            ...updates,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      // Clear cache to force refresh
      this.cache = null;
      this.cacheExpiry = 0;

      return result;
    } catch (error) {
      console.error('Error updating site status:', error);
      return null;
    }
  }

  // Check if site should redirect (for non-linktree pages)
  static async shouldRedirect(currentPath: string): Promise<{
    shouldRedirect: boolean;
    redirectUrl?: string;
    message?: string;
  }> {
    // Never redirect linktree pages or admin pages
    if (currentPath.startsWith('/l/') || currentPath.startsWith('/admin')) {
      return { shouldRedirect: false };
    }

    const status = await this.getSiteStatus();
    
    if (!status || status.is_live) {
      return { shouldRedirect: false };
    }

    return {
      shouldRedirect: true,
      redirectUrl: status.redirect_url,
      message: status.message
    };
  }

  // Clear cache (useful for testing)
  static clearCache(): void {
    this.cache = null;
    this.cacheExpiry = 0;
  }
}

export { SiteStatusService };