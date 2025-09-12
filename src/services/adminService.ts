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
        console.error('Admin user not found:', error);
        return null;
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, adminUser.password_hash);
      
      if (!isPasswordValid) {
        console.error('Invalid password for admin:', email);
        return null;
      }

      // Update last login timestamp
      await supabase
        .from('admin_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', adminUser.id);

      // Log admin action
      await this.logAdminAction(adminUser.id, 'login', email);

      return adminUser;
    } catch (error) {
      console.error('Authentication error:', error);
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
      await supabase
        .from('admin_actions')
        .insert({
          admin_id: adminId,
          action,
          target_email: targetEmail,
          details
        });
    } catch (error) {
      console.error('Failed to log admin action:', error);
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
      console.error('Error fetching admin user:', error);
      return null;
    }
  }

  /**
   * Create a new admin user (for super admins only)
   */
  static async createAdmin(
    email: string, 
    password: string, 
    role: 'admin' | 'super_admin' = 'admin'
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
          is_active: true
        })
        .select()
        .single();

      if (error || !newAdmin) {
        console.error('Failed to create admin user:', error);
        return null;
      }

      return newAdmin;
    } catch (error) {
      console.error('Error creating admin user:', error);
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
        console.error('Failed to update password:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating password:', error);
      return false;
    }
  }
}