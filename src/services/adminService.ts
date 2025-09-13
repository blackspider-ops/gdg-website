import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import type { AdminUser } from '@/lib/supabase';

export class AdminService {
  /**
   * Authenticate admin user with email and password
   */
  static async authenticate(email: string, password: string): Promise<AdminUser | null> {
    try {
      // Fetch admin user by email
      const { data: adminUser, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (error || !adminUser) {
        return null;
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, adminUser.password_hash);
      
      if (!isPasswordValid) {
        return null;
      }

      // Update last login timestamp (ignore RLS errors for now)
      try {
        await supabase
          .from('admin_users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', adminUser.id);
      } catch (updateError) {
        // Ignore RLS errors for last_login updates
        console.warn('Could not update last_login due to RLS policy');
      }

      // Log admin action
      await this.logAdminAction(adminUser.id, 'login', email);

      return adminUser;
    } catch (error) {
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
        console.warn('Could not log admin action due to RLS policy:', error.message);
      }
    } catch (error) {
      console.warn('Could not log admin action:', error);
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
   */
  static async createAdmin(
    email: string, 
    password: string, 
    role: 'admin' | 'super_admin' = 'admin',
    isTemporary: boolean = false
  ): Promise<AdminUser | null> {
    try {
      // Hash the password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Insert new admin user
      const { data: newAdmin, error } = await supabase
        .from('admin_users')
        .insert({
          email,
          password_hash: passwordHash,
          role,
          is_active: true,
          must_change_password: isTemporary, // Force password change if temporary
          password_changed_at: isTemporary ? null : new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Could not create admin user due to RLS policy:', error.message);
        return null;
      }
      
      if (!newAdmin) {
        return null;
      }

      return newAdmin;
    } catch (error) {
      return null;
    }
  }

  /**
   * Update admin password
   */
  static async updatePassword(adminId: string, newPassword: string): Promise<boolean> {
    try {
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(newPassword, saltRounds);

      const { error } = await supabase
        .from('admin_users')
        .update({ password_hash: passwordHash })
        .eq('id', adminId);

      if (error) {
        console.error('Could not update password due to RLS policy:', error.message);
        return false;
      }

      return true;
    } catch (error) {
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
        .select('id, email, role, is_active, created_at, last_login')
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
      role?: 'admin' | 'super_admin'; 
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
        console.error('Could not update admin user due to RLS policy:', error.message);
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
        console.error('Could not delete admin user due to RLS policy:', error.message);
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