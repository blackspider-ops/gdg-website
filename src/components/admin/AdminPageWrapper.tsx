import React, { useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { useAuditTracking } from '@/hooks/useAuditTracking';

interface AdminPageWrapperProps {
  children: React.ReactNode;
  pageName: string;
  pageTitle?: string;
  trackingOptions?: {
    trackPageView?: boolean;
    trackPageExit?: boolean;
    trackFormSubmissions?: boolean;
    trackNavigation?: boolean;
  };
}

const AdminPageWrapper: React.FC<AdminPageWrapperProps> = ({ 
  children, 
  pageName, 
  pageTitle,
  trackingOptions = {
    trackPageView: true,
    trackPageExit: true,
    trackFormSubmissions: true,
    trackNavigation: true
  }
}) => {
  const { currentAdmin } = useAdmin();
  
  // Initialize comprehensive audit tracking for this admin page
  const { logAction } = useAuditTracking(pageName, trackingOptions);

  // Track initial page access
  useEffect(() => {
    if (currentAdmin?.id) {
      // Log the specific admin section access
      logAction('access_admin_section', undefined, {
        description: `Accessed ${pageTitle || pageName} section`,
        section_name: pageName,
        page_title: pageTitle,
        access_time: new Date().toISOString(),
        admin_role: currentAdmin.role,
        admin_email: currentAdmin.email
      });
    }
  }, [currentAdmin?.id, pageName, pageTitle, logAction]);

  return <>{children}</>;
};

export default AdminPageWrapper;