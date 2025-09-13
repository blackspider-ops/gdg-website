import { supabase } from '@/lib/supabase';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email?: string;
  bio?: string;
  image_url?: string;
  linkedin_url?: string;
  github_url?: string;
  order_index: number;
  is_active: boolean;
  member_id?: string;
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

  static async createMemberFromTeamMember(teamMember: TeamMember, email?: string): Promise<boolean> {
    try {
      // Import MembersService dynamically to avoid circular dependency
      const { MembersService } = await import('./membersService');
      
      // Check if member already exists by name
      const existingMembers = await MembersService.getAllMembers();
      const memberExists = existingMembers.some(m => 
        m.name.toLowerCase() === teamMember.name.toLowerCase()
      );
      
      if (memberExists) {
        console.log('Member already exists, skipping creation');
        return true;
      }

      // Use provided email, team member's email, or create a placeholder
      const memberEmail = email || teamMember.email || `${teamMember.name.toLowerCase().replace(/\s+/g, '.')}@placeholder.com`;

      // Map team role to member category
      const categoryMapping: Record<string, string> = {
        'Chapter Lead': 'founder',
        'Co-Lead': 'founder', 
        'Vice President': 'organizer',
        'Technical Lead': 'lead',
        'Events Coordinator': 'organizer',
        'Marketing Lead': 'lead',
        'Design Lead': 'lead',
        'Community Manager': 'organizer',
        'Organizer': 'organizer',
        'Mentor': 'lead',
        'Faculty Advisor': 'organizer',
        'Team Lead': 'lead',
        'Team Member': 'active'
      };

      const memberData = {
        name: teamMember.name,
        email: memberEmail,
        phone: '',
        year: '',
        major: '',
        category: (categoryMapping[teamMember.role] || 'active') as any,
        interests: [],
        is_active: teamMember.is_active,
        is_core_team: true, // Team members are automatically core team
        team_member_id: teamMember.id // Establish the link
      };

      const created = await MembersService.createMember(memberData);
      
      // Also update the team member with the member link
      if (created) {
        await supabase
          .from('team_members')
          .update({ member_id: created.id })
          .eq('id', teamMember.id);
      }
      
      return !!created;
    } catch (error) {
      console.error('Error creating member from team member:', error);
      return false;
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

  static async syncTeamMemberToMember(teamMember: TeamMember): Promise<boolean> {
    try {
      // Import MembersService dynamically to avoid circular dependency
      const { MembersService } = await import('./membersService');
      
      // Find corresponding member by name or email
      const members = await MembersService.getAllMembers();
      const member = members.find(m => 
        m.name.toLowerCase().trim() === teamMember.name.toLowerCase().trim() ||
        (teamMember.email && m.email === teamMember.email)
      );
      
      if (!member) {
        console.log('No corresponding member found for team member:', teamMember.name);
        return false;
      }

      // Map team role to member category
      const categoryMapping: Record<string, string> = {
        'Chapter Lead': 'founder',
        'Co-Lead': 'founder',
        'Vice President': 'organizer',
        'Technical Lead': 'lead',
        'Events Coordinator': 'organizer',
        'Marketing Lead': 'lead',
        'Design Lead': 'lead',
        'Community Manager': 'organizer',
        'Organizer': 'organizer',
        'Mentor': 'lead',
        'Faculty Advisor': 'organizer',
        'Team Lead': 'lead',
        'Team Member': 'active'
      };

      // Update member with team member information
      const updates = {
        name: teamMember.name,
        email: teamMember.email || member.email,
        // Only update category if role actually changed
        category: (categoryMapping[teamMember.role] || member.category) as any,
        is_active: teamMember.is_active,
        is_core_team: true // Team members are always core team
      };

      const updated = await MembersService.updateMember(member.id, updates, true); // Skip sync to prevent loop
      return !!updated;
    } catch (error) {
      console.error('Error syncing team member to member:', error);
      return false;
    }
  }

  static async updateTeamMember(id: string, updates: Partial<TeamMember>, skipSync: boolean = false): Promise<TeamMember | null> {
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
      
      // Sync changes to corresponding member only if sync is not skipped
      if (data && !skipSync) {
        await this.syncTeamMemberToMember(data);
      }
      
      return data;
    } catch (error) {
      console.error('Error updating team member:', error);
      return null;
    }
  }

  static async deleteMemberByName(teamMemberName: string): Promise<boolean> {
    try {
      // Import MembersService dynamically to avoid circular dependency
      const { MembersService } = await import('./membersService');
      
      // Find and delete corresponding member
      const members = await MembersService.getAllMembers();
      const member = members.find(m => 
        m.name.toLowerCase().trim() === teamMemberName.toLowerCase().trim()
      );
      
      if (member && member.is_core_team) {
        // Delete the member instead of updating
        const deleted = await MembersService.deleteMember(member.id, true); // Skip sync to prevent circular updates
        return deleted;
      }
      
      return true; // No corresponding member found or not core team, consider it successful
    } catch (error) {
      console.error('Error deleting member by name:', error);
      return false;
    }
  }

  static async deleteTeamMember(id: string, syncToMember: boolean = true): Promise<boolean> {
    try {
      // First, get the team member data
      const { data: teamMember, error: fetchError } = await supabase
        .from('team_members')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Delete the team member
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Also delete corresponding member if they exist and sync is enabled
      if (teamMember && syncToMember) {
        await this.deleteMemberByName(teamMember.name);
      }

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