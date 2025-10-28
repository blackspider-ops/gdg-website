import React from 'react';
import { WifiOff, RefreshCw, Home, AlertTriangle, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const OfflinePage = () => {
  const navigate = useNavigate();
  const [isRetrying, setIsRetrying] = React.useState(false);

  const handleRetry = async () => {
    if (isRetrying) return;
    setIsRetrying(true);

    try {
      // First check if navigator says we're online
      if (!navigator.onLine) {
        // Still offline according to navigator, show a message instead of reloading
        toast.error('Still offline', {
          description: 'Please check your internet connection and try again',
          duration: 3000,
        });
        return;
      }

      // Navigator says we're online, but let's verify with a real connection test
      const response = await fetch('/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      if (response.ok) {
        // We're really back online, show success and reload
        toast.success('Connection restored!', {
          description: 'Reloading the page...',
          duration: 2000,
        });
        setTimeout(() => window.location.reload(), 500);
      } else {
        throw new Error('Connection test failed');
      }
    } catch (error) {
      // Connection test failed, we're still offline
      toast.error('Connection test failed', {
        description: 'Unable to reach the server. Please try again.',
        duration: 3000,
      });
    } finally {
      setTimeout(() => setIsRetrying(false), 2000);
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-3 sm:p-4 lg:p-6 relative overflow-hidden">
      {/* Background gradient overlay to match your design */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      
      <div className="max-w-sm sm:max-w-md lg:max-w-lg w-full space-y-4 sm:space-y-6 relative z-10 animate-fade-in">
        {/* Offline Icon with GDG colors - responsive sizing */}
        <div className="text-center">
          <div className="mx-auto w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 bg-card border border-border rounded-xl sm:rounded-2xl flex items-center justify-center mb-6 sm:mb-8 shadow-lg">
            <div className="relative">
              <WifiOff className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 text-muted-foreground" />
              <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-5 h-5 sm:w-6 sm:h-6 bg-destructive rounded-full flex items-center justify-center">
                <AlertTriangle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-destructive-foreground" />
              </div>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">You're Offline</h1>
          <p className="text-muted-foreground text-base sm:text-lg px-2 sm:px-0">
            Looks like your internet connection took a break
          </p>
        </div>

        {/* Main Card with your design system - responsive padding */}
        <Card className="border-border shadow-xl">
          <CardHeader className="text-center pb-3 sm:pb-4 px-4 sm:px-6">
            <CardDescription className="text-sm sm:text-base">
              Don't worry! Here are some things you can try to get back online:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
            {/* Troubleshooting steps - responsive layout */}
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-muted/50">
                <Wifi className="w-4 h-4 sm:w-5 sm:h-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground text-sm sm:text-base">Check your connection</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Make sure WiFi is enabled and you're connected</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-muted/50">
                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground text-sm sm:text-base">Refresh the page</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Sometimes a simple refresh does the trick</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-muted/50">
                <Home className="w-4 h-4 sm:w-5 sm:h-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground text-sm sm:text-base">Try other websites</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Check if the issue is with your connection or just our site</p>
                </div>
              </div>
            </div>

            {/* Action buttons with your color scheme - responsive stacking */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-4">
              <Button 
                onClick={handleRetry} 
                disabled={isRetrying}
                className="w-full sm:flex-1 bg-primary hover:bg-primary/90 disabled:opacity-50 text-sm sm:text-base py-2.5 sm:py-3"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
                {isRetrying ? 'Checking...' : 'Try Again'}
              </Button>
              <Button variant="outline" onClick={handleGoHome} className="w-full sm:flex-1 text-sm sm:text-base py-2.5 sm:py-3">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Features affected - matching your info card style with responsive design */}
        <Card className="border-border/50">
          <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-accent flex-shrink-0" />
              <span>Limited Functionality</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs sm:text-sm text-muted-foreground space-y-2 px-4 sm:px-6">
            <p>While offline, these features won't work:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 mt-2 sm:mt-3">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-destructive rounded-full flex-shrink-0"></div>
                <span className="text-xs sm:text-sm">New content</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-destructive rounded-full flex-shrink-0"></div>
                <span className="text-xs sm:text-sm">Form submissions</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-destructive rounded-full flex-shrink-0"></div>
                <span className="text-xs sm:text-sm">Real-time updates</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-destructive rounded-full flex-shrink-0"></div>
                <span className="text-xs sm:text-sm">External links</span>
              </div>
            </div>
            <p className="mt-3 sm:mt-4 text-xs text-muted-foreground/80 italic">
              We'll automatically restore full functionality when your connection returns.
            </p>
          </CardContent>
        </Card>

        {/* Connection Status with your design - responsive sizing */}
        <div className="text-center px-4 sm:px-0">
          <div className="inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 bg-destructive/10 border border-destructive/20 text-destructive rounded-full text-xs sm:text-sm font-medium">
            <div className="w-2 h-2 bg-destructive rounded-full animate-pulse flex-shrink-0"></div>
            <span>Connection Status: Offline</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfflinePage;