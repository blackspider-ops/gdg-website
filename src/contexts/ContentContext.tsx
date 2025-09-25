import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ContentService } from '@/services/contentService';
import { EventsService } from '@/services/eventsService';
import { TeamService } from '@/services/teamService';
import { ProjectsService } from '@/services/projectsService';
import { SponsorsService } from '@/services/sponsorsService';
import { ResourcesService } from '@/services/resourcesService';
import { OptimizedContentService } from '@/services/optimizedContentService';
import { preloaderService } from '@/services/preloaderService';
import { supabase } from '@/lib/supabase';

interface ContentContextType {
  siteSettings: Record<string, any>;
  pageContent: Record<string, Record<string, any>>;
  navigationItems: any[];
  footerContent: Record<string, any>;
  events: any[];
  teamMembers: any[];
  projects: any[];
  sponsors: any[];
  resources: any[];
  isLoading: boolean;
  isLoadingEvents: boolean;
  isLoadingTeam: boolean;
  isLoadingProjects: boolean;
  isLoadingSponsors: boolean;
  isLoadingResources: boolean;
  lastUpdated: number;
  refreshContent: () => Promise<void>;
  loadEvents: (forceReload?: boolean) => Promise<void>;
  loadTeamMembers: () => Promise<void>;
  loadProjects: () => Promise<void>;
  loadSponsors: () => Promise<void>;
  loadResources: () => Promise<void>;
  getSiteSetting: (key: string) => any;
  getPageSection: (pageSlug: string, sectionKey: string) => any;
  getFooterSection: (sectionKey: string) => any;
  getLink: (linkType: string) => string;
  getAllLinks: (category?: string) => any[];
}

const ContentContext = createContext<ContentContextType | undefined>(undefined);

export const useContent = () => {
  const context = useContext(ContentContext);
  if (context === undefined) {
    throw new Error('useContent must be used within a ContentProvider');
  }
  return context;
};

interface ContentProviderProps {
  children: React.ReactNode;
}

