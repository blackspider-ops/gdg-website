import { supabase } from '@/lib/supabase';

export interface SecurityMetrics {
  activeSessionsCount: number;
  recentLoginsCount: number;
  securityAlertsCount: number;
  failedLoginAttempts: number;
}

export interface SecurityEvent {
  id: string;
  event_type: 'login_success' | 'login_failed' | 'password_change' | 'account_locked' | 'suspicious_activity';
  admin_id: string;
  ip_address?: string;
  user_agent?: string;
  details?: any;
  created_at: string;
}

export interface SessionInfo {
  admin_id: string;
  email: string;
  role: string;
  last_activity: string;
  ip_address?: string;
  user_agent?: string;
  is_current: boolean;
}

export class SecurityService {
  /**
   * Get security metrics for dashboard
   */
  static async getSecurityMetrics(): Promise<SecurityMetrics> {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      // Get active sessions (admins who logged in recently)
      const { data: activeSessions } = await supabase
        .from('admin_users')
        .select('id')
        .eq('is_active', true)
        .gte('last_login', twentyFourHoursAgo);

      // Get recent login actions
      const { data: recentLogins } = await supabase
        .from('admin_actions')
        .select('id')
        .eq('action', 'login')
        .gte('created_at', twentyFourHoursAgo);

      // For now, we'll simulate failed login attempts and security alerts
      // In a real implementation, these would come from actual security logs
      const failedLoginAttempts = 0;
      const securityAlertsCount = 0;

      return {
        activeSessionsCount: activeSessions?.length || 0,
        recentLoginsCount: recentLogins?.length || 0,
        securityAlertsCount,
        failedLoginAttempts
      };
    } catch (error) {
      return {
        activeSessionsCount: 0,
        recentLoginsCount: 0,
        securityAlertsCount: 0,
        failedLoginAttempts: 0
      };
    }
  }

  /**
   * Get active admin sessions
   */
  static async getActiveSessions(currentAdminId?: string): Promise<SessionInfo[]> {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data: sessions } = await supabase
        .from('admin_users')
        .select('id, email, role, last_login')
        .eq('is_active', true)
        .gte('last_login', twentyFourHoursAgo)
        .order('last_login', { ascending: false });

      return sessions?.map(session => ({
        admin_id: session.id,
        email: session.email,
        role: session.role,
        last_activity: session.last_login,
        is_current: session.id === currentAdminId
      })) || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Log a security event
   */
  static async logSecurityEvent(
    eventType: SecurityEvent['event_type'],
    adminId: string,
    details?: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('security_events')
        .insert({
          event_type: eventType,
          admin_id: adminId,
          ip_address: ipAddress,
          user_agent: userAgent,
          details: details || {},
          created_at: new Date().toISOString()
        });

      return !error;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get recent security events
   */
  static async getSecurityEvents(limit: number = 50): Promise<SecurityEvent[]> {
    try {
      const { data: events } = await supabase
        .from('security_events')
        .select(`
          id,
          event_type,
          admin_id,
          ip_address,
          user_agent,
          details,
          created_at,
          admin_users!inner(email)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      return events || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Check for suspicious activity patterns
   */
  static async detectSuspiciousActivity(adminId: string): Promise<{
    isSuspicious: boolean;
    reasons: string[];
  }> {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      // Check for multiple failed login attempts
      const { data: failedLogins } = await supabase
        .from('security_events')
        .select('id')
        .eq('admin_id', adminId)
        .eq('event_type', 'login_failed')
        .gte('created_at', oneHourAgo);

      // Check for unusual login times (this is a simplified check)
      const { data: recentLogins } = await supabase
        .from('admin_actions')
        .select('created_at')
        .eq('admin_id', adminId)
        .eq('action', 'login')
        .gte('created_at', oneDayAgo);

      const reasons: string[] = [];
      let isSuspicious = false;

      // Multiple failed login attempts
      if (failedLogins && failedLogins.length >= 3) {
        reasons.push('Multiple failed login attempts in the last hour');
        isSuspicious = true;
      }

      // Unusual login frequency
      if (recentLogins && recentLogins.length >= 10) {
        reasons.push('Unusually high number of login attempts');
        isSuspicious = true;
      }

      return { isSuspicious, reasons };
    } catch (error) {
      return { isSuspicious: false, reasons: [] };
    }
  }

  /**
   * Get security policy settings
   */
  static getSecurityPolicy() {
    return {
      passwordPolicy: {
        minLength: 8,
        requireSpecialChars: true,
        requireNumbers: true,
        requireUppercase: true,
        expirationDays: 90
      },
      sessionSettings: {
        timeoutHours: 24,
        autoLogoutOnInactivity: true,
        rememberLoginDays: 7
      },
      accessControl: {
        maxFailedAttempts: 5,
        lockoutDurationMinutes: 15,
        ipRestrictions: false
      }
    };
  }

  /**
   * Validate password against security policy
   */
  static validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const policy = this.getSecurityPolicy().passwordPolicy;
    const errors: string[] = [];

    if (password.length < policy.minLength) {
      errors.push(`Password must be at least ${policy.minLength} characters long`);
    }

    if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    if (policy.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate security recommendations
   */
  static async getSecurityRecommendations(adminId?: string): Promise<string[]> {
    const recommendations: string[] = [];

    try {
      if (adminId) {
        // Check password age (simplified - in real implementation, track password changes)
        const { data: admin } = await supabase
          .from('admin_users')
          .select('created_at, last_login')
          .eq('id', adminId)
          .single();

        if (admin) {
          const accountAge = Date.now() - new Date(admin.created_at).getTime();
          const ninetyDays = 90 * 24 * 60 * 60 * 1000;

          if (accountAge > ninetyDays) {
            recommendations.push('Consider updating your password - it may be over 90 days old');
          }

          if (!admin.last_login) {
            recommendations.push('This account has never been used - consider activating or removing it');
          }
        }
      }

      // General recommendations
      recommendations.push(
        'Review admin access logs weekly for suspicious activity',
        'Keep the admin secret code secure and change it monthly',
        'Remove inactive admin accounts to reduce security risks',
        'Enable two-factor authentication when available'
      );

      return recommendations;
    } catch (error) {
      return [
        'Regularly update admin passwords',
        'Monitor admin access logs',
        'Keep admin secret codes secure'
      ];
    }
  }
}