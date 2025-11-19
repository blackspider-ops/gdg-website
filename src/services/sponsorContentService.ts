import { supabase } from '@/lib/supabase';

export interface SponsorshipTier {
  id: string;
  tier_name: string;
  tier_level: 'platinum' | 'gold' | 'silver' | 'bronze';
  amount: string;
  color_gradient: string;
  benefits: string[];
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ImpactStat {
  id: string;
  stat_label: string;
  stat_value: string;
  stat_description: string;
  icon_name: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class SponsorContentService {
  // SPONSORSHIP TIERS
  static async getAllTiers(): Promise<SponsorshipTier[]> {
    try {
      const { data, error } = await supabase
        .from('sponsorship_tiers')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching sponsorship tiers:', error);
      return [];
    }
  }

  static async getActiveTiers(): Promise<SponsorshipTier[]> {
    try {
      const { data, error } = await supabase
        .from('sponsorship_tiers')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching active tiers:', error);
      return [];
    }
  }

  static async createTier(tier: Omit<SponsorshipTier, 'id' | 'created_at' | 'updated_at'>): Promise<SponsorshipTier | null> {
    try {
      const { data, error } = await supabase
        .from('sponsorship_tiers')
        .insert(tier)
        .select();

      if (error) throw error;
      
      // Return the first item if data exists
      if (data && data.length > 0) {
        return data[0];
      }
      
      return null;
    } catch (error) {
      console.error('Error creating tier:', error);
      return null;
    }
  }

  static async updateTier(id: string, updates: Partial<SponsorshipTier>): Promise<SponsorshipTier | null> {
    try {
      const { data, error } = await supabase
        .from('sponsorship_tiers')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating tier:', error);
      return null;
    }
  }

  static async deleteTier(id: string, tierLevel: string): Promise<boolean> {
    try {
      // Determine the next lower tier
      const tierHierarchy = ['platinum', 'gold', 'silver', 'bronze'];
      const currentIndex = tierHierarchy.indexOf(tierLevel);
      const nextTier = currentIndex < tierHierarchy.length - 1 ? tierHierarchy[currentIndex + 1] : 'bronze';
      
      // Move all sponsors from this tier to the next lower tier
      const { error: updateError } = await supabase
        .from('sponsors')
        .update({ tier: nextTier })
        .eq('tier', tierLevel);
      
      if (updateError) {
        console.error('Error moving sponsors:', updateError);
        // Continue with deletion even if no sponsors to move
      }
      
      // Delete the tier
      const { error } = await supabase
        .from('sponsorship_tiers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting tier:', error);
      return false;
    }
  }

  // IMPACT STATS
  static async getAllStats(): Promise<ImpactStat[]> {
    try {
      const { data, error } = await supabase
        .from('sponsor_impact_stats')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching impact stats:', error);
      return [];
    }
  }

  static async getActiveStats(): Promise<ImpactStat[]> {
    try {
      const { data, error } = await supabase
        .from('sponsor_impact_stats')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching active stats:', error);
      return [];
    }
  }

  static async createStat(stat: Omit<ImpactStat, 'id' | 'created_at' | 'updated_at'>): Promise<ImpactStat | null> {
    try {
      const { data, error } = await supabase
        .from('sponsor_impact_stats')
        .insert(stat)
        .select();

      if (error) throw error;
      
      // Return the first item if data exists
      if (data && data.length > 0) {
        return data[0];
      }
      
      return null;
    } catch (error) {
      console.error('Error creating stat:', error);
      return null;
    }
  }

  static async updateStat(id: string, updates: Partial<ImpactStat>): Promise<ImpactStat | null> {
    try {
      const { data, error } = await supabase
        .from('sponsor_impact_stats')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating stat:', error);
      return null;
    }
  }

  static async deleteStat(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('sponsor_impact_stats')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting stat:', error);
      return false;
    }
  }
}
