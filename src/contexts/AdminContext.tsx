import React, { createContext, useContext, useState, useEffect } from 'react';
import { AdminService } from '@/services/adminService';
import type { AdminUser } from '@/lib/supabase';

interface AdminContextType {
  isAuthenticated: boolean;
  currentAdmin: AdminUser | null;
  login: (credentials: { username: string; password: string }) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

interface AdminProviderProps {
  children: React.ReactNode;
}

export const AdminProvider: React.FC<AdminProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const adminSession = localStorage.getItem('gdg-admin-session');
      if (adminSession) {
        try {
          const session = JSON.parse(adminSession);
          // Check if session is still valid (24 hours)
          const now = new Date().getTime();
          if (session.expires > now && session.adminId) {
            // Verify admin still exists and is active
            const admin = await AdminService.getAdminById(session.adminId);
            if (admin) {
              setCurrentAdmin(admin);
              setIsAuthenticated(true);
            } else {
              localStorage.removeItem('gdg-admin-session');
            }
          } else {
            localStorage.removeItem('gdg-admin-session');
          }
        } catch {
          localStorage.removeItem('gdg-admin-session');
        }
      }
    };

    checkSession();
  }, []);

  const login = async (credentials: { username: string; password: string }): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Authenticate with Supabase
      const admin = await AdminService.authenticate(credentials.username, credentials.password);
      
      if (admin) {
        // Create session with 24-hour expiry
        const session = {
          authenticated: true,
          adminId: admin.id,
          email: admin.email,
          expires: new Date().getTime() + (24 * 60 * 60 * 1000) // 24 hours
        };
        
        localStorage.setItem('gdg-admin-session', JSON.stringify(session));
        setCurrentAdmin(admin);
        setIsAuthenticated(true);
        return true;
      } else {
        setError('Invalid email or password');
        return false;
      }
    } catch (err) {
      setError('Authentication failed. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('gdg-admin-session');
    setIsAuthenticated(false);
    setCurrentAdmin(null);
    setError(null);
  };

  const value = {
    isAuthenticated,
    currentAdmin,
    login,
    logout,
    isLoading,
    error
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};