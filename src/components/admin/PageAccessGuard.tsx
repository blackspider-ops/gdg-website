import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdmin } from '@/contexts/AdminContext';
import { PermissionsService } from '@/services/permissionsService';
import { Shield, Lock } from 'lucide-react';

interface PageAccessGuardProps {
  children: React.ReactNode;
}

/**
 * Component that enforces page access based on user role and team permissions.
 * Wraps admin pages to check if the current user has access.
 */
const PageAccessGuard: React.FC<PageAccessGuardProps> = ({ children }) => {
  const { currentAdmin, isAuthenticated } = useAdmin();
  const location = useLocation();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkAccess();
  }, [currentAdmin, location.pathname]);

  const checkAccess = async () => {
    if (!currentAdmin) {
      setHasAccess(false);
      setIsChecking(false);
      return;
    }

    setIsChecking(true);
    try {
      const canAccess = await PermissionsService.canAccessPage(currentAdmin, location.pathname);
      setHasAccess(canAccess);
    } catch (error) {
      console.error('Error checking page access:', error);
      setHasAccess(false);
    } finally {
      setIsChecking(false);
    }
  };

  // Not authenticated - redirect to home
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Still checking access
  if (isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-8 h-8 animate-pulse text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Checking access...</p>
        </div>
      </div>
    );
  }

  // No access - show access denied
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card rounded-xl border border-border p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You don't have permission to access this page. This page may be restricted to specific teams or roles.
          </p>
          <div className="space-y-3">
            <a
              href="/admin"
              className="block w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Go to Dashboard
            </a>
            <p className="text-xs text-muted-foreground">
              If you believe you should have access, contact your team lead or administrator.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Has access - render children
  return <>{children}</>;
};

export default PageAccessGuard;
