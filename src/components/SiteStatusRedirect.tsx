import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SiteStatusService } from '@/services/siteStatusService';

// Import test utilities in development
if (import.meta.env.DEV) {
  import('@/utils/siteStatusUtils');
}

const SiteStatusRedirect: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const checkSiteStatus = async () => {
      try {
        const result = await SiteStatusService.shouldRedirect(location.pathname);
        
        if (result.shouldRedirect) {
          if (result.redirectUrl) {
            // Redirect to the specified URL
            window.location.href = result.redirectUrl;
            return;
          } else {
            // No redirect URL specified, show maintenance page
            navigate('/maintenance', { replace: true });
            return;
          }
        }
        
        // Site is live or this is an allowed page, render normally
        setShouldRender(true);
      } catch (error) {
        console.error('Error checking site status:', error);
        // On error, allow normal rendering (fail open)
        setShouldRender(true);
      } finally {
        setIsChecking(false);
      }
    };

    checkSiteStatus();
  }, [location.pathname, navigate]);

  // Show loading while checking status
  if (isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Render children if we should render
  return shouldRender ? <>{children}</> : null;
};

export default SiteStatusRedirect;