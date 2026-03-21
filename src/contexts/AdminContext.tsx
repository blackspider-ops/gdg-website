import React, { createContext, useContext, useState, useEffect } from 'react';
import { AdminService } from '@/services/adminService';
import { ProfileMergingService, type MergedProfile } from '@/services/profileMergingService';
import { TeamManagementService, type AdminTeam, type TeamMembership } from '@/services/teamManagementService';
import { PermissionsService, type ResourceType, type PermissionAction } from '@/services/permissionsService';
import SessionService from '@/services/sessionService';
import type { AdminUser } from '@/lib/supabase';

interface AdminContextType {
  isAuthenticated: boolean;
  currentAdmin: AdminUser | null;
  mergedProfile: MergedProfile | null;
  // Team management
  userTeams: TeamMembership[];
  currentTeam: AdminTeam | null;
  setCurrentTeam: (team: AdminTeam | null) => void;
  refreshTeams: () => Promise<void>;
  // Permissions
  hasPermission: (resource: ResourceType, action: PermissionAction) => Promise<boolean>;
  canAccessPage: (path: string) => Promise<boolean>;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isTeamMember: boolean;
  // Auth
  login: (credentials: { username: string; password: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateTeamProfile: (teamData: {
    name: string;
    role: string;
    bio?: string;
    imageUrl?: string;
    linkedinUrl?: string;
    githubUrl?: string;
  }) => Promise<boolean>;
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
  const [mergedProfile, setMergedProfile] = useState<MergedProfile | null>(null);
  const [userTeams, setUserTeams] = useState<TeamMembership[]>([]);
  const [currentTeam, setCurrentTeam] = useState<AdminTeam | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Computed role checks
  const isSuperAdmin = currentAdmin?.role === 'super_admin';
  const isAdmin = currentAdmin?.role === 'admin' || isSuperAdmin;
  const isTeamMember = currentAdmin?.role === 'team_member';

  // Load user teams
  const refreshTeams = async () => {
    if (currentAdmin) {
      const teams = await TeamManagementService.getUserTeams(currentAdmin.id);
      setUserTeams(teams);
      
      // Set first team as current if none selected
      if (!currentTeam && teams.length > 0 && teams[0].team) {
        setCurrentTeam(teams[0].team);
      }
    }
  };

  // Permission helpers
  const hasPermission = async (resource: ResourceType, action: PermissionAction): Promise<boolean> => {
    return PermissionsService.hasPermission(currentAdmin, resource, action);
  };

  const canAccessPage = async (path: string): Promise<boolean> => {
    return PermissionsService.canAccessPage(currentAdmin, path);
  };

  // SECURITY FIX: Check for existing session using httpOnly cookies
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Validate session via httpOnly cookie
        const admin = await SessionService.validateSession();
        
        if (admin) {
          setCurrentAdmin(admin);
          setIsAuthenticated(true);
          
          // Get merged profile with team member data
          const profile = await ProfileMergingService.autoMergeOnLogin(admin);
          setMergedProfile(profile);
          
          // Load user teams
          const teams = await TeamManagementService.getUserTeams(admin.id);
          setUserTeams(teams);
          if (teams.length > 0 && teams[0].team) {
            setCurrentTeam(teams[0].team);
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
      }
    };

    checkSession();
  }, []);

  const login = async (credentials: { username: string; password: string }): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // SECURITY FIX: Use httpOnly cookie session
      const admin = await SessionService.login({
        email: credentials.username,
        password: credentials.password
      });
      
      if (admin) {
        setCurrentAdmin(admin);
        setIsAuthenticated(true);
        
        // Get merged profile with team member data
        const profile = await ProfileMergingService.autoMergeOnLogin(admin);
        setMergedProfile(profile);
        
        // Load user teams
        const teams = await TeamManagementService.getUserTeams(admin.id);
        setUserTeams(teams);
        if (teams.length > 0 && teams[0].team) {
          setCurrentTeam(teams[0].team);
        }
        
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

  const logout = async () => {
    // SECURITY FIX: Clear httpOnly cookie session
    await SessionService.logout();
    
    setIsAuthenticated(false);
    setCurrentAdmin(null);
    setMergedProfile(null);
    setUserTeams([]);
    setCurrentTeam(null);
    setError(null);
  };

  const refreshProfile = async () => {
    if (currentAdmin) {
      const profile = await ProfileMergingService.getMergedProfile(currentAdmin);
      setMergedProfile(profile);
    }
  };

  const updateTeamProfile = async (teamData: {
    name: string;
    role: string;
    bio?: string;
    imageUrl?: string;
    linkedinUrl?: string;
    githubUrl?: string;
  }): Promise<boolean> => {
    if (!currentAdmin) return false;
    
    const success = await ProfileMergingService.createOrUpdateTeamProfile(
      currentAdmin.id,
      teamData
    );
    
    if (success) {
      await refreshProfile();
    }
    
    return success;
  };

  const value = {
    isAuthenticated,
    currentAdmin,
    mergedProfile,
    // Team management
    userTeams,
    currentTeam,
    setCurrentTeam,
    refreshTeams,
    // Permissions
    hasPermission,
    canAccessPage,
    isSuperAdmin,
    isAdmin,
    isTeamMember,
    // Auth
    login,
    logout,
    refreshProfile,
    updateTeamProfile,
    isLoading,
    error
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};