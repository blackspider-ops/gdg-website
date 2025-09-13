import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Mail } from 'lucide-react';
import { NewsletterService } from '@/services/newsletterService';

const NewsletterConfirm = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const token = searchParams.get('token');

  useEffect(() => {
    const confirmSubscription = async () => {
      if (!token) {
        setStatus('error');
        return;
      }

      try {
        const success = await NewsletterService.confirmSubscription(token);
        setStatus(success ? 'success' : 'error');
      } catch (error) {
        setStatus('error');
      }
    };

    confirmSubscription();
  }, [token]);

  return (
    <div className="min-h-screen bg-background pt-16 flex items-center justify-center">
      <div className="max-w-md mx-4 text-center">
        {status === 'loading' && (
          <div>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h1 className="text-2xl font-semibold mb-2">Confirming your subscription...</h1>
            <p className="text-muted-foreground">Please wait while we process your confirmation.</p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <CheckCircle size={48} className="text-gdg-green mx-auto mb-4" />
            <h1 className="text-2xl font-semibold mb-2">Subscription Confirmed! 🎉</h1>
            <p className="text-muted-foreground mb-6">
              Thank you for subscribing to our newsletter. You'll now receive updates about upcoming events, workshops, and community highlights.
            </p>
            <div className="space-y-3">
              <Link 
                to="/events" 
                className="block w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                View Upcoming Events
              </Link>
              <Link 
                to="/" 
                className="block w-full px-6 py-3 border border-border rounded-lg font-medium hover:bg-muted transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div>
            <XCircle size={48} className="text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-semibold mb-2">Confirmation Failed</h1>
            <p className="text-muted-foreground mb-6">
              We couldn't confirm your newsletter subscription. The confirmation link may be invalid or expired.
            </p>
            <div className="space-y-3">
              <Link 
                to="/" 
                className="block w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Try Subscribing Again
              </Link>
              <Link 
                to="/contact" 
                className="block w-full px-6 py-3 border border-border rounded-lg font-medium hover:bg-muted transition-colors"
              >
                Contact Support
              </Link>
            </div>
          </div>
        )}

        <div className="mt-8 p-4 bg-muted/50 rounded-lg">
          <Mail size={20} className="mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Questions about our newsletter? Contact us at{' '}
            <a href="mailto:newsletter@gdg.dev" className="text-primary hover:underline">
              newsletter@gdg.dev
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NewsletterConfirm;