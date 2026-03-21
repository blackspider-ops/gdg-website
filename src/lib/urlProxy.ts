/**
 * Utility to proxy Supabase storage URLs through our domain
 * This hides the Supabase infrastructure from public view
 */

export function proxyStorageUrl(url: string | null | undefined): string {
  if (!url) return '';
  
  // If it's already a proxied URL, return as-is
  if (url.startsWith('/api/media')) {
    return url;
  }
  
  // If it's a full Supabase storage URL, extract the path and proxy it
  if (url.includes('supabase.co/storage/v1/object/public/')) {
    const match = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
    if (match) {
      const bucket = match[1];
      const path = match[2];
      
      // Only proxy the media bucket (others might need different handling)
      if (bucket === 'media') {
        return `/api/media?path=${encodeURIComponent(path)}`;
      }
    }
  }
  
  // If it's just a path (no domain), proxy it
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `/api/media?path=${encodeURIComponent(url)}`;
  }
  
  // For external URLs (not Supabase), return as-is
  return url;
}
