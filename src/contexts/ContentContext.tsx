import React, { createContext, useContext, useState, useEffect } from 'react';
import { ContentService } from '@/services/contentService';
import { supabase } from '@/lib/supabase';

interface ContentContextType {
  siteSettings: Record<string, any>;
  pageContent: Record<string, Record<string, any>>;
  navigationItems: any[];
  socialLinks: any[];
  footerContent: Record<string, any>;
  events: any[];
  teamMembers: any[];
  projects: any[];
  sponsors: any[];
  isLoading: boolean;
  refreshContent: () => Promise<void>;
  getSiteSetting: (key: string) => any;
  getPageSection: (pageSlug: string, sectionKey: string) => any;
  getFooterSection: (sectionKey: string) => any;
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
  const [socialLinks, setSocialLinks] = useState<any[]>([]);
  const [footerContent, setFooterContent] = useState<Record<string, any>>({});
  const [events, setEvents] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

      // Load social links
      const socials = await ContentService.getSocialLinks();
      setSocialLinks(socials);

      // Load footer content
      const footer = await ContentService.getFooterContent();
      const footerMap = footer.reduce((acc, item) => {
        acc[item.section_key] = item.content;
        return acc;
      }, {} as Record<string, any>);
      setFooterContent(footerMap);

      // Load dynamic content
      const [eventsData, teamData, projectsData, sponsorsData] = await Promise.all([
        ContentService.getEvents(),
        ContentService.getTeamMembers(),
        ContentService.getProjects(),
        ContentService.getSponsors()
      ]);

      setEvents(eventsData);
      setTeamMembers(teamData);
      setProjects(projectsData);
      setSponsors(sponsorsData);

    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Set up real-time subscriptions
  useEffect(() => {
    loadAllContent();

    // Subscribe to real-time changes
    const subscriptions = [
      supabase
        .channel('site_settings_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, () => {
          loadAllContent();
        })
        .subscribe(),

      supabase
        .channel('page_content_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'page_content' }, () => {
          loadAllContent();
        })
        .subscribe(),

      supabase
        .channel('navigation_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'navigation_items' }, () => {
          loadAllContent();
        })
        .subscribe(),

      supabase
        .channel('social_links_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'social_links' }, () => {
          loadAllContent();
        })
        .subscribe(),

      supabase
        .channel('footer_content_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'footer_content' }, () => {
          loadAllContent();
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

  const value = {
    siteSettings,
    pageContent,
    navigationItems,
    socialLinks,
    footerContent,
    events,
    teamMembers,
    projects,
    sponsors,
    isLoading,
    refreshContent,
    getSiteSetting,
    getPageSection,
    getFooterSection
  };

  return (
    <ContentContext.Provider value={value}>
      {children}
    </ContentContext.Provider>
  );
};