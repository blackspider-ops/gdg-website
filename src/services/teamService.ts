import { supabase } from '@/lib/supabase';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio?: string;
  image_url?: string;
  linkedin_url?: string;
  github_url?: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class TeamService {
  static async getTeamMembers(): Promise<TeamMember[]> {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching team members:', error);
      return [];
    }
  }

  static async getAllTeamMembers(): Promise<TeamMember[]> {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all team members:', error);
      return [];
    }
  }

  static async createTeamMember(member: Omit<TeamMember, 'id' | 'created_at' | 'updated_at'>): Promise<TeamMember | null> {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .insert({
          ...member,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating team member:', error);
      return null;
    }
  }

  static async updateTeamMember(id: string, updates: Partial<TeamMember>): Promise<TeamMember | null> {
    try {
      const { data, error } = await supabase
        .from('team_members')
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
      console.error('Error updating team member:', error);
      return null;
    }
  }

  static async deleteTeamMember(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting team member:', error);
      return false;
    }
  }

  static async getTeamStats() {
    try {
      const [totalMembers, activeMembers] = await Promise.all([
        supabase.from('team_members').select('id', { count: 'exact' }),
        supabase.from('team_members').select('id', { count: 'exact' }).eq('is_active', true)
      ]);

      // Get role distribution
      const { data: roleData } = await supabase
        .from('team_members')
        .select('role')
        .eq('is_active', true);

      const roleStats = roleData?.reduce((acc, member) => {
        acc[member.role] = (acc[member.role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        total: totalMembers.count || 0,
        active: activeMembers.count || 0,
        roleDistribution: roleStats
      };
    } catch (error) {
      console.error('Error fetching team stats:', error);
      return {
        total: 0,
        active: 0,
        roleDistribution: {}
      };
    }
  }
}