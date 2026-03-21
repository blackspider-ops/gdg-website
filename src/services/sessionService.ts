// Secure session management service with httpOnly cookies
// CRITICAL FIX: Replace localStorage sessions with httpOnly cookies

import CSRFService from './csrfService';
import type { AdminUser } from '@/lib/supabase';

interface LoginCredentials {
  email: string;
  password: string;
}

interface SessionResponse {
  success: boolean;
  admin?: {
    id: string;
    email: string;
    role: string;
    display_name: string;
  };
  error?: string;
}

class SessionService {
  /**
   * Login with email and password
   * Creates httpOnly cookie session
   */
  static async login(credentials: LoginCredentials): Promise<AdminUser | null> {
    try {
      // Get CSRF token
      const csrfToken = await CSRFService.getToken();

      // Call session API
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        credentials: 'include', // Important: send cookies
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
          csrfToken
        })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Login failed:', error);
        return null;
      }

      const data: SessionResponse = await response.json();

      if (data.success && data.admin) {
        // Convert to AdminUser format
        return {
          id: data.admin.id,
          email: data.admin.email,
          role: data.admin.role as 'super_admin' | 'admin' | 'team_member' | 'blog_editor',
          display_name: data.admin.display_name,
          password_hash: '', // Never exposed
          is_active: true,
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString()
        };
      }

      return null;
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  }

  /**
   * Validate current session
   * Checks httpOnly cookie
   */
  static async validateSession(): Promise<AdminUser | null> {
    try {
      const response = await fetch('/api/session', {
        method: 'GET',
        credentials: 'include' // Important: send cookies
      });

      if (!response.ok) {
        return null;
      }

      const data: SessionResponse = await response.json();

      if (data.admin) {
        return {
          id: data.admin.id,
          email: data.admin.email,
          role: data.admin.role as 'super_admin' | 'admin' | 'team_member' | 'blog_editor',
          display_name: data.admin.display_name,
          password_hash: '',
          is_active: true,
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString()
        };
      }

      return null;
    } catch (error) {
      console.error('Session validation error:', error);
      return null;
    }
  }

  /**
   * Logout
   * Clears httpOnly cookie session
   */
  static async logout(): Promise<boolean> {
    try {
      const response = await fetch('/api/session', {
        method: 'DELETE',
        credentials: 'include' // Important: send cookies
      });

      // Clear CSRF token
      CSRFService.clearToken();

      return response.ok;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  }
}

export default SessionService;
