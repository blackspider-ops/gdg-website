import { supabase } from '@/lib/supabase';
import { TeamService, type TeamMember } from './teamService';
import type { AdminUser } from '@/lib/supabase';

export interface MergedProfile {
  // Admin data
  adminId: string;
  email: string;
  role: 'super_admin' | 'admin' | 'blog_editor';
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  
  // Team member data (if exists)
  teamMember?: {
    id: string;
    name: string;
    teamRole: string;
    bio?: string;
    imageUrl?: string;
    linkedinUrl?: string;
    githubUrl?: string;
    orderIndex: number;
  };
  
  // Merged/computed fields
  displayName: string;
  hasTeamProfile: boolean;
  profileComplete: boolean;
}

export class ProfileMergingService {
  /**
   * Get merged profile for an admin user
   */
  static async getMergedProfile(admin: AdminUser): Promise<MergedProfile> {
    try {
      // Look for team member with same email
      const { data: teamMembers } = await supabase
        .from('team_members')
        .select('*')
        .eq('email', admin.email)
        .eq('is_active', true);

      const teamMember = teamMembers?.[0];

      const mergedProfile: MergedProfile = {
        // Admin data
        adminId: admin.id,
        email: admin.email,
        role: admin.role,
        isActive: admin.is_active,
        createdAt: admin.created_at,
        lastLogin: admin.last_login,
        
        // Team member data
        teamMember: teamMember ? {
          id: teamMember.id,
          name: teamMember.name,
          teamRole: teamMember.role,
          bio: teamMember.bio,
          imageUrl: teamMember.image_url,
          linkedinUrl: teamMember.linkedin_url,
          githubUrl: teamMember.github_url,
          orderIndex: teamMember.order_index,
        } : undefined,
        
        // Computed fields
        displayName: teamMember?.name || admin.email.split('@')[0],
        hasTeamProfile: !!teamMember,
        profileComplete: !!(teamMember?.name && teamMember?.bio && teamMember?.image_url)
      };

      return mergedProfile;
    } catch (error) {
      // Return basic admin profile on error
      return {
        adminId: admin.id,
        email: admin.email,
        role: admin.role,
        isActive: admin.is_active,
        createdAt: admin.created_at,
        lastLogin: admin.last_login,
        displayName: admin.email.split('@')[0],
        hasTeamProfile: false,
        profileComplete: false
      };
    }
  }

  /**
   * Create or update team member profile for an admin
   */
  static async createOrUpdateTeamProfile(
    adminId: string,
    teamData: {
      name: string;
      role: string;
      bio?: string;
      imageUrl?: string;
      linkedinUrl?: string;
      githubUrl?: string;
    }
  ): Promise<boolean> {
    try {
      // Get admin user
      const { data: admin } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', adminId)
        .single();

      if (!admin) return false;

      // Check if team member already exists
      const { data: existingTeamMember } = await supabase
        .from('team_members')
        .select('*')
        .eq('email', admin.email)
        .single();

      if (existingTeamMember) {
        // Update existing team member
        const { error } = await supabase
          .from('team_members')
          .update({
            name: teamData.name,
            role: teamData.role,
            bio: teamData.bio,
            image_url: teamData.imageUrl,
            linkedin_url: teamData.linkedinUrl,
            github_url: teamData.githubUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingTeamMember.id);

        return !error;
      } else {
        // Create new team member
        const { error } = await supabase
          .from('team_members')
          .insert({
            name: teamData.name,
            role: teamData.role,
            email: admin.email,
            bio: teamData.bio,
            image_url: teamData.imageUrl,
            linkedin_url: teamData.linkedinUrl,
            github_url: teamData.githubUrl,
            order_index: 999, // Put at end initially
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        return !error;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Auto-merge admin with existing team member on login
   */
  static async autoMergeOnLogin(admin: AdminUser): Promise<MergedProfile> {
    try {
      // Get merged profile
      const mergedProfile = await this.getMergedProfile(admin);

      // If team member exists but admin doesn't have enhanced profile data,
      // we could potentially update admin table with additional fields
      // For now, we'll just return the merged profile

      return mergedProfile;
    } catch (error) {
      return this.getMergedProfile(admin);
    }
  }

  /**
   * Get profile completion suggestions
   */
  static getProfileCompletionSuggestions(profile: MergedProfile): string[] {
    const suggestions: string[] = [];

    if (!profile.hasTeamProfile) {
      suggestions.push('Create your team profile to appear on the public team page');
    } else {
      if (!profile.teamMember?.name) {
        suggestions.push('Add your full name to your team profile');
      }
      if (!profile.teamMember?.bio) {
        suggestions.push('Add a bio to tell others about yourself');
      }
      if (!profile.teamMember?.imageUrl) {
        suggestions.push('Upload a profile picture');
      }
      if (!profile.teamMember?.linkedinUrl && !profile.teamMember?.githubUrl) {
        suggestions.push('Add your LinkedIn or GitHub profile links');
      }
    }

    return suggestions;
  }

  /**
   * Check if admin email matches any team member
   */
  static async findMatchingTeamMember(email: string): Promise<TeamMember | null> {
    try {
      const { data: teamMembers } = await supabase
        .from('team_members')
        .select('*')
        .eq('email', email)
        .eq('is_active', true);

      return teamMembers?.[0] || null;
    } catch (error) {
      return null;
    }
  }
}