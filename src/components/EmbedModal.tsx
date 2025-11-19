import { useState, useEffect } from 'react';
import { X, ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmbedModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url: string;
  embedType: 'iframe' | 'google_form';
  isAutoEmbed?: boolean;
  profileName?: string;
}

const EmbedModal = ({ isOpen, onClose, title, url, embedType, isAutoEmbed = false, profileName }: EmbedModalProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);

  // For Google Forms, show the alternative interface immediately after a short delay
  useEffect(() => {
    if (isOpen && embedType === 'google_form') {
      const timer = setTimeout(() => {
        setIsLoading(false);
        setHasError(true);
      }, 1500); // Give it 1.5 seconds to try loading, then show alternatives

      return () => clearTimeout(timer);
    }
  }, [isOpen, embedType]);

  if (!isOpen) return null;

  const handleIframeLoad = () => {
    setIsLoading(false);
    setHasError(false);
    
    // For Google Forms, check if the content actually loaded properly
    if (embedType === 'google_form') {
      setTimeout(() => {
        const iframe = document.getElementById('google-form-iframe') as HTMLIFrameElement;
        if (iframe) {
          try {
            // Try to access iframe content to see if it's blocked
            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
            if (!iframeDoc) {
              // If we can't access the document, it might be blocked
              setHasError(true);
              setIsLoading(false);
            }
          } catch (error) {
            // Cross-origin error means the form loaded but we can't access it (which is normal)
            // This is actually a good sign for Google Forms
          }
        }
      }, 2000); // Give it 2 seconds to load
    }
  };

  const handleIframeError = () => {
    // For Google Forms, immediately show error since they often block embedding
    if (embedType === 'google_form') {
      setIsLoading(false);
      setHasError(true);
      return;
    }
    
    // Try alternative URL formats for other content types
    if (attemptCount < 2) {
      setAttemptCount(prev => prev + 1);
      setIsLoading(true);
      setHasError(false);
      
      // Force iframe reload with different URL format
      setTimeout(() => {
        const iframe = document.getElementById('google-form-iframe') as HTMLIFrameElement;
        if (iframe) {
          const newUrl = getAlternativeEmbedUrl(attemptCount + 1);
          iframe.src = newUrl;
        }
      }, 500);
    } else {
      setIsLoading(false);
      setHasError(true);
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setHasError(false);
    setAttemptCount(0);
    // Force iframe reload by changing src
    const iframe = document.getElementById('google-form-iframe') as HTMLIFrameElement;
    if (iframe) {
      const currentSrc = iframe.src;
      iframe.src = '';
      setTimeout(() => {
        iframe.src = currentSrc;
      }, 100);
    }
  };

  const handleOpenExternal = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Get the appropriate embed URL based on type
  const getEmbedUrl = () => {
    if (embedType === 'google_form') {
      // Handle Google Forms URLs
      if (url.includes('docs.google.com/forms')) {
        // Extract form ID from various URL formats
        let formId = '';
        
        // Try different patterns to extract form ID
        const patterns = [
          /\/forms\/d\/([a-zA-Z0-9-_]+)/,
          /\/forms\/d\/e\/([a-zA-Z0-9-_]+)/,
          /\/forms\/([a-zA-Z0-9-_]+)/
        ];
        
        for (const pattern of patterns) {
          const match = url.match(pattern);
          if (match) {
            formId = match[1];
            break;
          }
        }
        
        if (formId) {
          // Use the most reliable embed format
          return `https://docs.google.com/forms/d/e/${formId}/viewform?embedded=true`;
        }
        
        // If already in embed format, return as-is
        if (url.includes('embedded=true')) {
          return url;
        }
        
        // Add embedded parameter to existing URL
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}embedded=true`;
      }
      
      // Handle forms.gle short URLs
      if (url.includes('forms.gle')) {
        // For short URLs, we need to let them redirect first, then add embed params
        return url;
      }
    }
    
    // For YouTube URLs, convert to embed format
    if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
      let videoId = '';
      
      if (url.includes('youtube.com/watch')) {
        const match = url.match(/[?&]v=([^&]+)/);
        if (match) videoId = match[1];
      } else if (url.includes('youtu.be/')) {
        const match = url.match(/youtu\.be\/([^?&]+)/);
        if (match) videoId = match[1];
      }
      
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }
    
    // For regular iframe embedding, return URL as-is
    return url;
  };

  // Get alternative embed URLs for fallback attempts
  const getAlternativeEmbedUrl = (attempt: number) => {
    if (embedType === 'google_form' && url.includes('docs.google.com/forms')) {
      // Extract form ID from various URL formats
      let formId = '';
      const patterns = [
        /\/forms\/d\/([a-zA-Z0-9-_]+)/,
        /\/forms\/d\/e\/([a-zA-Z0-9-_]+)/,
        /\/forms\/([a-zA-Z0-9-_]+)/
      ];
      
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
          formId = match[1];
          break;
        }
      }
      
      if (formId) {
        switch (attempt) {
          case 1:
            return `https://docs.google.com/forms/d/${formId}/viewform?embedded=true`;
          case 2:
            return `https://docs.google.com/forms/d/e/${formId}/viewform?embedded=true`;
          default:
            return url; // Fall back to original URL
        }
      }
    }
    
    // For other types, just return the original URL
    return url;
  };

  const embedUrl = attemptCount > 0 ? getAlternativeEmbedUrl(attemptCount) : getEmbedUrl();

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        // Close modal when clicking outside on mobile
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-lg sm:rounded-2xl shadow-2xl w-full max-w-4xl h-[95vh] sm:h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-gray-50">
          <div className="flex-1 min-w-0 pr-2">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
              {title}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 truncate">
              {embedType === 'google_form' ? 'Google Form' : 'Embedded Content'}
            </p>
          </div>
          
          <div className="flex items-center space-x-1 sm:space-x-2 ml-2 sm:ml-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="text-gray-600 hover:text-gray-900 p-1 sm:p-2 hidden sm:flex"
              title="Refresh content"
            >
              <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenExternal}
              className="text-gray-600 hover:text-gray-900 p-1 sm:p-2"
              title="Open in new tab"
            >
              <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-600 hover:text-gray-900 p-1 sm:p-2"
            >
              <X className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 relative bg-gray-100">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">
                  {embedType === 'google_form' ? 'Checking form availability...' : 'Loading content...'}
                </p>
              </div>
            </div>
          )}

          {hasError && (
            <div className="absolute inset-0 flex items-center justify-center bg-white p-4">
              <div className="text-center max-w-sm sm:max-w-md mx-auto">
                {embedType === 'google_form' ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-4">
                    <div className="text-blue-600 mb-4">
                      <svg className="w-12 h-12 mx-auto" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {title || 'Google Form Ready'}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      This Google Form is ready to use! Google blocks embedding for security, but you can access it directly.
                    </p>
                  </div>
                ) : (
                  <div className="text-red-500 mb-4">
                    <X className="w-8 h-8 sm:w-12 sm:h-12 mx-auto" />
                  </div>
                )}
                
                {!embedType || embedType !== 'google_form' ? (
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                    Unable to load content
                  </h3>
                ) : null}
                
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                  {embedType === 'google_form' 
                    ? "Choose how you'd like to access this form:"
                    : "This content cannot be embedded. You can still access it by opening it in a new tab."
                  }
                </p>
                <div className="space-y-2 sm:space-y-3">
                  {embedType !== 'google_form' && (
                    <Button onClick={handleRefresh} className="w-full text-sm sm:text-base">
                      <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      Try Again
                    </Button>
                  )}
                  <Button 
                    onClick={() => {
                      // On mobile, open directly in new tab instead of popup
                      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                      
                      if (isMobile) {
                        // Mobile: open in new tab
                        window.open(url, '_blank', 'noopener,noreferrer');
                      } else {
                        // Desktop: try popup window
                        const popup = window.open(
                          url, 
                          'embeddedcontent', 
                          'width=900,height=700,scrollbars=yes,resizable=yes,toolbar=no,menubar=no'
                        );
                        if (popup) {
                          popup.focus();
                        } else {
                          // Fallback if popup blocked
                          window.open(url, '_blank', 'noopener,noreferrer');
                        }
                      }
                    }} 
                    className="w-full text-sm sm:text-base"
                    variant={embedType === 'google_form' ? 'default' : 'outline'}
                  >
                    <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    {embedType === 'google_form' ? 'Open Form' : 'Open Content'}
                  </Button>
                  <Button variant="outline" onClick={handleOpenExternal} className="w-full text-sm sm:text-base">
                    <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    {embedType === 'google_form' ? 'Open Form in New Tab' : 'Open in New Tab'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <iframe
            id="google-form-iframe"
            src={embedUrl}
            className="w-full h-full border-0"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-top-navigation allow-top-navigation-by-user-activation"
            style={{ 
              // Improve mobile scrolling within iframe
              WebkitOverflowScrolling: 'touch',
              // Prevent zoom on mobile
              touchAction: 'manipulation'
            }}
          />
        </div>

        {/* Footer */}
        <div className="p-2 sm:p-3 border-t bg-gray-50 text-center">
          <p className="text-xs text-gray-500">
            <span>
              <span className="hidden sm:inline">Press </span>
              <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs hidden sm:inline">Esc</kbd>
              <span className="hidden sm:inline"> to close</span>
              <span className="sm:hidden">Tap outside to close</span>
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmbedModal;