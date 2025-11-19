import { supabase } from '@/lib/supabase';

export interface Sponsor {
  id: string;
  name: string;
  logo_url: string;
  website_url?: string;
  tier: 'platinum' | 'gold' | 'silver' | 'bronze';
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class SponsorsService {
  static async getSponsors(): Promise<Sponsor[]> {
    try {
      const { data, error } = await supabase
        .from('sponsors')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      return [];
    }
  }

  static async getAllSponsors(): Promise<Sponsor[]> {
    try {
      const { data, error } = await supabase
        .from('sponsors')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      return [];
    }
  }

  static async getSponsorsByTier(tier: string): Promise<Sponsor[]> {
    try {
      const { data, error } = await supabase
        .from('sponsors')
        .select('*')
        .eq('tier', tier)
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      return [];
    }
  }

  static async createSponsor(sponsor: Omit<Sponsor, 'id' | 'created_at' | 'updated_at'>): Promise<Sponsor | null> {
    try {
      const { data, error } = await supabase
        .from('sponsors')
        .insert({
          ...sponsor,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      return null;
    }
  }

  static async updateSponsor(id: string, updates: Partial<Sponsor>): Promise<Sponsor | null> {
    try {
      const { data, error } = await supabase
        .from('sponsors')
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
      return null;
    }
  }

  static async deleteSponsor(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('sponsors')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      return false;
    }
  }

  static async getSponsorStats() {
    try {
      const [totalSponsors, activeSponsors] = await Promise.all([
        supabase.from('sponsors').select('id', { count: 'exact' }),
        supabase.from('sponsors').select('id', { count: 'exact' }).eq('is_active', true)
      ]);

      // Get tier distribution
      const { data: tierData } = await supabase
        .from('sponsors')
        .select('tier')
        .eq('is_active', true);

      const tierStats = tierData?.reduce((acc, sponsor) => {
        acc[sponsor.tier] = (acc[sponsor.tier] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        total: totalSponsors.count || 0,
        active: activeSponsors.count || 0,
        tierDistribution: tierStats
      };
    } catch (error) {
      return {
        total: 0,
        active: 0,
        tierDistribution: {}
      };
    }
  }
}