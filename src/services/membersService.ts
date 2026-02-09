import { supabase } from '@/lib/supabase';

export interface Member {
  id: string;
  name: string;
  email: string;
  phone?: string;
  year?: string;
  major?: string;
  category: 'founder' | 'organizer' | 'lead' | 'active' | 'member' | 'alumni';
  team_section?: string; // Custom section like "Leadership Team", "Advisors", "Active Members"
  interests: string[];
  join_date: string;
  last_active: string;
  is_active: boolean;
  is_core_team: boolean;
  team_member_id?: string;
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
      return null;
    }
  }

  static async syncMemberToTeamMember(member: Member): Promise<boolean> {
    try {
      // Import TeamService dynamically to avoid circular dependency
      const { TeamService } = await import('./teamService');
      
      let teamMember = null;
      
      // First try to find by linked ID
      if (member.team_member_id) {
        const teamMembers = await TeamService.getAllTeamMembers();
        teamMember = teamMembers.find(tm => tm.id === member.team_member_id);
      }
      
      // If no linked team member found, try to find by name
      if (!teamMember) {
        const teamMembers = await TeamService.getAllTeamMembers();
        teamMember = teamMembers.find(tm => 
          tm.name.toLowerCase().trim() === member.name.toLowerCase().trim()
        );
        
        // If found by name, establish the link
        if (teamMember) {
          await this.updateMember(member.id, { team_member_id: teamMember.id }, true); // Skip sync when establishing link
          // Also update the team member with the member link
          await supabase
            .from('team_members')
            .update({ member_id: member.id })
            .eq('id', teamMember.id);
        }
      }
      
      if (!teamMember) {
        return false;
      }

      // Map member category to team role
      const roleMapping: Record<string, string> = {
        'founder': 'Chapter Lead',
        'organizer': 'Organizer',
        'lead': 'Team Lead',
        'active': 'Team Member',
        'member': 'Team Member',
        'alumni': 'Alumni'
      };

      // Update team member with member information (but keep role unchanged)
      const updates = {
        name: member.name,
        // Don't update role - it's managed in Team Management
        email: member.email,
        is_active: member.is_active,
        member_id: member.id, // Maintain the link
        // Keep existing bio unless it's empty
        bio: teamMember.bio || `${member.major ? member.major + ' student' : 'Student'} ${member.year ? `in ${member.year} year` : ''}`.trim()
      };

      const updated = await TeamService.updateTeamMember(teamMember.id, updates, true); // Skip sync to prevent loop
      return !!updated;
    } catch (error) {
      return false;
    }
  }

  static async updateMember(id: string, updates: Partial<Member>, skipSync: boolean = false): Promise<Member | null> {
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
      
      // If member is core team and sync is not skipped, sync changes to team member
      if (data && data.is_core_team && !skipSync) {
        await this.syncMemberToTeamMember(data);
      }
      
      return data;
    } catch (error) {
      return null;
    }
  }

  static async deleteTeamMemberByName(memberName: string): Promise<boolean> {
    try {
      // Import TeamService dynamically to avoid circular dependency
      const { TeamService } = await import('./teamService');
      
      // Find and delete corresponding team member
      const teamMembers = await TeamService.getAllTeamMembers();
      const teamMember = teamMembers.find(tm => 
        tm.name.toLowerCase().trim() === memberName.toLowerCase().trim()
      );
      
      if (teamMember) {
        const deleted = await TeamService.deleteTeamMember(teamMember.id);
        return deleted;
      }
      
      return true; // No team member found, consider it successful
    } catch (error) {
      return false;
    }
  }

  static async deleteMember(id: string, syncToTeam: boolean = true): Promise<boolean> {
    try {
      // First, get the member data to check if they're core team
      const { data: member, error: fetchError } = await supabase
        .from('members')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Delete the member
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // If member was core team and sync is enabled, also delete from team members
      if (member && member.is_core_team && syncToTeam) {
        await this.deleteTeamMemberByName(member.name);
      }

      return true;
    } catch (error) {
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
      return false;
    }
  }

  static async createTeamMemberFromMember(member: Member): Promise<boolean> {
    try {
      // Import TeamService dynamically to avoid circular dependency
      const { TeamService } = await import('./teamService');
      
      // Map member category to appropriate team role
      const roleMapping: Record<string, string> = {
        'founder': 'Chapter Lead',
        'organizer': 'Organizer',
        'lead': 'Team Lead',
        'active': 'Team Member',
        'member': 'Team Member',
        'alumni': 'Alumni'
      };

      const teamMemberData = {
        name: member.name,
        role: roleMapping[member.category] || 'Team Member',
        bio: `${member.major ? member.major + ' student' : 'Student'} ${member.year ? `in ${member.year} year` : ''}`.trim(),
        image_url: '',
        linkedin_url: '',
        github_url: '',
        order_index: 999, // Will be adjusted in team management
        is_active: member.is_active
      };

      const created = await TeamService.createTeamMember(teamMemberData);
      return !!created;
    } catch (error) {
      return false;
    }
  }

  static async getMemberStats() {
    try {
      const [totalMembers, activeMembers, coreTeamMembers] = await Promise.all([
        supabase.from('members').select('id', { count: 'exact' }),
        supabase.from('members').select('id', { count: 'exact' }).eq('is_active', true),
        supabase.from('members').select('id', { count: 'exact' }).eq('is_core_team', true)
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
        coreTeam: coreTeamMembers.count || 0,
        categoryDistribution: categoryStats
      };
    } catch (error) {
      return {
        total: 0,
        active: 0,
        coreTeam: 0,
        categoryDistribution: {}
      };
    }
  }
}