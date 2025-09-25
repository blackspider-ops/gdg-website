import { ContentService } from './contentService';
import { EventsService } from './eventsService';
import { TeamService } from './teamService';
import { ProjectsService } from './projectsService';
import { SponsorsService } from './sponsorsService';
import { ResourcesService } from './resourcesService';
import { cacheService } from './cacheService';
import { requestService } from './requestService';

// Optimized content service with caching and request optimization
export class OptimizedContentService {
  // Site Settings with caching
  static async getSiteSettings() {
    const cacheKey = 'siteSettings_all';
    
    return cacheService.getOrFetch(
      cacheKey,
      () => requestService.optimizedRequest(
        'getSiteSettings',
        () => ContentService.getSiteSettings(),
        { dedupe: true, retry: 2, timeout: 5000 }
      )
    );
  }

  static async getSiteSetting(key: string) {
    const cacheKey = `siteSettings_${key}`;
    
    return cacheService.getOrFetch(
      cacheKey,
      () => requestService.optimizedRequest(
        `getSiteSetting_${key}`,
        () => ContentService.getSiteSetting(key),
        { dedupe: true, retry: 2, timeout: 3000 }
      )
    );
  }

  // Navigation with caching
  static async getNavigationItems() {
    const cacheKey = 'navigationItems_all';
    
    return cacheService.getOrFetch(
      cacheKey,
      () => requestService.optimizedRequest(
        'getNavigationItems',
        () => ContentService.getNavigationItems(),
        { dedupe: true, retry: 2, timeout: 5000 }
      )
    );
  }

  // Footer content with caching
  static async getFooterContent() {
    const cacheKey = 'footerContent_all';
    
    return cacheService.getOrFetch(
      cacheKey,
      () => requestService.optimizedRequest(
        'getFooterContent',
        () => ContentService.getFooterContent(),
        { dedupe: true, retry: 2, timeout: 5000 }
      )
    );
  }

  // Page content with caching
  static async getPageContent(pageSlug: string) {
    const cacheKey = `pageContent_${pageSlug}`;
    
    return cacheService.getOrFetch(
      cacheKey,
      () => requestService.optimizedRequest(
        `getPageContent_${pageSlug}`,
        () => ContentService.getPageContent(pageSlug),
        { dedupe: true, retry: 2, timeout: 5000 }
      )
    );
  }

  // Events with caching and optimized attendee count fetching
  static async getEvents() {
    const cacheKey = 'events_all';
    
    return cacheService.getOrFetch(
      cacheKey,
      () => requestService.optimizedRequest(
        'getEvents',
        () => EventsService.getEvents(),
        { dedupe: true, retry: 1, timeout: 8000 }
      )
    );
  }

  static async getEventsWithAccurateAttendeeCount() {
    const cacheKey = 'events_with_attendees';
    
    return cacheService.getOrFetch(
      cacheKey,
      () => requestService.optimizedRequest(
        'getEventsWithAttendees',
        () => EventsService.getEventsWithAccurateAttendeeCount(),
        { dedupe: true, retry: 1, timeout: 10000 }
      )
    );
  }

  static async getUpcomingEvents() {
    const cacheKey = 'events_upcoming';
    
    return cacheService.getOrFetch(
      cacheKey,
      () => requestService.optimizedRequest(
        'getUpcomingEvents',
        () => EventsService.getUpcomingEvents(),
        { dedupe: true, retry: 2, timeout: 5000 }
      )
    );
  }

  // Team members with caching
  static async getTeamMembers() {
    const cacheKey = 'teamMembers_all';
    
    return cacheService.getOrFetch(
      cacheKey,
      () => requestService.optimizedRequest(
        'getTeamMembers',
        () => TeamService.getTeamMembers(),
        { dedupe: true, retry: 2, timeout: 5000 }
      )
    );
  }

  // Projects with caching
  static async getProjects() {
    const cacheKey = 'projects_all';
    
    return cacheService.getOrFetch(
      cacheKey,
      () => requestService.optimizedRequest(
        'getProjects',
        () => ProjectsService.getProjects(),
        { dedupe: true, retry: 2, timeout: 5000 }
      )
    );
  }

