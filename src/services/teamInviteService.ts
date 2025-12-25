import { supabase } from '@/lib/supabase';
import { AdminService } from './adminService';
import { TeamManagementService } from './teamManagementService';
import { TeamActivityService } from './teamActivityService';
import { ResendService } from './resendService';

export interface TeamInvite {
  id: string;
  team_id: string;
  email: string;
  role: 'lead' | 'co_lead' | 'member';
  invited_by: string;
  token: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  expires_at: string;
  accepted_at?: string;
  created_at: string;
  // Joined data
  team?: { id: string; name: string; slug: string; color: string };
  inviter?: { id: string; email: string; display_name?: string };
}

export class TeamInviteService {
  /**
   * Generate a secure random token
   */
  private static generateToken(): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  /**
   * Create a team invite
   */
  static async createInvite(
    teamId: string,
    email: string,
    role: 'lead' | 'co_lead' | 'member',
    invitedBy: string,
    expiresInDays = 7
  ): Promise<TeamInvite | null> {
    try {
      // Check if user already exists as admin
      const existingAdmins = await AdminService.getAllAdmins();
      const existingAdmin = existingAdmins.find(a => a.email.toLowerCase() === email.toLowerCase());
      
      if (existingAdmin) {
        // User already exists, just add them to the team
        const membership = await TeamManagementService.addTeamMember(
          teamId,
          existingAdmin.id,
          role,
          invitedBy
        );
        
        if (membership) {
          // Log activity
          await TeamActivityService.logActivity(
            teamId,
            invitedBy,
            'member_added',
            existingAdmin.id,
            { role, method: 'direct_add' }
          );
        }
        
        return null; // Return null to indicate user was added directly
      }

      // Check for existing pending invite
      const { data: existingInvite } = await supabase
        .from('team_invites')
        .select('id')
        .eq('team_id', teamId)
        .eq('email', email.toLowerCase())
        .eq('status', 'pending')
        .single();

      if (existingInvite) {
        // Cancel existing invite and create new one
        await supabase
          .from('team_invites')
          .update({ status: 'cancelled' })
          .eq('id', existingInvite.id);
      }

      const token = this.generateToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      const { data, error } = await supabase
        .from('team_invites')
        .insert({
          team_id: teamId,
          email: email.toLowerCase(),
          role,
          invited_by: invitedBy,
          token,
          status: 'pending',
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await TeamActivityService.logActivity(
        teamId,
        invitedBy,
        'invite_sent',
        undefined,
        { email, role }
      );

      // Send invite email
      try {
        const team = await TeamManagementService.getTeamById(teamId);
        const inviter = await AdminService.getAdminById(invitedBy);
        if (team && inviter) {
          const inviteUrl = this.getInviteUrl(data.token);
          await ResendService.sendTeamInviteEmail(
            email,
            team.name,
            inviter.display_name || inviter.email,
            role,
            inviteUrl
          );
        }
      } catch (emailError) {
        console.error('Failed to send invite email:', emailError);
        // Don't fail the invite if email fails
      }

      return data;
    } catch (error) {
      console.error('Error creating team invite:', error);
      return null;
    }
  }

  /**
   * Get invite by token
   */
  static async getInviteByToken(token: string): Promise<TeamInvite | null> {
    try {
      const { data, error } = await supabase
        .from('team_invites')
        .select(`
          *,
          team:admin_teams(id, name, slug, color),
          inviter:admin_users!team_invites_invited_by_fkey(id, email, display_name)
        `)
        .eq('token', token)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching invite:', error);
      return null;
    }
  }

  /**
   * Accept an invite
   */
  static async acceptInvite(
    token: string,
    password: string,
    displayName?: string
  ): Promise<{ success: boolean; message: string; adminId?: string }> {
    try {
      const invite = await this.getInviteByToken(token);
      
      if (!invite) {
        return { success: false, message: 'Invalid invite link' };
      }

      if (invite.status !== 'pending') {
        return { success: false, message: `This invite has been ${invite.status}` };
      }

      if (new Date(invite.expires_at) < new Date()) {
        await supabase
          .from('team_invites')
          .update({ status: 'expired' })
          .eq('id', invite.id);
        return { success: false, message: 'This invite has expired' };
      }

      // Create the admin user
      const newAdmin = await AdminService.createAdmin(
        invite.email,
        password,
        'team_member',
        false,
        invite.invited_by,
        displayName
      );

      if (!newAdmin) {
        return { success: false, message: 'Failed to create account' };
      }

      // Add to team
      await TeamManagementService.addTeamMember(
        invite.team_id,
        newAdmin.id,
        invite.role,
        invite.invited_by
      );

      // Update invite status
      await supabase
        .from('team_invites')
        .update({ 
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', invite.id);

      // Log activity
      await TeamActivityService.logActivity(
        invite.team_id,
        newAdmin.id,
        'invite_accepted',
        undefined,
        { role: invite.role }
      );

      return { 
        success: true, 
        message: 'Account created successfully',
        adminId: newAdmin.id
      };
    } catch (error) {
      console.error('Error accepting invite:', error);
      return { success: false, message: 'Failed to accept invite' };
    }
  }

  /**
   * Get pending invites for a team
   */
  static async getTeamInvites(teamId: string): Promise<TeamInvite[]> {
    try {
      const { data, error } = await supabase
        .from('team_invites')
        .select(`
          *,
          inviter:admin_users!team_invites_invited_by_fkey(id, email, display_name)
        `)
        .eq('team_id', teamId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching team invites:', error);
      return [];
    }
  }

  /**
   * Cancel an invite
   */
  static async cancelInvite(inviteId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('team_invites')
        .update({ status: 'cancelled' })
        .eq('id', inviteId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error cancelling invite:', error);
      return false;
    }
  }

  /**
   * Resend an invite (creates new token, extends expiry)
   */
  static async resendInvite(inviteId: string): Promise<TeamInvite | null> {
    try {
      const { data: invite } = await supabase
        .from('team_invites')
        .select('*')
        .eq('id', inviteId)
        .single();

      if (!invite) return null;

      // Cancel old invite
      await this.cancelInvite(inviteId);

      // Create new invite
      return this.createInvite(
        invite.team_id,
        invite.email,
        invite.role,
        invite.invited_by
      );
    } catch (error) {
      console.error('Error resending invite:', error);
      return null;
    }
  }

  /**
   * Get invite link URL
   */
  static getInviteUrl(token: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/admin/invite/${token}`;
  }
}
