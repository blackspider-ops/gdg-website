import { supabase } from '@/lib/supabase';

export interface Member {
  id: string;
  name: string;
  email: string;
  phone?: string;
  year?: string;
  major?: string;
  category: 'founder' | 'organizer' | 'lead' | 'active' | 'member' | 'alumni';
  interests: string[];
  join_date: string;
  last_active: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class MembersService {
  static async getMembers(): Promise<Member[]> {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching members:', error);
      return [];
    }
  }

  static async getAllMembers(): Promise<Member[]> {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all members:', error);
      return [];
    }
  }

  static async getMembersByCategory(category: string): Promise<Member[]> {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('category', category)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching members by category:', error);
      return [];
    }
  }

  static async createMember(member: Omit<Member, 'id' | 'created_at' | 'updated_at' | 'join_date' | 'last_active'>): Promise<Member | null> {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('members')
        .insert({
          ...member,
          join_date: now,
          last_active: now,
          created_at: now,
          updated_at: now
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating member:', error);
      return null;
    }
  }

  static async updateMember(id: string, updates: Partial<Member>): Promise<Member | null> {
    try {
      const { data, error } = await supabase
        .from('members')
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
      console.error('Error updating member:', error);
      return null;
    }
  }

  static async deleteMember(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting member:', error);
      return false;
    }
  }

  static async updateLastActive(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('members')
        .update({
          last_active: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating last active:', error);
      return false;
    }
  }

  static async getMemberStats() {
    try {
      const [totalMembers, activeMembers] = await Promise.all([
        supabase.from('members').select('id', { count: 'exact' }),
        supabase.from('members').select('id', { count: 'exact' }).eq('is_active', true)
      ]);

      // Get category distribution
      const { data: categoryData } = await supabase
        .from('members')
        .select('category')
        .eq('is_active', true);

      const categoryStats = categoryData?.reduce((acc, member) => {
        acc[member.category] = (acc[member.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        total: totalMembers.count || 0,
        active: activeMembers.count || 0,
        categoryDistribution: categoryStats
      };
    } catch (error) {
      console.error('Error fetching member stats:', error);
      return {
        total: 0,
        active: 0,
        categoryDistribution: {}
      };
    }
  }
}