  static async getFeaturedProjects() {
    const cacheKey = 'projects_featured';
    
    return cacheService.getOrFetch(
      cacheKey,
      () => requestService.optimizedRequest(
        'getFeaturedProjects',
        () => ProjectsService.getFeaturedProjects(),
        { dedupe: true, retry: 2, timeout: 5000 }
      )
    );
  }

  // Sponsors with caching
  static async getSponsors() {
    const cacheKey = 'sponsors_all';
    
    return cacheService.getOrFetch(
      cacheKey,
      () => requestService.optimizedRequest(
        'getSponsors',
        () => SponsorsService.getSponsors(),
        { dedupe: true, retry: 2, timeout: 5000 }
      )
    );
  }

  // Resources with caching
  static async getResources() {
    const cacheKey = 'resources_all';
    
    return cacheService.getOrFetch(
      cacheKey,
      () => requestService.optimizedRequest(
        'getResources',
        () => ResourcesService.getResources(),
        { dedupe: true, retry: 2, timeout: 5000 }
      )
    );
  }

  // Batch load essential content for faster initial load
  static async loadEssentialContent() {
    const essentialRequests = [
      () => this.getSiteSettings(),
      () => this.getNavigationItems(),
      () => this.getFooterContent(),
      () => this.getPageContent('home')
    ];

    try {
      const results = await requestService.parallel(essentialRequests, 4);
      return {
        siteSettings: results[0],
        navigationItems: results[1],
        footerContent: results[2],
        homeContent: results[3]
      };
    } catch (error) {
      // Return partial results if some requests fail
      const [siteSettings, navigationItems, footerContent, homeContent] = await Promise.allSettled(
        essentialRequests.map(fn => fn())
      );

      return {
        siteSettings: siteSettings.status === 'fulfilled' ? siteSettings.value : [],
        navigationItems: navigationItems.status === 'fulfilled' ? navigationItems.value : [],
        footerContent: footerContent.status === 'fulfilled' ? footerContent.value : [],
        homeContent: homeContent.status === 'fulfilled' ? homeContent.value : []
      };
    }
  }

  // Preload content in the background
  static async preloadContent(pages: string[] = ['events', 'team', 'projects']) {
    const preloadPromises = pages.map(page => 
      cacheService.preload(
        `pageContent_${page}`,
        () => ContentService.getPageContent(page)
      )
    );

    // Also preload upcoming events for home page
    preloadPromises.push(
      cacheService.preload(
        'events_upcoming',
        () => EventsService.getUpcomingEvents()
      )
    );

    // Preload featured projects for home page
    preloadPromises.push(
      cacheService.preload(
        'projects_featured',
        () => ProjectsService.getFeaturedProjects()
      )
    );

    await Promise.allSettled(preloadPromises);
  }

  // Invalidate cache for specific content type
  static invalidateCache(type: string, key?: string) {
    if (key) {
      cacheService.delete(`${type}_${key}`);
    } else {
      // Clear all cache entries for this type
      const patterns = [
        `${type}_all`,
        `${type}_featured`,
        `${type}_upcoming`,
        `${type}_with_attendees`
      ];
      
      patterns.forEach(pattern => cacheService.delete(pattern));
    }
  }

  // Refresh specific content and update cache
  static async refreshContent(type: string, key?: string) {
    this.invalidateCache(type, key);
    
    switch (type) {
      case 'siteSettings':
        return key ? this.getSiteSetting(key) : this.getSiteSettings();
      case 'navigationItems':
        return this.getNavigationItems();
      case 'footerContent':
        return this.getFooterContent();
      case 'pageContent':
        return key ? this.getPageContent(key) : null;
      case 'events':
        return this.getEventsWithAccurateAttendeeCount();
      case 'teamMembers':
        return this.getTeamMembers();
      case 'projects':
        return this.getProjects();
      case 'sponsors':
        return this.getSponsors();
      case 'resources':
        return this.getResources();
      default:
        return null;
    }
  }



  // Clear all caches
  static clearAllCaches() {
    cacheService.clear();
    requestService.clear();
  }
}