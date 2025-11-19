// Utility functions for testing site status functionality

import { SiteStatusService } from '@/services/siteStatusService';

export const testSiteStatus = {
  // Enable maintenance mode (redirect all non-linktree pages)
  enableMaintenanceMode: async () => {
    const result = await SiteStatusService.updateSiteStatus({
      is_live: false,
      redirect_url: 'https://www.gdgpsu.dev/l/applicationcabn',
      message: 'Site is currently under maintenance. Please check our linktree for updates.'
    });
    console.log('Maintenance mode enabled:', result);
    return result;
  },

  // Disable maintenance mode (site goes live)
  disableMaintenanceMode: async () => {
    const result = await SiteStatusService.updateSiteStatus({
      is_live: true,
      redirect_url: 'https://www.gdgpsu.dev/l/applicationcabn',
      message: 'Site is live and fully operational.'
    });
    console.log('Maintenance mode disabled:', result);
    return result;
  },

  // Check current status
  checkStatus: async () => {
    const status = await SiteStatusService.getSiteStatus();
    console.log('Current site status:', status);
    return status;
  },

  // Test redirect logic for a specific path
  testRedirect: async (path: string) => {
    const result = await SiteStatusService.shouldRedirect(path);
    console.log(`Redirect test for "${path}":`, result);
    return result;
  },

  // Clear cache (useful for testing)
  clearCache: () => {
    SiteStatusService.clearCache();
    console.log('Site status cache cleared');
  }
};

// Add to window for easy testing in dev tools
if (import.meta.env.DEV) {
  (window as any).siteStatusUtils = testSiteStatus;
}