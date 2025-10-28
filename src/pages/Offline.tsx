import React from 'react';
import { WifiOff, RefreshCw, Home, AlertTriangle, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

const OfflinePage = () => {
  const navigate = useNavigate();

  const handleRetry = () => {
    // Check if we're back online
    if (navigator.onLine) {
      window.location.reload();
    } else {
      // Still offline, just reload to trigger the check again
      window.location.reload();
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      {/* Background gradient overlay to match your design */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      
      <div className="max-w-lg w-full space-y-6 relative z-10 animate-fade-in">
        {/* Offline Icon with GDG colors */}
        <div className="text-center">
          <div className="mx-auto w-32 h-32 bg-card border border-border rounded-2xl flex items-center justify-center mb-8 shadow-lg">
            <div className="relative">
              <WifiOff className="w-16 h-16 text-muted-foreground" />
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-destructive rounded-full flex items-center justify-center">
                <AlertTriangle className="w-3 h-3 text-destructive-foreground" />
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">You're Offline</h1>
          <p className="text-muted-foreground text-lg">
            Looks like your internet connection took a break
          </p>
        </div>

        {/* Main Card with your design system */}
        <Card className="border-border shadow-xl">
          <CardHeader className="text-center pb-4">
            <CardDescription className="text-base">
              Don't worry! Here are some things you can try to get back online:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Troubleshooting steps */}
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Wifi className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Check your connection</p>
                  <p className="text-sm text-muted-foreground">Make sure WiFi is enabled and you're connected</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <RefreshCw className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Refresh the page</p>
                  <p className="text-sm text-muted-foreground">Sometimes a simple refresh does the trick</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Home className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Try other websites</p>
                  <p className="text-sm text-muted-foreground">Check if the issue is with your connection or just our site</p>
                </div>
              </div>
            </div>

            {/* Action buttons with your color scheme */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button onClick={handleRetry} className="flex-1 bg-primary hover:bg-primary/90">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button variant="outline" onClick={handleGoHome} className="flex-1">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Features affected - matching your info card style */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-accent" />
              Limited Functionality
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>While offline, these features won't work:</p>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-destructive rounded-full"></div>
                <span>New content</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-destructive rounded-full"></div>
                <span>Form submissions</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-destructive rounded-full"></div>
                <span>Real-time updates</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-destructive rounded-full"></div>
                <span>External links</span>
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground/80 italic">
              We'll automatically restore full functionality when your connection returns.
            </p>
          </CardContent>
        </Card>

        {/* Connection Status with your design */}
        <div className="text-center">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-destructive/10 border border-destructive/20 text-destructive rounded-full text-sm font-medium">
            <div className="w-2 h-2 bg-destructive rounded-full animate-pulse"></div>
            Connection Status: Offline
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfflinePage;