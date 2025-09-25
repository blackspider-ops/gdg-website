import { useEffect, useCallback, useRef } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { AuditService, type AuditActionType } from '@/services/auditService';

interface AuditTrackingOptions {
  // Page-level tracking
  trackPageView?: boolean;
  trackPageExit?: boolean;
  
  // Form tracking
  trackFormSubmissions?: boolean;
  trackFormChanges?: boolean;
  
  // Navigation tracking
  trackNavigation?: boolean;
  
  // Custom tracking
  customActions?: string[];
}

export const useAuditTracking = (
  pageName: string,
  options: AuditTrackingOptions = {}
) => {
  const { currentAdmin } = useAdmin();
  const pageStartTime = useRef<number>(Date.now());
  const lastAction = useRef<string>('');
  const actionCount = useRef<number>(0);

  const {
    trackPageView = true,
    trackPageExit = true,
    trackFormSubmissions = true,
    trackFormChanges = false,
    trackNavigation = true
  } = options;

  // Log an audit action with deduplication and error handling
  const logAction = useCallback(async (
    action: AuditActionType,
    targetEmail?: string,
    details?: any,
    targetId?: string,
    targetType?: string
  ) => {
    if (!currentAdmin?.id) return false;

    try {
      const enhancedDetails = {
        ...details,
        page: pageName,
        session_duration: Date.now() - pageStartTime.current,
        action_sequence: ++actionCount.current,
        previous_action: lastAction.current
      };

      lastAction.current = action;

      return await AuditService.logAction(
        currentAdmin.id,
        action,
        targetEmail,
        enhancedDetails,
        targetId,
        targetType,
        undefined, // Skip IP address
        undefined  // Skip user agent here, it's in details
      );
    } catch (error) {
      // Silently handle audit errors to not break the app
      if (process.env.NODE_ENV === 'development') {
        console.warn('Audit action failed:', error);
      }
      return false;
    }
  }, [currentAdmin?.id, pageName]);

  // Track page view
  useEffect(() => {
    if (trackPageView && currentAdmin?.id) {
      // Map page names to specific audit actions
      const getPageAction = (page: string): AuditActionType => {
        const pageMap: Record<string, AuditActionType> = {
          'Admin Dashboard': 'view_admin_dashboard',
          'Admin Users Management': 'view_admin_users',
          'Admin Events': 'view_admin_events',
          'Admin Team': 'view_admin_team',
          'Admin Members': 'view_admin_members',
          'Admin Resources': 'view_admin_resources',
          'Admin Newsletter': 'view_admin_newsletter',
          'Admin Blog': 'view_admin_blog',
          'Admin Profile': 'view_admin_profile',
          'Admin Sponsors': 'view_admin_sponsors',
          'Admin Communications': 'view_admin_communications',
          'Admin Media': 'view_admin_media',
          'Admin Guide': 'view_admin_guide',
          'Admin Linktree': 'view_admin_linktree',
          'Admin Content': 'view_admin_content',
          'Admin Security': 'view_admin_security'
        };
        
        return pageMap[page] || 'view_admin_page';
      };

      try {
        logAction(getPageAction(pageName), undefined, {
          description: `Accessed ${pageName} page`,
          page_name: pageName,
          page_load_time: Date.now(),
          user_agent: navigator.userAgent,
          screen_resolution: `${screen.width}x${screen.height}`,
          viewport_size: `${window.innerWidth}x${window.innerHeight}`,
          referrer: document.referrer || 'direct'
        });
      } catch (error) {
        // Silently handle audit errors
        if (process.env.NODE_ENV === 'development') {
          console.warn('Page tracking failed:', error);
        }
      }
    }
  }, [trackPageView, currentAdmin?.id, pageName, logAction]);

  // Track page exit
  useEffect(() => {
    if (!trackPageExit || !currentAdmin?.id) return;

    const handleBeforeUnload = () => {
      const sessionDuration = Date.now() - pageStartTime.current;
      
      // Use sendBeacon for reliable logging on page exit
      if (navigator.sendBeacon) {
        const data = JSON.stringify({
          admin_id: currentAdmin.id,
          action: 'view_admin_page',
          details: {
            page: pageName,
            session_duration: sessionDuration,
            total_actions: actionCount.current,
            exit_time: new Date().toISOString(),
            interaction_type: 'page_exit'
          }
        });
        
        navigator.sendBeacon('/api/audit/log', data);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        logAction('view_admin_page', undefined, {
          description: `Page ${pageName} became hidden`,
          session_duration: Date.now() - pageStartTime.current,
          total_actions: actionCount.current,
          visibility_state: 'hidden'
        });
      } else if (document.visibilityState === 'visible') {
        logAction('view_admin_page', undefined, {
          description: `Page ${pageName} became visible`,
          session_duration: Date.now() - pageStartTime.current,
          visibility_state: 'visible'
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [trackPageExit, currentAdmin?.id, pageName, logAction]);

  // Track form submissions
  useEffect(() => {
    if (!trackFormSubmissions) return;

    const handleFormSubmit = (event: Event) => {
      const form = event.target as HTMLFormElement;
      const formData = new FormData(form);
      const formFields = Array.from(formData.keys());

      logAction('view_admin_page', undefined, {
        description: `Form submitted on ${pageName}`,
        form_id: form.id || 'unnamed-form',
        form_fields: formFields,
        form_action: form.action || 'no-action',
        form_method: form.method || 'GET',
        interaction_type: 'form_submit'
      });
    };

    // Track modal opens (look for common modal patterns)
    const handleModalOpen = (event: Event) => {
      const target = event.target as HTMLElement;
      const button = target.closest('button');
      
      if (button && (
        button.textContent?.toLowerCase().includes('create') ||
        button.textContent?.toLowerCase().includes('edit') ||
        button.textContent?.toLowerCase().includes('add') ||
        button.textContent?.toLowerCase().includes('delete') ||
        button.textContent?.toLowerCase().includes('manage')
      )) {
        logAction('access_admin_section', undefined, {
          description: `Opened modal/dialog on ${pageName}`,
          button_text: button.textContent?.trim() || 'unknown',
          button_id: button.id || 'unnamed-button',
          modal_trigger: 'button_click'
        });
      }
    };

    document.addEventListener('submit', handleFormSubmit);
    document.addEventListener('click', handleModalOpen);
    
    return () => {
      document.removeEventListener('submit', handleFormSubmit);
      document.removeEventListener('click', handleModalOpen);
    };
  }, [trackFormSubmissions, pageName, logAction]);

  // Track navigation
  useEffect(() => {
    if (!trackNavigation) return;

    const handleClick = (event: Event) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && link.href) {
        logAction('view_admin_page', undefined, {
          description: `Clicked navigation link on ${pageName}`,
          link_href: link.href,
          link_text: link.textContent?.trim() || 'no-text',
          link_target: link.target || '_self',
          interaction_type: 'navigation_click'
        });
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [trackNavigation, pageName, logAction]);

  // Return tracking functions for manual use
  return {
    logAction,
    
    // Specific action loggers
    logCreate: (targetEmail?: string, details?: any, targetId?: string, targetType?: string) =>
      logAction('create_event', targetEmail, { ...details, action_type: 'create' }, targetId, targetType),
    
    logUpdate: (targetEmail?: string, details?: any, targetId?: string, targetType?: string) =>
      logAction('update_event', targetEmail, { ...details, action_type: 'update' }, targetId, targetType),
    
    logDelete: (targetEmail?: string, details?: any, targetId?: string, targetType?: string) =>
      logAction('delete_event', targetEmail, { ...details, action_type: 'delete' }, targetId, targetType),
    
    logView: (targetEmail?: string, details?: any, targetId?: string, targetType?: string) =>
      logAction('view_audit_log', targetEmail, { ...details, action_type: 'view' }, targetId, targetType),
    
    logExport: (targetEmail?: string, details?: any, targetId?: string, targetType?: string) =>
      logAction('export_audit_log', targetEmail, { ...details, action_type: 'export' }, targetId, targetType),
    
    // Batch logging
    logBatch: (actions: Array<{
      action: AuditActionType;
      targetEmail?: string;
      details?: any;
      targetId?: string;
      targetType?: string;
    }>) => {
      if (!currentAdmin?.id) return Promise.resolve(false);
      
      const enhancedActions = actions.map(actionData => ({
        ...actionData,
        details: {
          ...actionData.details,
          page: pageName,
          batch_operation: true,
          batch_size: actions.length
        }
      }));
      
      return AuditService.logBatchActions(currentAdmin.id, enhancedActions);
    },
    
    // Session info
    getSessionInfo: () => ({
      page: pageName,
      sessionDuration: Date.now() - pageStartTime.current,
      actionCount: actionCount.current,
      lastAction: lastAction.current
    })
  };
};

// Hook for tracking tab changes within admin pages
export const useAdminTabTracking = (pageName: string) => {
  const { currentAdmin } = useAdmin();
  const lastTab = useRef<string>('');

  const trackTabChange = useCallback(async (
    tabName: string,
    previousTab?: string
  ) => {
    if (!currentAdmin?.id || tabName === lastTab.current) return false;

    lastTab.current = tabName;

    try {
      return await AuditService.logAction(
        currentAdmin.id,
        'change_admin_tab',
        undefined,
        {
          description: `Switched to ${tabName} tab in ${pageName}`,
          page_name: pageName,
          tab_name: tabName,
          previous_tab: previousTab || 'unknown',
          timestamp: new Date().toISOString(),
          session_id: sessionStorage.getItem('gdg-admin-session-id')
        }
      );
    } catch (error) {
      // Silently handle tab tracking errors
      if (process.env.NODE_ENV === 'development') {
        console.warn('Tab tracking failed:', error);
      }
      return false;
    }
  }, [currentAdmin?.id, pageName]);

  return { trackTabChange };
};

// Hook for tracking specific admin operations
export const useAdminOperationTracking = () => {
  const { currentAdmin } = useAdmin();

  const trackOperation = useCallback(async (
    operation: string,
    entityType: string,
    entityId?: string,
    entityEmail?: string,
    details?: any
  ) => {
    if (!currentAdmin?.id) return false;

    const actionMap: Record<string, AuditActionType> = {
      'create_admin': 'create_admin',
      'update_admin': 'update_admin',
      'delete_admin': 'delete_admin',
      'reset_password': 'reset_password',
      'promote_team_member': 'promote_team_member',
      'create_event': 'create_event',
      'update_event': 'update_event',
      'delete_event': 'delete_event',
      'create_team_member': 'create_team_member',
      'update_team_member': 'update_team_member',
      'delete_team_member': 'delete_team_member',
      'create_project': 'create_project',
      'update_project': 'update_project',
      'delete_project': 'delete_project',
      'create_sponsor': 'create_sponsor',
      'update_sponsor': 'update_sponsor',
      'delete_sponsor': 'delete_sponsor',
      'update_site_settings': 'update_site_settings',
      'update_page_content': 'update_page_content',
      'send_newsletter': 'send_newsletter',
      'export_data': 'export_audit_log'
    };

    const action = actionMap[operation] || 'update_system_settings';

    return await AuditService.logAction(
      currentAdmin.id,
      action,
      entityEmail,
      {
        ...details,
        operation,
        entity_type: entityType,
        timestamp: new Date().toISOString()
      },
      entityId,
      entityType
    );
  }, [currentAdmin?.id]);

  return { trackOperation };
};