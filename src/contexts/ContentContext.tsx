import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ContentService } from '@/services/contentService';
import { EventsService } from '@/services/eventsService';
import { TeamService } from '@/services/teamService';
import { ProjectsService } from '@/services/projectsService';
import { SponsorsService } from '@/services/sponsorsService';
import { ResourcesService } from '@/services/resourcesService';
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
  loadEvents: () => Promise<void>;
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

  // Load only essential content on initial load
  const loadEssentialContent = async () => {
    try {
      setIsLoading(true);

      // Load only critical content for initial page render
      const [settings, navItems, footer] = await Promise.all([
        ContentService.getSiteSettings(),
        ContentService.getNavigationItems(),
        ContentService.getFooterContent()
      ]);

      // Process site settings
      const settingsMap = settings.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, any>);
      setSiteSettings(settingsMap);

      // Process navigation
      setNavigationItems(navItems);

      // Process footer
      const footerMap = footer.reduce((acc, item) => {
        acc[item.section_key] = item.content;
        return acc;
      }, {} as Record<string, any>);
      setFooterContent(footerMap);

      // Load home page content immediately (most likely first page viewed)
      const homeContent = await ContentService.getPageContent('home');
      const homeContentMap = homeContent.reduce((acc, item) => {
        acc[item.section_key] = item.content;
        return acc;
      }, {} as Record<string, any>);
      
      setPageContent(prev => ({ ...prev, home: homeContentMap }));
      setLoadedSections(prev => new Set([...prev, 'home']));

    } catch (error) {
      console.error('Error loading essential content:', error);
    } finally {
      setIsLoading(false);
      setLastUpdated(Date.now());
    }
  };

  // Lazy load page content when needed
  const loadPageContent = useCallback(async (pageSlug: string) => {
    if (loadedSections.has(pageSlug)) return;

    try {
      const content = await ContentService.getPageContent(pageSlug);
      const contentMap = content.reduce((acc, item) => {
        acc[item.section_key] = item.content;
        return acc;
      }, {} as Record<string, any>);
      
      setPageContent(prev => ({ ...prev, [pageSlug]: contentMap }));
      setLoadedSections(prev => new Set([...prev, pageSlug]));
    } catch (error) {
      console.error(`Error loading ${pageSlug} content:`, error);
    }
  }, [loadedSections]);

  // Lazy load events
  const loadEvents = useCallback(async () => {
    if (events.length > 0) return; // Already loaded
    
    try {
      setIsLoadingEvents(true);
      const eventsData = await EventsService.getEvents();
      setEvents(eventsData);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setIsLoadingEvents(false);
    }
  }, [events.length]);

  // Lazy load team members
  const loadTeamMembers = useCallback(async () => {
    if (teamMembers.length > 0) return; // Already loaded
    
    try {
      setIsLoadingTeam(true);
      const teamData = await TeamService.getTeamMembers();
      setTeamMembers(teamData);
    } catch (error) {
      console.error('Error loading team members:', error);
    } finally {
      setIsLoadingTeam(false);
    }
  }, [teamMembers.length]);

  // Lazy load projects
  const loadProjects = useCallback(async () => {
    if (projects.length > 0) return; // Already loaded
    
    try {
      setIsLoadingProjects(true);
      const projectsData = await ProjectsService.getProjects();
      setProjects(projectsData);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setIsLoadingProjects(false);
    }
  }, [projects.length]);

  // Lazy load sponsors
  const loadSponsors = useCallback(async () => {
    if (sponsors.length > 0) return; // Already loaded
    
    try {
      setIsLoadingSponsors(true);
      const sponsorsData = await SponsorsService.getSponsors();
      setSponsors(sponsorsData);
    } catch (error) {
      console.error('Error loading sponsors:', error);
    } finally {
      setIsLoadingSponsors(false);
    }
  }, [sponsors.length]);

  // Lazy load resources
  const loadResources = useCallback(async () => {
    if (resources.length > 0) return; // Already loaded
    
    try {
      setIsLoadingResources(true);
      const resourcesData = await ResourcesService.getResources();
      setResources(resourcesData);
    } catch (error) {
      console.error('Error loading resources:', error);
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
    // Clear cache and reload essential content
    setLoadedSections(new Set());
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