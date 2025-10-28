import { useState } from 'react';
import { X, ExternalLink, RefreshCw, User } from 'lucide-react';
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

  if (!isOpen) return null;

  const handleIframeLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setHasError(false);
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
        // Extract form ID and convert to embed URL
        const formIdMatch = url.match(/\/forms\/d\/([a-zA-Z0-9-_]+)/);
        if (formIdMatch) {
          const formId = formIdMatch[1];
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
        return url; // Let iframe handle the redirect
      }
    }
    
    // For regular iframe embedding, return URL as-is
    return url;
  };

  const embedUrl = getEmbedUrl();

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
            {isAutoEmbed && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // Reload page with view=profile parameter to show the profile instead of auto-embed
                  const url = new URL(window.location.href);
                  url.searchParams.set('view', 'profile');
                  window.location.href = url.toString();
                }}
                className="text-gray-600 hover:text-gray-900 p-1 sm:p-2"
                title={`View ${profileName || 'profile'} page`}
              >
                <User className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            )}
            
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
                <p className="text-gray-600">Loading form...</p>
              </div>
            </div>
          )}

          {hasError && (
            <div className="absolute inset-0 flex items-center justify-center bg-white p-4">
              <div className="text-center max-w-sm sm:max-w-md mx-auto">
                <div className="text-red-500 mb-4">
                  <X className="w-8 h-8 sm:w-12 sm:h-12 mx-auto" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                  Unable to load content
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                  This content cannot be embedded. You can still access it by opening it in a new tab.
                </p>
                <div className="space-y-2 sm:space-y-3">
                  <Button onClick={handleRefresh} className="w-full text-sm sm:text-base">
                    <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    Try Again
                  </Button>
                  <Button variant="outline" onClick={handleOpenExternal} className="w-full text-sm sm:text-base">
                    <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    Open in New Tab
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
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
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
            {isAutoEmbed ? (
              <span className="flex items-center justify-center flex-wrap gap-1">
                <span className="hidden sm:inline">Press</span>
                <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs hidden sm:inline">Esc</kbd>
                <span className="hidden sm:inline">to view profile •</span>
                <User className="w-3 h-3 inline" />
                <span className="text-xs">Auto-opened from {profileName || 'profile'}</span>
              </span>
            ) : (
              <span>
                <span className="hidden sm:inline">Press </span>
                <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs hidden sm:inline">Esc</kbd>
                <span className="hidden sm:inline"> to close</span>
                <span className="sm:hidden">Tap outside to close</span>
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmbedModal;