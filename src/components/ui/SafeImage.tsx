import React, { useState } from 'react';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: React.ReactNode;
  fallbackText?: string;
}

const SafeImage: React.FC<SafeImageProps> = ({ 
  src, 
  alt, 
  fallback, 
  fallbackText,
  className,
  ...props 
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  if (hasError) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    // Default fallback - create initials from alt text
    const initials = (alt || fallbackText || 'IMG')
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);

    return (
      <div className={`bg-primary/10 rounded flex items-center justify-center text-primary font-semibold ${className}`}>
        <span className="text-sm">{initials}</span>
      </div>
    );
  }

  return (
    <>
      {isLoading && (
        <div className={`bg-gray-200 animate-pulse rounded ${className}`} />
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${isLoading ? 'hidden' : ''}`}
        onError={handleError}
        onLoad={handleLoad}
        {...props}
      />
    </>
  );
};

export default SafeImage;