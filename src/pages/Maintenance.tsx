import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Construction, Home, ExternalLink, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SiteStatusService } from '@/services/siteStatusService';

const MaintenancePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [maintenanceMessage, setMaintenanceMessage] = useState('Site is currently under maintenance. Please check back soon!');
  const [redirectUrl, setRedirectUrl] = useState('');
  const [buttonText, setButtonText] = useState('Visit Our Links');
  const [autoRedirect, setAutoRedirect] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMaintenanceInfo = async () => {
      try {
        const status = await SiteStatusService.getSiteStatus();
        if (status) {
          setMaintenanceMessage(status.message || 'Site is currently under maintenance. Please check back soon!');
          setRedirectUrl(status.redirect_url || '');
          setButtonText(status.button_text || 'Visit Our Links');
          setAutoRedirect(status.auto_redirect !== undefined ? status.auto_redirect : true);
          
          // Only auto-redirect if this was an automatic redirect (not manual navigation)
          const wasAutoRedirect = searchParams.get('auto') === 'true';
          
          if (status.auto_redirect && status.redirect_url && wasAutoRedirect) {
            window.location.href = status.redirect_url;
            return;
          }
        }
      } catch (error) {
        console.error('Error loading maintenance info:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMaintenanceInfo();
  }, []);

  const handleGoHome = () => {
    navigate('/');
  };

  const handleVisitLinktree = () => {
    if (redirectUrl) {
      window.open(redirectUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-3 sm:p-4 lg:p-6 relative overflow-hidden">
      {/* Background gradient overlay to match your design */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      
      <div className="max-w-sm sm:max-w-md lg:max-w-lg w-full space-y-4 sm:space-y-6 relative z-10 animate-fade-in">
        {/* Maintenance Icon with GDG colors */}
        <div className="text-center">
          <div className="mx-auto w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 bg-card border border-border rounded-xl sm:rounded-2xl flex items-center justify-center mb-6 sm:mb-8 shadow-lg">
            <div className="relative">
              <Construction className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 text-primary" />
              <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-5 h-5 sm:w-6 sm:h-6 bg-accent rounded-full flex items-center justify-center">
                <AlertTriangle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-accent-foreground" />
              </div>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">Under Maintenance</h1>
          <p className="text-muted-foreground text-base sm:text-lg px-2 sm:px-0">
            We're making some improvements
          </p>
        </div>

        {/* Main Card with your design system */}
        <Card className="border-border shadow-xl">
          <CardHeader className="text-center pb-3 sm:pb-4 px-4 sm:px-6">
            <CardTitle className="flex items-center justify-center gap-2 text-lg sm:text-xl">
              <Clock className="w-5 h-5 text-primary" />
              Temporary Downtime
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              {loading ? 'Loading...' : maintenanceMessage}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
            {/* What's happening */}
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-muted/50">
                <Construction className="w-4 h-4 sm:w-5 sm:h-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground text-sm sm:text-base">System Updates</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">We're improving our platform for a better experience</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-muted/50">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground text-sm sm:text-base">Expected Duration</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">We'll be back online shortly</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-muted/50">
                <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground text-sm sm:text-base">Stay Connected</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Visit our links page for updates and resources</p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-4">
              {redirectUrl && !autoRedirect && (
                <Button 
                  onClick={handleVisitLinktree} 
                  className="w-full sm:flex-1 bg-primary hover:bg-primary/90 text-sm sm:text-base py-2.5 sm:py-3"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  {buttonText}
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={handleGoHome} 
                className="w-full sm:flex-1 text-sm sm:text-base py-2.5 sm:py-3"
              >
                <Home className="w-4 h-4 mr-2" />
                Try Home Page
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <Card className="border-border/50">
          <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-accent flex-shrink-0" />
              <span>What You Can Do</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs sm:text-sm text-muted-foreground space-y-2 px-4 sm:px-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0"></div>
                <span className="text-xs sm:text-sm">Check our social media</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0"></div>
                <span className="text-xs sm:text-sm">Visit our links page</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0"></div>
                <span className="text-xs sm:text-sm">Try again in a few minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0"></div>
                <span className="text-xs sm:text-sm">Contact us if urgent</span>
              </div>
            </div>
            <p className="mt-3 sm:mt-4 text-xs text-muted-foreground/80 italic">
              Thank you for your patience while we improve your experience.
            </p>
          </CardContent>
        </Card>

        {/* Status indicator */}
        <div className="text-center px-4 sm:px-0">
          <div className="inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 bg-accent/10 border border-accent/20 text-accent rounded-full text-xs sm:text-sm font-medium">
            <div className="w-2 h-2 bg-accent rounded-full animate-pulse flex-shrink-0"></div>
            <span>Maintenance in Progress</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenancePage;