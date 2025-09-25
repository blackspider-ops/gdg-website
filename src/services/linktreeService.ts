import { supabase } from '@/lib/supabase';

export interface LinktreeProfile {
  id: string;
  username: string;
  display_name: string;
  bio?: string;
  avatar_url?: string;
  background_type: 'color' | 'gradient' | 'image';
  background_value: string;
  theme: 'light' | 'dark' | 'auto';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LinktreeLink {
  id: string;
  profile_id: string;
  title: string;
  url: string;
  description?: string;
  icon_type: 'link' | 'social' | 'custom';
  icon_value?: string;
  button_style: 'default' | 'outline' | 'filled' | 'minimal';
  button_color: string;
  text_color: string;
  is_active: boolean;
  sort_order: number;
  click_count: number;
  created_at: string;
  updated_at: string;
}

export interface LinktreeAnalytics {
  id: string;
  profile_id: string;
  link_id?: string;
  visitor_ip?: string;
  user_agent?: string;
  referrer?: string;
  country?: string;
  city?: string;
  clicked_at: string;
}

class LinktreeService {
  // Profile methods
  async getProfile(username: string): Promise<LinktreeProfile | null> {
    const { data, error } = await supabase
      .from('linktree_profiles')
      .select('*')
      .eq('username', username)
      .eq('is_active', true)
      .single();

    if (error) {
      return null;
    }

    return data;
  }

  async getAllProfiles(): Promise<LinktreeProfile[]> {
    const { data, error } = await supabase
      .from('linktree_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return [];
    }

    return data || [];
  }

  async createProfile(profile: Omit<LinktreeProfile, 'id' | 'created_at' | 'updated_at'>): Promise<LinktreeProfile | null> {
    const { data, error } = await supabase
      .from('linktree_profiles')
      .insert(profile)
      .select()
      .single();

    if (error) {
      return null;
    }

    return data;
  }

  async updateProfile(id: string, updates: Partial<LinktreeProfile>): Promise<LinktreeProfile | null> {
    const { data, error } = await supabase
      .from('linktree_profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return null;
    }

    return data;
  }

  async deleteProfile(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('linktree_profiles')
      .delete()
      .eq('id', id);

    if (error) {
      return false;
    }

    return true;
  }

  // Link methods
  async getProfileLinks(profileId: string): Promise<LinktreeLink[]> {
    const { data, error } = await supabase
      .from('linktree_links')
      .select('*')
      .eq('profile_id', profileId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      return [];
    }

    return data || [];
  }

  async createLink(link: Omit<LinktreeLink, 'id' | 'created_at' | 'updated_at' | 'click_count'>): Promise<LinktreeLink | null> {
    const { data, error } = await supabase
      .from('linktree_links')
      .insert(link)
      .select()
      .single();

    if (error) {
      return null;
    }

    return data;
  }

  async updateLink(id: string, updates: Partial<LinktreeLink>): Promise<LinktreeLink | null> {
    const { data, error } = await supabase
      .from('linktree_links')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return null;
    }

    return data;
  }

  async deleteLink(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('linktree_links')
      .delete()
      .eq('id', id);

    if (error) {
      return false;
    }

    return true;
  }

  async reorderLinks(profileId: string, linkIds: string[]): Promise<boolean> {
    try {
      const updates = linkIds.map((id, index) => ({
        id,
        sort_order: index + 1
      }));

      for (const update of updates) {
        await supabase
          .from('linktree_links')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id)
          .eq('profile_id', profileId);
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  // Analytics methods
  async trackClick(profileId: string, linkId?: string, metadata?: Partial<LinktreeAnalytics>): Promise<void> {
    try {
      await supabase
        .from('linktree_analytics')
        .insert({
          profile_id: profileId,
          link_id: linkId,
          ...metadata
        });

      // Increment click count for the link
      if (linkId) {
        await supabase.rpc('increment_link_clicks', { link_id: linkId });
      }
    } catch (error) {
      // Silently handle tracking errors
    }
  }

  async getAnalytics(profileId: string, days: number = 30): Promise<LinktreeAnalytics[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('linktree_analytics')
      .select('*')
      .eq('profile_id', profileId)
      .gte('clicked_at', startDate.toISOString())
      .order('clicked_at', { ascending: false });

    if (error) {
      return [];
    }

    return data || [];
  }

  async getLinkAnalytics(linkId: string, days: number = 30): Promise<LinktreeAnalytics[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('linktree_analytics')
      .select('*')
      .eq('link_id', linkId)
      .gte('clicked_at', startDate.toISOString())
      .order('clicked_at', { ascending: false });

    if (error) {
      return [];
    }

    return data || [];
  }
}

export const linktreeService = new LinktreeService();