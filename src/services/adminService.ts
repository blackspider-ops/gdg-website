import { supabase } from '@/lib/supabase';
import type { AdminUser } from '@/lib/supabase';

export class AdminService {
  /**
   * Authenticate admin user with email and password
   * SECURE VERSION - Uses backend RPC function, never exposes password hashes
   */
  static async authenticate(email: string, password: string): Promise<AdminUser | null> {
    try {
      // Call secure backend authentication function
      const { data, error } = await supabase.rpc('authenticate_admin', {
        p_email: email,
        p_password: password
      });

      if (error) {
        console.error('Authentication error:', error);
        return null;
      }

      // Check if authentication was successful
      if (!data || data.length === 0 || !data[0].success) {
        console.error('Authentication failed:', data?.[0]?.message || 'Unknown error');
        return null;
      }

      const authResult = data[0];

      // Create AdminUser object from result (NO PASSWORD HASH)
      const adminUser: AdminUser = {
        id: authResult.admin_id,
        email: authResult.email,
        password_hash: '', // Never exposed from backend
        role: authResult.role as 'super_admin' | 'admin' | 'team_member' | 'blog_editor',
        display_name: authResult.display_name,
        is_active: true,
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString()
      };

      return adminUser;
    } catch (error) {
      console.error('Authentication exception:', error);
      return null;
    }
  }

  /**
   * Log admin actions for audit trail
   */
  static async logAdminAction(
    adminId: string, 
    action: string, 
    targetEmail?: string, 
    details?: any
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('admin_actions')
        .insert({
          admin_id: adminId,
          action,
          target_email: targetEmail,
          details
        });
      
      if (error) {
        // Silently handle logging errors
      }
    } catch (error) {
      // Silently handle logging errors
    }
  }

  /**
   * Get admin user by ID
   */
  static async getAdminById(id: string): Promise<AdminUser | null> {
    try {
      const { data: adminUser, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error || !adminUser) {
        return null;
      }

      return adminUser;
    } catch (error) {
      return null;
    }
  }

  /**
   * Create a new admin user (for super admins only)
   * SECURE VERSION - Uses backend RPC function with password validation
   */
  static async createAdmin(
    email: string, 
    password: string, 
    role: 'admin' | 'super_admin' | 'team_member' | 'blog_editor' = 'admin',
    isTemporary: boolean = false,
    createdBy?: string,
    displayName?: string
  ): Promise<AdminUser | null> {
    try {
      // Call secure backend function
      const { data, error } = await supabase.rpc('create_admin_user', {
        p_email: email,
        p_password: password,
        p_role: role,
        p_display_name: displayName,
        p_created_by: createdBy
      });

      if (error) {
        console.error('Create admin error:', error);
        return null;
      }

      if (!data || data.length === 0 || !data[0].success) {
        console.error('Create admin failed:', data?.[0]?.message || 'Unknown error');
        return null;
      }

      const result = data[0];

      // Fetch the created admin (without password hash)
      const { data: newAdmin, error: fetchError } = await supabase
        .from('admin_users')
        .select('id, email, role, display_name, is_active, created_at, created_by, last_login')
        .eq('id', result.admin_id)
        .single();

      if (fetchError || !newAdmin) {
        return null;
      }

      return {
        ...newAdmin,
        password_hash: '' // Never exposed
      } as AdminUser;
    } catch (error) {
      console.error('Create admin exception:', error);
      return null;
    }
  }

  /**
   * Update admin password
   * SECURE VERSION - Password hashing happens on backend
   */
  static async updatePassword(adminId: string, newPassword: string, currentPassword?: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('update_admin_password', {
        p_admin_id: adminId,
        p_new_password: newPassword,
        p_current_password: currentPassword || null
      });

      if (error) {
        console.error('Password update error:', error);
        return false;
      }

      if (!data || data.length === 0 || !data[0].success) {
        console.error('Password update failed:', data?.[0]?.message || 'Unknown error');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Password update exception:', error);
      return false;
    }
  }

  /**
   * Get all admin users (for super admins only)
   */
  static async getAllAdmins(): Promise<AdminUser[]> {
    try {
      const { data: admins, error } = await supabase
        .from('admin_users')
        .select('id, email, role, display_name, is_active, created_at, created_by, last_login')
        .order('created_at', { ascending: false });

      if (error) {
        return [];
      }

      return admins || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Update admin user details (for super admins only)
   */
  static async updateAdmin(
    adminId: string, 
    updates: { 
      email?: string; 
      role?: 'admin' | 'super_admin' | 'team_member' | 'blog_editor'; 
      display_name?: string;
      is_active?: boolean; 
    },
    updatedBy: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('admin_users')
        .update(updates)
        .eq('id', adminId);

      if (error) {
        return false;
      }

      // Log the action
      await this.logAdminAction(updatedBy, 'update_admin', updates.email, { adminId, updates });

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Delete admin user (for super admins only)
   */
  static async deleteAdmin(adminId: string, deletedBy: string): Promise<boolean> {
    try {
      // Get admin details before deletion for logging
      const adminToDelete = await this.getAdminById(adminId);
      
      const { error } = await supabase
        .from('admin_users')
        .delete()
        .eq('id', adminId);

      if (error) {
        return false;
      }

      // Log the action
      await this.logAdminAction(deletedBy, 'delete_admin', adminToDelete?.email, { adminId });

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Reset admin password (for super admins only)
   */
  static async resetAdminPassword(
    adminId: string, 
    newPassword: string, 
    resetBy: string
  ): Promise<boolean> {
    try {
      const success = await this.updatePassword(adminId, newPassword);
      
      if (success) {
        // Get admin details for logging
        const admin = await this.getAdminById(adminId);
        await this.logAdminAction(resetBy, 'reset_password', admin?.email, { adminId });
      }

      return success;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if current admin is super admin
   */
  static isSuperAdmin(admin: AdminUser | null): boolean {
    return admin?.role === 'super_admin';
  }

  /**
   * Get admin actions log (for audit trail)
   */
  static async getAdminActions(limit: number = 50): Promise<AdminAction[]> {
    try {
      const { data: actions, error } = await supabase
        .from('admin_actions')
        .select(`
          *,
          admin_users!inner(email)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        return [];
      }

      return actions || [];
    } catch (error) {
      return [];
    }
  }
}