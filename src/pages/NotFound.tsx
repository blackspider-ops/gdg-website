import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { SiteStatusService } from "@/services/siteStatusService";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkMaintenanceMode = async () => {
      try {
        const status = await SiteStatusService.getSiteStatus();
        
        // If site is in maintenance mode, redirect to maintenance page instead of showing 404
        if (status && !status.is_live) {
          navigate('/maintenance', { replace: true });
          return;
        }
      } catch (error) {
        console.error('Error checking site status:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkMaintenanceMode();
  }, [location.pathname, navigate]);

  // Show loading while checking maintenance status
  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-foreground">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <a href="/" className="text-primary underline hover:text-primary/80">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
