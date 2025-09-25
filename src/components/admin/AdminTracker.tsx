import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAdmin } from '@/contexts/AdminContext';
import { AuditService } from '@/services/auditService';

// Component that automatically tracks admin page navigation
const AdminTracker = () => {
  const { currentAdmin } = useAdmin();
  const location = useLocation();

  useEffect(() => {
    if (!currentAdmin?.id) return;

    // Map routes to page names and actions
    const getPageInfo = (pathname: string) => {
      const routeMap: Record<string, { name: string; action: string; title: string }> = {
        '/admin': { 
          name: 'Admin Dashboard', 
          action: 'view_admin_dashboard',
          title: 'Dashboard'
        },
        '/admin/content': { 
          name: 'Admin Content', 
          action: 'view_admin_content',
          title: 'Content Management'
        },
        '/admin/events': { 
          name: 'Admin Events', 
          action: 'view_admin_events',
          title: 'Events Management'
        },
        '/admin/team': { 
          name: 'Admin Team', 
          action: 'view_admin_team',
          title: 'Team Management'
        },
        '/admin/members': { 
          name: 'Admin Members', 
          action: 'view_admin_members',
          title: 'Members Management'
        },
        '/admin/resources': { 
          name: 'Admin Resources', 
          action: 'view_admin_resources',
          title: 'Resources Management'
        },
        '/admin/newsletter': { 
          name: 'Admin Newsletter', 
          action: 'view_admin_newsletter',
          title: 'Newsletter Management'
        },
        '/admin/blog': { 
          name: 'Admin Blog', 
          action: 'view_admin_blog',
          title: 'Blog Management'
        },
        '/admin/users': { 
          name: 'Admin Users', 
          action: 'view_admin_users',
          title: 'User Management'
        },
        '/admin/profile': { 
          name: 'Admin Profile', 
          action: 'view_admin_profile',
          title: 'Profile Settings'
        },
        '/admin/sponsors': { 
          name: 'Admin Sponsors', 
          action: 'view_admin_sponsors',
          title: 'Sponsors Management'
        },
        '/admin/communications': { 
          name: 'Admin Communications', 
          action: 'view_admin_communications',
          title: 'Communications Hub'
        },
        '/admin/media': { 
          name: 'Admin Media', 
          action: 'view_admin_media',
          title: 'Media Library'
        },
        '/admin/guide': { 
          name: 'Admin Guide', 
          action: 'view_admin_guide',
          title: 'Admin Guide'
        },
        '/admin/linktree': { 
          name: 'Admin Linktree', 
          action: 'view_admin_linktree',
          title: 'Linktree Management'
        }
      };

      return routeMap[pathname] || { 
        name: 'Admin Page', 
        action: 'view_admin_page',
        title: 'Admin Section'
      };
    };

    const pageInfo = getPageInfo(location.pathname);

    // Log the page access with error handling
    try {
      AuditService.logAction(
        currentAdmin.id,
        pageInfo.action as any,
        undefined,
        {
          description: `Navigated to ${pageInfo.title}`,
          page_name: pageInfo.name,
          page_title: pageInfo.title,
          route: location.pathname,
          search_params: location.search,
          hash: location.hash,
          timestamp: new Date().toISOString(),
          admin_role: currentAdmin.role,
          admin_email: currentAdmin.email,
          referrer: document.referrer || 'direct',
          user_agent: navigator.userAgent?.substring(0, 500),
          screen_resolution: `${screen.width}x${screen.height}`,
          viewport_size: `${window.innerWidth}x${window.innerHeight}`
        },
        undefined, // target_id
        undefined, // target_type
        undefined, // Skip IP address to avoid database errors
        undefined  // Skip user_agent parameter, it's in details
      );
    } catch (error) {
      // Silently handle audit logging errors to not break the app
      if (process.env.NODE_ENV === 'development') {
        console.warn('Admin tracking failed:', error);
      }
    }
  }, [location.pathname, location.search, currentAdmin?.id, currentAdmin?.role, currentAdmin?.email]);

  return null; // This component doesn't render anything
};

export default AdminTracker;