export const ContentProvider: React.FC<ContentProviderProps> = ({ children }) => {
  const [siteSettings, setSiteSettings] = useState<Record<string, any>>({});
  const [pageContent, setPageContent] = useState<Record<string, Record<string, any>>>({});
  const [navigationItems, setNavigationItems] = useState<any[]>([]);
  const [footerContent, setFooterContent] = useState<Record<string, any>>({});
  const [events, setEvents] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isLoadingTeam, setIsLoadingTeam] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isLoadingSponsors, setIsLoadingSponsors] = useState(false);
  const [isLoadingResources, setIsLoadingResources] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  
  // Cache for loaded data to prevent unnecessary refetches
  const [loadedSections, setLoadedSections] = useState<Set<string>>(new Set());

  // Load only essential content on initial load with optimizations
  const loadEssentialContent = async () => {
    try {
      setIsLoading(true);

      // Use optimized batch loading for essential content
      const { siteSettings: settings, navigationItems: navItems, footerContent: footer, homeContent } = 
        await OptimizedContentService.loadEssentialContent();

      // Process site settings
      const settingsMap = settings.reduce((acc: Record<string, any>, setting: any) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, any>);
      setSiteSettings(settingsMap);

      // Process navigation
      setNavigationItems(navItems);

      // Process footer
      const footerMap = footer.reduce((acc: Record<string, any>, item: any) => {
        acc[item.section_key] = item.content;
        return acc;
      }, {} as Record<string, any>);
      setFooterContent(footerMap);

      // Process home content
      const homeContentMap = homeContent.reduce((acc: Record<string, any>, item: any) => {
        acc[item.section_key] = item.content;
        return acc;
      }, {} as Record<string, any>);
      
      setPageContent(prev => ({ ...prev, home: homeContentMap }));
      setLoadedSections(prev => new Set([...prev, 'home']));

      // Start preloading other content in the background
      setTimeout(() => {
        OptimizedContentService.preloadContent(['events', 'team', 'projects', 'contact']);
        
        // Preload critical assets
        preloaderService.intelligentPreload({
          fonts: [
            { family: 'Space Grotesk', weight: '400' },
            { family: 'Space Grotesk', weight: '600' },
            { family: 'Space Grotesk', weight: '700' },
            { family: 'Inter', weight: '400' },
            { family: 'Inter', weight: '500' },
            { family: 'Inter', weight: '600' }
          ]
        });
      }, 100);

    } catch (error) {
      // Silently handle errors
    } finally {
      setIsLoading(false);
      setLastUpdated(Date.now());
    }
  };

  // Lazy load page content when needed with caching
  const loadPageContent = useCallback(async (pageSlug: string) => {
    if (loadedSections.has(pageSlug)) return;

    try {
      const content = await OptimizedContentService.getPageContent(pageSlug);
      const contentMap = content.reduce((acc: Record<string, any>, item: any) => {
        acc[item.section_key] = item.content;
        return acc;
      }, {} as Record<string, any>);
      
      setPageContent(prev => ({ ...prev, [pageSlug]: contentMap }));
      setLoadedSections(prev => new Set([...prev, pageSlug]));
    } catch (error) {
      // Silently handle errors
    }
  }, [loadedSections]);

  // Lazy load events with caching
  const loadEvents = useCallback(async (forceReload = false) => {
    if (events.length > 0 && !forceReload) return; // Already loaded
    
    try {
      setIsLoadingEvents(true);
      
      if (forceReload) {
        OptimizedContentService.invalidateCache('events');
      }
      
      const eventsData = await OptimizedContentService.getEventsWithAccurateAttendeeCount();
      setEvents(eventsData);
    } catch (error) {
      // Silently handle errors
    } finally {
      setIsLoadingEvents(false);
    }
  }, [events.length]);

  // Lazy load team members with caching
  const loadTeamMembers = useCallback(async () => {
    if (teamMembers.length > 0) return; // Already loaded
    
    try {
      setIsLoadingTeam(true);
      const teamData = await OptimizedContentService.getTeamMembers();
      setTeamMembers(teamData);
    } catch (error) {
      // Silently handle errors
    } finally {
      setIsLoadingTeam(false);
    }
  }, [teamMembers.length]);

  // Lazy load projects with caching
  const loadProjects = useCallback(async () => {
    if (projects.length > 0) return; // Already loaded
    
    try {
      setIsLoadingProjects(true);
      const projectsData = await OptimizedContentService.getProjects();
      setProjects(projectsData);
    } catch (error) {
      // Silently handle errors
    } finally {
      setIsLoadingProjects(false);
    }
  }, [projects.length]);

  // Lazy load sponsors with caching
  const loadSponsors = useCallback(async () => {
    if (sponsors.length > 0) return; // Already loaded
    
    try {
      setIsLoadingSponsors(true);
      const sponsorsData = await OptimizedContentService.getSponsors();
      setSponsors(sponsorsData);
    } catch (error) {
      // Silently handle errors
    } finally {
      setIsLoadingSponsors(false);
    }
  }, [sponsors.length]);

  // Lazy load resources with caching
  const loadResources = useCallback(async () => {
    if (resources.length > 0) return; // Already loaded
    
    try {
      setIsLoadingResources(true);
      const resourcesData = await OptimizedContentService.getResources();
      setResources(resourcesData);
    } catch (error) {
      // Silently handle errors
    } finally {
      setIsLoadingResources(false);
    }
  }, [resources.length]);

  // Load essential content on mount
  useEffect(() => {
    loadEssentialContent();
  }, []);

  // Optimized real-time subscriptions - only for critical content
  useEffect(() => {
    const subscriptions = [
      // Only subscribe to essential content changes
      supabase
        .channel('essential_content_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, () => {
          // Debounced reload of essential content only
          setTimeout(() => loadEssentialContent(), 500);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'navigation_items' }, () => {
          setTimeout(() => loadEssentialContent(), 500);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'footer_content' }, () => {
          setTimeout(() => loadEssentialContent(), 500);
        })
        .subscribe(),

      // Specific subscriptions for dynamic content (only reload specific sections)
      supabase
        .channel('events_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
          if (events.length > 0) {
            loadEvents();
          }
        })
        .subscribe(),

      supabase
        .channel('team_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members' }, () => {
          if (teamMembers.length > 0) {
            loadTeamMembers();
          }
        })
        .subscribe()
    ];

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, [events.length, teamMembers.length, loadEvents, loadTeamMembers]);

  const refreshContent = async () => {
    // Clear all caches and reload essential content
    OptimizedContentService.clearAllCaches();
    setLoadedSections(new Set());
    
    // Force reload events with accurate counts
    await loadEvents(true);
    await loadEssentialContent();
  };

  const getSiteSetting = (key: string) => {
    return siteSettings[key] || null;
  };

  const getPageSection = (pageSlug: string, sectionKey: string) => {
    // Lazy load page content if not already loaded
    if (!loadedSections.has(pageSlug)) {
      loadPageContent(pageSlug);
    }
    return pageContent[pageSlug]?.[sectionKey] || null;
  };

  const getFooterSection = (sectionKey: string) => {
    return footerContent[sectionKey] || null;
  };

  const getLink = (linkType: string) => {
    // Get all links from unified system
    const allLinksData = siteSettings.all_links;
    if (allLinksData) {
      try {
        const allLinks = typeof allLinksData === 'string' 
          ? JSON.parse(allLinksData) 
          : allLinksData;
        
        // Find link by ID or by name (converted to lowercase with underscores)
        const link = allLinks.find((link: any) => 
          link.id === linkType || 
          link.name.toLowerCase().replace(/\s+/g, '_') === linkType.toLowerCase()
        );
        
        if (link) {
          return link.url;
        }
      } catch (error) {
    // Silently handle errors
  }
    }

    // Fallback to old system for backward compatibility
    const linkKey = `${linkType}_url`;
    if (siteSettings[linkKey]) {
      return siteSettings[linkKey];
    }

    return '#';
  };

  const getAllLinks = (category?: string) => {
    const allLinksData = siteSettings.all_links;
    if (allLinksData) {
      try {
        const allLinks = typeof allLinksData === 'string' 
          ? JSON.parse(allLinksData) 
          : allLinksData;
        
        if (Array.isArray(allLinks)) {
          if (category) {
            return allLinks.filter((link: any) => link.category === category);
          }
          return allLinks;
        }
      } catch (error) {
    // Silently handle errors
  }
    }
    return [];
  };

  const value = {
    siteSettings,
    pageContent,
    navigationItems,
    footerContent,
    events,
    teamMembers,
    projects,
    sponsors,
    resources,
    isLoading,
    isLoadingEvents,
    isLoadingTeam,
    isLoadingProjects,
    isLoadingSponsors,
    isLoadingResources,
    lastUpdated,
    refreshContent,
    loadEvents,
    loadTeamMembers,
    loadProjects,
    loadSponsors,
    loadResources,
    getSiteSetting,
    getPageSection,
    getFooterSection,
    getLink,
    getAllLinks
  };

  return (
    <ContentContext.Provider value={value}>
      {children}
    </ContentContext.Provider>
  );
};