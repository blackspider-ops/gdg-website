import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Mail } from 'lucide-react';
import { NewsletterService } from '@/services/newsletterService';

const NewsletterUnsubscribe = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const token = searchParams.get('token');

  useEffect(() => {
    const handleUnsubscribe = async () => {
      if (!token) {
        setStatus('error');
        return;
      }

      try {
        const success = await NewsletterService.unsubscribe(token);
        setStatus(success ? 'success' : 'error');
      } catch (error) {
        setStatus('error');
      }
    };

    handleUnsubscribe();
  }, [token]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-md mx-4 text-center">
        {status === 'loading' && (
          <div>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h1 className="text-2xl font-semibold mb-2">Processing unsubscribe request...</h1>
            <p className="text-muted-foreground">Please wait while we process your request.</p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <CheckCircle size={48} className="text-gdg-green mx-auto mb-4" />
            <h1 className="text-2xl font-semibold mb-2">Successfully Unsubscribed</h1>
            <p className="text-muted-foreground mb-6">
              You have been successfully unsubscribed from our newsletter. We're sorry to see you go, but you can always resubscribe on our website if you change your mind.
            </p>
            <div className="space-y-3">
              <Link 
                to="/#newsletter" 
                className="block w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Resubscribe to Newsletter
              </Link>
              <Link 
                to="/" 
                className="block w-full px-6 py-3 border border-border rounded-lg font-medium hover:bg-muted transition-colors"
              >
                Visit Website
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div>
            <XCircle size={48} className="text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-semibold mb-2">Unsubscribe Failed</h1>
            <p className="text-muted-foreground mb-6">
              We couldn't process your unsubscribe request. The unsubscribe link may be invalid or expired.
            </p>
            <div className="space-y-3">
              <Link 
                to="/contact" 
                className="block w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Contact Support
              </Link>
              <Link 
                to="/" 
                className="block w-full px-6 py-3 border border-border rounded-lg font-medium hover:bg-muted transition-colors"
              >
                Visit Website
              </Link>
            </div>
          </div>
        )}

        <div className="mt-8 p-4 bg-muted/50 rounded-lg">
          <Mail size={20} className="mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Questions about our newsletter? Contact us at{' '}
            <a href="mailto:gdg@psu.edu" className="text-primary hover:underline">
              gdg@psu.edu
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NewsletterUnsubscribe;