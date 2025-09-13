import React, { createContext, useContext, useState, useEffect } from 'react';
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
  lastUpdated: number;
  refreshContent: () => Promise<void>;
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
  const [lastUpdated, setLastUpdated] = useState(Date.now());

  const loadAllContent = async () => {
    try {
      setIsLoading(true);

      // Load site settings
      const settings = await ContentService.getSiteSettings();
      const settingsMap = settings.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, any>);
      setSiteSettings(settingsMap);

      // Load page content for all pages
      const pages = ['home', 'contact', 'events', 'blog', 'projects', 'team', 'resources', 'sponsors'];
      const pageContentMap: Record<string, Record<string, any>> = {};
      
      for (const page of pages) {
        const content = await ContentService.getPageContent(page);
        pageContentMap[page] = content.reduce((acc, item) => {
          acc[item.section_key] = item.content;
          return acc;
        }, {} as Record<string, any>);
      }
      setPageContent(pageContentMap);

      // Load navigation items
      const navItems = await ContentService.getNavigationItems();
      setNavigationItems(navItems);

      // Load footer content
      const footer = await ContentService.getFooterContent();
      const footerMap = footer.reduce((acc, item) => {
        acc[item.section_key] = item.content;
        return acc;
      }, {} as Record<string, any>);
      setFooterContent(footerMap);

      // Load dynamic content using dedicated services
      const [eventsData, teamData, projectsData, sponsorsData, resourcesData] = await Promise.all([
        EventsService.getEvents(),
        TeamService.getTeamMembers(),
        ProjectsService.getProjects(),
        SponsorsService.getSponsors(),
        ResourcesService.getResources()
      ]);

      setEvents(eventsData);
      setTeamMembers(teamData);
      setProjects(projectsData);
      setSponsors(sponsorsData);
      setResources(resourcesData);

    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setIsLoading(false);
      setLastUpdated(Date.now());
    }
  };

  // Set up real-time subscriptions
  useEffect(() => {
    loadAllContent();

    // Subscribe to real-time changes with more specific handling
    const subscriptions = [
      supabase
        .channel('site_settings_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, (payload) => {
          // Reload content after a short delay to ensure DB consistency
          setTimeout(() => loadAllContent(), 100);
        })
        .subscribe(),

      supabase
        .channel('page_content_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'page_content' }, (payload) => {
          setTimeout(() => loadAllContent(), 100);
        })
        .subscribe(),

      supabase
        .channel('navigation_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'navigation_items' }, (payload) => {
          setTimeout(() => loadAllContent(), 100);
        })
        .subscribe(),

      supabase
        .channel('social_links_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'social_links' }, (payload) => {
          setTimeout(() => loadAllContent(), 100);
        })
        .subscribe(),

      supabase
        .channel('footer_content_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'footer_content' }, (payload) => {
          setTimeout(() => loadAllContent(), 100);
        })
        .subscribe(),

      supabase
        .channel('events_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
          loadAllContent();
        })
        .subscribe(),

      supabase
        .channel('team_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members' }, () => {
          loadAllContent();
        })
        .subscribe(),

      supabase
        .channel('projects_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
          loadAllContent();
        })
        .subscribe(),

      supabase
        .channel('sponsors_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sponsors' }, () => {
          loadAllContent();
        })
        .subscribe(),

      supabase
        .channel('resources_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'resources' }, () => {
          loadAllContent();
        })
        .subscribe()
    ];

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, []);

  const refreshContent = async () => {
    await loadAllContent();
  };

  const getSiteSetting = (key: string) => {
    return siteSettings[key] || null;
  };

  const getPageSection = (pageSlug: string, sectionKey: string) => {
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
        console.error('Error parsing links:', error);
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
        console.error('Error parsing links:', error);
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
    lastUpdated,
    refreshContent,
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