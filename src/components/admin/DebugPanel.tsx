import React from 'react';
import { useContent } from '@/contexts/ContentContext';
import { useAdmin } from '@/contexts/AdminContext';

const DebugPanel = () => {
  const { 
    siteSettings, 
    pageContent, 
    navigationItems, 
    footerContent,
    isLoading
  } = useContent();
  
  const { isAuthenticated, currentAdmin } = useAdmin();

  return (
    <div className="bg-card border border-border rounded-lg p-6 mb-6">
      <h3 className="font-semibold text-lg mb-4">Debug Information</h3>
      
      <div className="space-y-4 text-sm">
        <div>
          <strong>Authentication:</strong> {isAuthenticated ? 'Yes' : 'No'}
        </div>
        
        <div>
          <strong>Current Admin:</strong> {currentAdmin?.email || 'None'}
        </div>
        
        <div>
          <strong>Content Loading:</strong> {isLoading ? 'Loading...' : 'Complete'}
        </div>
        
        <div>
          <strong>Site Settings Count:</strong> {Object.keys(siteSettings).length}
        </div>
        
        <div>
          <strong>Page Content Count:</strong> {Object.keys(pageContent).length}
        </div>
        
        <div>
          <strong>Navigation Items:</strong> {navigationItems.length}
        </div>
        
        <div>
          <strong>Social Links:</strong> 0 (centralized system)
        </div>
        
        <div>
          <strong>Footer Content:</strong> {Object.keys(footerContent).length}
        </div>

        <div>
          <strong>Environment Check:</strong>
          <ul className="ml-4 mt-2">
            <li>Supabase URL: {import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</li>
            <li>Supabase Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</li>
          </ul>
        </div>

        {Object.keys(siteSettings).length > 0 && (
          <div>
            <strong>Sample Site Settings:</strong>
            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
              {JSON.stringify(siteSettings, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default DebugPanel;