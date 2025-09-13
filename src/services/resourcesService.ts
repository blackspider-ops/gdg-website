import { supabase } from '@/lib/supabase';

export interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'study_jam' | 'cloud_credit' | 'documentation' | 'recording';
  category?: string;
  url?: string;
  duration?: string;
  level?: 'Beginner' | 'Intermediate' | 'Advanced';
  status: 'Available' | 'Coming Soon' | 'Archived';
  provider?: string;
  amount?: string;
  requirements?: string[];
  materials?: string[];
  tags?: string[];
  speaker?: string;
  views?: number;
  icon?: string;
  color?: string;
  metadata?: any;
  is_active: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export class ResourcesService {
  static async getResources(): Promise<Resource[]> {
    try {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching resources:', error);
      return [];
    }
  }

  static async getResourcesByType(type: string): Promise<Resource[]> {
    try {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .eq('type', type)
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching resources by type:', error);
      return [];
    }
  }

  static async createResource(resource: Omit<Resource, 'id' | 'created_at' | 'updated_at'>): Promise<Resource | null> {
    try {
      const { data, error } = await supabase
        .from('resources')
        .insert({
          ...resource,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating resource:', error);
      return null;
    }
  }

  static async updateResource(id: string, updates: Partial<Resource>): Promise<Resource | null> {
    try {
      const { data, error } = await supabase
        .from('resources')
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
      console.error('Error updating resource:', error);
      return null;
    }
  }

  static async deleteResource(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting resource:', error);
      return false;
    }
  }

  static async incrementViews(id: string): Promise<boolean> {
    try {
      // First try the RPC function
      const { error: rpcError } = await supabase
        .rpc('increment_resource_views', { resource_id: id });

      if (rpcError) {
        // Fallback to manual increment if RPC doesn't exist
        const { data: resource, error: fetchError } = await supabase
          .from('resources')
          .select('views')
          .eq('id', id)
          .single();

        if (fetchError) throw fetchError;

        const { error: updateError } = await supabase
          .from('resources')
          .update({ views: (resource.views || 0) + 1 })
          .eq('id', id);

        if (updateError) throw updateError;
      }

      return true;
    } catch (error) {
      console.error('Error incrementing views:', error);
      return false;
    }
  }

  static async bulkUpdateOrder(updates: { id: string; order_index: number }[]): Promise<boolean> {
    try {
      const promises = updates.map(update =>
        supabase
          .from('resources')
          .update({ order_index: update.order_index })
          .eq('id', update.id)
      );

      const results = await Promise.all(promises);
      const hasError = results.some(result => result.error);

      if (hasError) {
        throw new Error('Failed to update some resource orders');
      }

      return true;
    } catch (error) {
      console.error('Error bulk updating resource order:', error);
      return false;
    }
  }

  static async toggleActive(id: string): Promise<Resource | null> {
    try {
      const { data: resource, error: fetchError } = await supabase
        .from('resources')
        .select('is_active')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const { data, error } = await supabase
        .from('resources')
        .update({ 
          is_active: !resource.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error toggling resource active status:', error);
      return null;
    }
  }

  static async getResourceStats() {
    try {
      const [totalResources, activeResources] = await Promise.all([
        supabase.from('resources').select('id', { count: 'exact' }),
        supabase.from('resources').select('id', { count: 'exact' }).eq('is_active', true)
      ]);

      // Get type distribution
      const { data: typeData } = await supabase
        .from('resources')
        .select('type')
        .eq('is_active', true);

      const typeStats = typeData?.reduce((acc, resource) => {
        acc[resource.type] = (acc[resource.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        total: totalResources.count || 0,
        active: activeResources.count || 0,
        typeDistribution: typeStats
      };
    } catch (error) {
      console.error('Error fetching resource stats:', error);
      return {
        total: 0,
        active: 0,
        typeDistribution: {}
      };
    }
  }
}