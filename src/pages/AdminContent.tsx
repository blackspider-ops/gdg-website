import React, { useState } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { useContent } from '@/contexts/ContentContext';
import { Navigate } from 'react-router-dom';
import {
  Settings,
  FileText,
  Navigation as NavIcon,
  Layout,
  Save,
  Edit3,
  Home,
  Mail,
  Plus,
  Trash2,
  ExternalLink,
  GripVertical,
  Calendar,
  Code,
  Users,
  BookOpen,
  Award,
  Library
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { ContentService } from '@/services/contentService';
import { OptimizedContentService } from '@/services/optimizedContentService';
import { supabase } from '@/lib/supabase';
import { debouncedCacheInvalidation } from '@/utils/cacheUtils';
import { toast } from 'sonner';

const AdminContent = () => {
  const { isAuthenticated, currentAdmin } = useAdmin();
  const {
    siteSettings,
    pageContent,
    navigationItems,
    footerContent,
    refreshContent
  } = useContent();

  // All hooks must be called before any early returns
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Form states for different sections
  const [siteSettingsForm, setSiteSettingsForm] = useState({
    site_title: siteSettings.site_title || 'GDG@PSU',
    site_subtitle: siteSettings.site_subtitle || 'Penn State University',
    site_description: siteSettings.site_description || 'A student-led community passionate about Google technologies'
  });

  const [homePageForm, setHomePageForm] = useState(() => {
    const homeContent = pageContent.home || {};
    const heroContent = homeContent.hero || {};
    const tracksContent = homeContent.tracks || {};
    const eventsContent = homeContent.events || {};
    const projectsContent = homeContent.projects || {};
    const communityContent = homeContent.community || {};

    return {
      // Hero Section
      hero_badge_text: heroContent.badge_text || '',
      hero_title: heroContent.title || '',
      hero_subtitle: heroContent.subtitle || '',
      hero_description: heroContent.description || '',
      hero_primary_cta_text: heroContent.primary_cta_text || '',
      hero_primary_cta_link: heroContent.primary_cta_link || '',
      hero_secondary_cta_text: heroContent.secondary_cta_text || '',
      hero_secondary_cta_link: heroContent.secondary_cta_link || '',

      // What We Build Section
      tracks_title: tracksContent.title || '',
      tracks_description: tracksContent.description || '',
      tracks_items: tracksContent.items || [],

      // Upcoming Events Section
      events_title: eventsContent.title || '',
      events_description: eventsContent.description || '',
      events_cta_text: eventsContent.cta_text || '',
      events_cta_link: eventsContent.cta_link || '',
      events_no_events_message: eventsContent.no_events_message || '',

      // Featured Projects Section
      projects_title: projectsContent.title || '',
      projects_description: projectsContent.description || '',
      projects_cta_text: projectsContent.cta_text || '',
      projects_cta_link: projectsContent.cta_link || '',
      projects_no_projects_message: projectsContent.no_projects_message || '',

      // Join Community Section
      community_title: communityContent.title || '',
      community_description: communityContent.description || '',
      community_cta_text: communityContent.cta_text || '',
      community_cta_link: communityContent.cta_link || '',
      community_feature_1: communityContent.feature_1 || '',
      community_feature_2: communityContent.feature_2 || '',
      community_feature_3: communityContent.feature_3 || ''
    };
  });

  const [contactPageForm, setContactPageForm] = useState(() => {
    const contactContent = pageContent.contact || {};
    const mainContent = contactContent.main || {};

    // Parse contact links if they exist
    let contactLinks = [];
    try {
      if (mainContent.contact_links && typeof mainContent.contact_links === 'string') {
        contactLinks = JSON.parse(mainContent.contact_links);
      } else if (Array.isArray(mainContent.contact_links)) {
        contactLinks = mainContent.contact_links;
      }
    } catch (error) {
    // Silently handle errors
  }



    return {
      title: mainContent.title || '',
      title_second_line: mainContent.title_second_line || '',
      subtitle: mainContent.subtitle || '',
      description: mainContent.description || 'We\'d love to hear from you! Whether you\'re interested in joining our chapter, have questions about upcoming events, or want to collaborate with us.',
      form_title: mainContent.form_title || 'Send us a message',
      success_message: mainContent.success_message || 'Thank you for your message! We\'ll get back to you soon.',
      button_text: mainContent.button_text || 'Send Message',
      quick_contact_title: mainContent.quick_contact_title || 'Quick Contact',
      email_label: mainContent.email_label || 'Email',
      email_url: mainContent.email_url || '',
      discord_label: mainContent.discord_label || 'Discord',
      discord_url: mainContent.discord_url || '',
      discord_description: mainContent.discord_description || 'Join our server for real-time chat',
      office_hours_label: mainContent.office_hours_label || 'Office Hours',
      office_hours_info: mainContent.office_hours_info || 'Wednesdays 4-6 PM, IST Building',
      meeting_time: mainContent.meeting_time || 'Thursdays at 7:00 PM',
      meeting_location: mainContent.meeting_location || 'Thomas Building 100',
      additional_links_title: mainContent.additional_links_title || 'Additional Links',
      contact_links: contactLinks || []
    };
  });

  // Events Page Form
  const [eventsPageForm, setEventsPageForm] = useState(() => {
    const eventsContent = pageContent.events || {};
    const headerContent = eventsContent.header || {};
    return {
      title: headerContent.title || 'Events & Workshops',
      description: headerContent.description || 'Join our community for hands-on workshops, inspiring talks, and networking opportunities. From beginner-friendly introductions to advanced deep dives, there\'s something for every developer.',
      upcoming_section_title: headerContent.upcoming_section_title || 'Upcoming Events',
      past_section_title: headerContent.past_section_title || 'Past Events',
      no_events_message: headerContent.no_events_message || 'No events scheduled at the moment. Check back soon!'
    };
  });

  // Projects Page Form
  const [projectsPageForm, setProjectsPageForm] = useState(() => {
    const projectsContent = pageContent.projects || {};
    const headerContent = projectsContent.header || {};
    return {
      title: headerContent.title || 'Student Projects',
      subtitle: headerContent.subtitle || 'Projects',
      description: headerContent.description || 'Discover innovative projects built by our community members. From mobile apps to AI research, see what happens when students collaborate and create.',
      featured_section_title: headerContent.featured_section_title || 'Featured Projects',
      all_projects_title: headerContent.all_projects_title || 'All Projects',
      contribute_cta: headerContent.contribute_cta || 'Want to showcase your project?',
      contribute_button: headerContent.contribute_button || 'Submit Project'
    };
  });

  // Team Page Form
  const [teamPageForm, setTeamPageForm] = useState(() => {
    const teamContent = pageContent.team || {};
    const headerContent = teamContent.header || {};
    return {
      title: headerContent.title || 'Meet Our Team',
      subtitle: headerContent.subtitle || 'Team',
      description: headerContent.description || 'The passionate students and mentors who make GDG@PSU a thriving community for developers and tech enthusiasts.',
      leadership_title: headerContent.leadership_title || 'Leadership Team',
      organizers_title: headerContent.organizers_title || 'Organizers',
      members_title: headerContent.members_title || 'Active Members',
      join_team_cta: headerContent.join_team_cta || 'Interested in joining our team?',
      join_team_button: headerContent.join_team_button || 'Get Involved'
    };
  });

  // Blog Page Form
  const [blogPageForm, setBlogPageForm] = useState(() => {
    const blogContent = pageContent.blog || {};
    const headerContent = blogContent.header || {};
    return {
      title: headerContent.title || 'Blog & Updates',
      description: headerContent.description || 'Insights, tutorials, and updates from our community. Learn about the latest technologies, workshop recaps, and member spotlights.',
      featured_title: headerContent.featured_title || 'Featured Posts',
      recent_title: headerContent.recent_title || 'Recent Posts',
      categories_title: headerContent.categories_title || 'Categories',
      search_placeholder: headerContent.search_placeholder || 'Search articles...',
      no_posts_message: headerContent.no_posts_message || 'No blog posts available yet.'
    };
  });

  // Sponsors Page Form
  const [sponsorsPageForm, setSponsorsPageForm] = useState(() => {
    const sponsorsContent = pageContent.sponsors || {};
    const headerContent = sponsorsContent.header || {};
    return {
      title: headerContent.title || 'Our Sponsors',
      subtitle: headerContent.subtitle || 'Sponsors',
      description: headerContent.description || 'We\'re grateful to our sponsors and partners who make our events, workshops, and community initiatives possible.',
      platinum_title: headerContent.platinum_title || 'Platinum Sponsors',
      gold_title: headerContent.gold_title || 'Gold Sponsors',
      silver_title: headerContent.silver_title || 'Silver Sponsors',
      community_title: headerContent.community_title || 'Community Partners',
      become_sponsor_cta: headerContent.become_sponsor_cta || 'Interested in sponsoring us?',
      become_sponsor_button: headerContent.become_sponsor_button || 'Partner With Us'
    };
  });

  // Resources Page Form
  const [resourcesPageForm, setResourcesPageForm] = useState(() => {
    const resourcesContent = pageContent.resources || {};
    const headerContent = resourcesContent.header || {};
    return {
      title: headerContent.title || 'Learning Resources',
      subtitle: headerContent.subtitle || 'Resources',
      description: headerContent.description || 'Access study materials, cloud credits, documentation, and recorded sessions to accelerate your learning journey.',
      study_materials_title: headerContent.study_materials_title || 'Study Materials',
      cloud_credits_title: headerContent.cloud_credits_title || 'Cloud Credits',
      documentation_title: headerContent.documentation_title || 'Documentation',
      recordings_title: headerContent.recordings_title || 'Session Recordings',
      tools_title: headerContent.tools_title || 'Developer Tools'
    };
  });

  // Unified links management - ALL links are manageable
  // Unified links management - ALL links are manageable
  const [allLinks, setAllLinks] = useState([]);

  // Initialize links when siteSettings loads
  React.useEffect(() => {
    const initializeLinks = () => {
      const allLinksData = siteSettings.all_links;

      if (allLinksData && typeof allLinksData === 'string') {
        try {
          const parsedLinks = JSON.parse(allLinksData);
          setAllLinks(parsedLinks);
          return;
        } catch (error) {
    // Silently handle errors
  }
      }

      if (allLinksData && Array.isArray(allLinksData) && allLinksData.length > 0) {
        setAllLinks(allLinksData);
        return;
      }

      // If no data exists, create default links
      const defaultLinks = [
        { id: 'discord', name: 'Discord Server', url: 'https://discord.gg/gdgpsu', category: 'Social', description: 'Join our Discord community' },
        { id: 'github', name: 'GitHub Organization', url: 'https://github.com/gdgpsu', category: 'Development', description: 'Our code repositories' },
        { id: 'twitter', name: 'X (Twitter)', url: 'https://twitter.com/gdgpsu', category: 'Social', description: 'Follow us on X' },
        { id: 'instagram', name: 'Instagram', url: 'https://instagram.com/gdg.psu', category: 'Social', description: 'Photos and updates' },
        { id: 'linkedin', name: 'LinkedIn', url: 'https://linkedin.com/company/gdgpsu', category: 'Social', description: 'Professional network' },
        { id: 'gdg_website', name: 'Official GDG Website', url: 'https://gdg.community.dev/penn-state-university/', category: 'Official', description: 'Official GDG chapter page' },
        { id: 'psu_discover', name: 'PSU Discover Page', url: 'https://studentaffairs.psu.edu/involvement-student-life/student-organizations/search?search=gdg', category: 'Official', description: 'Penn State organization page' }
      ];

      setAllLinks(defaultLinks);
    };

    // Only initialize if siteSettings has been loaded
    if (siteSettings && Object.keys(siteSettings).length > 0) {
      initializeLinks();
    }
  }, [siteSettings]);

  const [navigationForm, setNavigationForm] = useState(() => {
    return navigationItems.map(item => ({
      id: item.id || Math.random().toString(36).substr(2, 9),
      label: item.label || '',
      href: item.href || '',
      order_index: item.order_index || 0
    }));
  });

  const [footerForm, setFooterForm] = useState(() => {
    // Helper function to safely parse JSON content
    const parseFooterSection = (sectionData, fallback) => {
      try {
        if (typeof sectionData === 'string') {
          return JSON.parse(sectionData);
        }
        return sectionData || fallback;
      } catch (error) {
        return fallback;
      }
    };

    // Parse existing footer content or use defaults
    const quickLinksData = parseFooterSection(footerContent.quick_links, {
      links: [
        { name: 'Events', href: '/events' },
        { name: 'Blog', href: '/blog' },
        { name: 'Projects', href: '/projects' },
        { name: 'Team', href: '/team' }
      ]
    });

    const resourcesData = parseFooterSection(footerContent.resources, {
      links: [
        { name: 'Study Jams', href: '/resources' },
        { name: 'Cloud Credits', href: '/resources' },
        { name: 'Documentation', href: '/resources' },
        { name: 'Recordings', href: '/resources' }
      ]
    });

    const contactInfoData = parseFooterSection(footerContent.contact_info, {
      email: 'contact@gdgpsu.org',
      phone: '',
      address: 'Penn State University, University Park, PA',
      officeHours: 'Wednesdays 4-6 PM, IST Building'
    });

    const newsletterData = parseFooterSection(footerContent.newsletter, {
      title: 'Stay Updated',
      description: 'Get the latest updates on events, workshops, and opportunities.',
      placeholder: 'Enter your email',
      buttonText: 'Subscribe'
    });

    return {
      description: footerContent.description || 'A student-led community passionate about Google technologies at Penn State University.',
      copyright: footerContent.copyright || '© 2024 GDG@PSU. All rights reserved.',
      quickLinks: quickLinksData.links || quickLinksData,
      resources: resourcesData.links || resourcesData,
      contactInfo: contactInfoData,
      newsletter: newsletterData
      // social_links are now managed in the Links & URLs section
    };
  });

  // Organized tab categories
  const tabCategories = [
    {
      id: 'general',
      label: 'General',
      icon: Settings,
      tabs: [
        { id: 'site-settings', label: 'Site Settings', icon: Settings },
        { id: 'links-urls', label: 'Links & URLs', icon: ExternalLink },
        { id: 'navigation', label: 'Navigation', icon: NavIcon },
        { id: 'footer', label: 'Footer', icon: Layout },
      ]
    },
    {
      id: 'pages',
      label: 'Pages',
      icon: FileText,
      tabs: [
        { id: 'home-page', label: 'Home Page', icon: Home },
        { id: 'events-page', label: 'Events Page', icon: Calendar },
        { id: 'projects-page', label: 'Projects Page', icon: Code },
        { id: 'team-page', label: 'Team Page', icon: Users },
        { id: 'blog-page', label: 'Blog Page', icon: BookOpen },
        { id: 'sponsors-page', label: 'Sponsors Page', icon: Award },
        { id: 'resources-page', label: 'Resources Page', icon: Library },
        { id: 'contact-page', label: 'Contact Page', icon: Mail },
      ]
    }
  ];

  // State for category and tab selection
  const [activeCategory, setActiveCategory] = useState('general');
  const [activeTab, setActiveTab] = useState('site-settings');

  // Simple cache invalidation - just like site settings
  const invalidateCacheAndRefresh = () => {
    OptimizedContentService.invalidateCache('pageContent');
    refreshContent();
  };

  // Helper function to get category for a tab
  const getCategoryForTab = (tabId: string) => {
    for (const category of tabCategories) {
      if (category.tabs.some(tab => tab.id === tabId)) {
        return category.id;
      }
    }
    return 'general';
  };

  // Update category when tab changes (for direct tab access)
  React.useEffect(() => {
    const correctCategory = getCategoryForTab(activeTab);
    if (correctCategory !== activeCategory) {
      setActiveCategory(correctCategory);
    }
  }, [activeTab, activeCategory, getCategoryForTab]);

  const handleSaveSiteSettings = async () => {
    setIsSaving(true);
    try {
      const promises = Object.entries(siteSettingsForm).map(([key, value]) =>
        ContentService.updateSiteSetting(key, value, currentAdmin?.id)
      );
      await Promise.all(promises);

      setIsEditing(false);
      toast.success('Site settings saved successfully!');
      
      // Debounced cache invalidation
      debouncedCacheInvalidation(() => {
        OptimizedContentService.invalidateCache('siteSettings');
        refreshContent();
      });
      
    } catch (error) {
      console.error('Error saving site settings:', error);
      toast.error('Error saving site settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Simple save function for page content
  const savePageContentDirect = async (pageSlug: string, sectionKey: string, content: Record<string, unknown>) => {
    if (!currentAdmin?.id) {
      throw new Error('Admin not authenticated');
    }
    
    const { error, data } = await supabase
      .from('page_content')
      .upsert({
        page_slug: pageSlug,
        section_key: sectionKey,
        content,
        is_active: true,
        order_index: 0,
        updated_by: currentAdmin.id,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'page_slug,section_key'
      })
      .select();
    
    if (error) throw error;
    return data;
  };

  const handleSaveHomePage = async () => {
    setIsSaving(true);
    try {
      await Promise.all([
        savePageContentDirect('home', 'hero', {
          badge_text: homePageForm.hero_badge_text,
          title: homePageForm.hero_title,
          subtitle: homePageForm.hero_subtitle,
          description: homePageForm.hero_description,
          primary_cta_text: homePageForm.hero_primary_cta_text,
          primary_cta_link: homePageForm.hero_primary_cta_link,
          secondary_cta_text: homePageForm.hero_secondary_cta_text,
          secondary_cta_link: homePageForm.hero_secondary_cta_link
        }),
        savePageContentDirect('home', 'tracks', {
          title: homePageForm.tracks_title,
          description: homePageForm.tracks_description,
          items: homePageForm.tracks_items
        }),
        savePageContentDirect('home', 'events', {
          title: homePageForm.events_title,
          description: homePageForm.events_description,
          cta_text: homePageForm.events_cta_text,
          cta_link: homePageForm.events_cta_link,
          no_events_message: homePageForm.events_no_events_message
        }),
        savePageContentDirect('home', 'projects', {
          title: homePageForm.projects_title,
          description: homePageForm.projects_description,
          cta_text: homePageForm.projects_cta_text,
          cta_link: homePageForm.projects_cta_link,
          no_projects_message: homePageForm.projects_no_projects_message
        }),
        savePageContentDirect('home', 'community', {
          title: homePageForm.community_title,
          description: homePageForm.community_description,
          cta_text: homePageForm.community_cta_text,
          cta_link: homePageForm.community_cta_link,
          feature_1: homePageForm.community_feature_1,
          feature_2: homePageForm.community_feature_2,
          feature_3: homePageForm.community_feature_3
        })
      ]);

      setIsEditing(false);
      toast.success('Home page saved successfully!');
      
      // Cache invalidation with force refresh
      debouncedCacheInvalidation(invalidateCacheAndRefresh);
      
    } catch (error) {
      console.error('Error saving home page:', error);
      toast.error('Error saving home page. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveContactPage = async () => {
    setIsSaving(true);
    try {
      // Use direct supabase approach like other save functions
      const contactPageData = {
        ...contactPageForm,
        contact_links: JSON.stringify(contactPageForm.contact_links)
      };

      const { error } = await supabase
        .from('page_content')
        .upsert({
          page_slug: 'contact',
          section_key: 'main',
          content: contactPageData,
          is_active: true,
          order_index: 0,
          updated_by: currentAdmin?.id,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'page_slug,section_key'
        });

      if (error) {
        throw error;
      }

      setIsEditing(false);
      toast.success('Contact page saved successfully!');
      
      // Cache invalidation with force refresh
      debouncedCacheInvalidation(invalidateCacheAndRefresh);
      
    } catch (error) {
      console.error('Error saving contact page:', error);
      toast.error('Error saving contact page. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEventsPage = async () => {
    setIsSaving(true);
    try {
      await savePageContentDirect('events', 'header', eventsPageForm);
      setIsEditing(false);
      toast.success('Events page saved successfully!');
      debouncedCacheInvalidation(invalidateCacheAndRefresh);
    } catch (error) {
      console.error('Error saving events page:', error);
      toast.error('Error saving events page. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProjectsPage = async () => {
    setIsSaving(true);
    try {
      await savePageContentDirect('projects', 'header', projectsPageForm);
      setIsEditing(false);
      toast.success('Projects page saved successfully!');
      
      debouncedCacheInvalidation(invalidateCacheAndRefresh);
    } catch (error) {
      console.error('Error saving projects page:', error);
      toast.error('Error saving projects page. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTeamPage = async () => {
    setIsSaving(true);
    try {
      await savePageContentDirect('team', 'header', teamPageForm);
      setIsEditing(false);
      toast.success('Team page saved successfully!');
      
      debouncedCacheInvalidation(invalidateCacheAndRefresh);
    } catch (error) {
      console.error('Error saving team page:', error);
      toast.error('Error saving team page. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBlogPage = async () => {
    setIsSaving(true);
    try {
      await savePageContentDirect('blog', 'header', blogPageForm);
      setIsEditing(false);
      toast.success('Blog page saved successfully!');
      
      debouncedCacheInvalidation(invalidateCacheAndRefresh);
    } catch (error) {
      console.error('Error saving blog page:', error);
      toast.error('Error saving blog page. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSponsorsPage = async () => {
    setIsSaving(true);
    try {
      await savePageContentDirect('sponsors', 'header', sponsorsPageForm);
      setIsEditing(false);
      toast.success('Sponsors page saved successfully!');
      
      debouncedCacheInvalidation(invalidateCacheAndRefresh);
    } catch (error) {
      console.error('Error saving sponsors page:', error);
      toast.error('Error saving sponsors page. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveResourcesPage = async () => {
    setIsSaving(true);
    try {
      await savePageContentDirect('resources', 'header', resourcesPageForm);
      setIsEditing(false);
      toast.success('Resources page saved successfully!');
      
      debouncedCacheInvalidation(invalidateCacheAndRefresh);
    } catch (error) {
      console.error('Error saving resources page:', error);
      toast.error('Error saving resources page. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveLinks = async () => {
    setIsSaving(true);
    try {
      // Save all links as JSON
      await ContentService.updateSiteSetting(
        'all_links',
        JSON.stringify(allLinks),
        currentAdmin?.id
      );

      setIsEditing(false);
      toast.success('Links saved successfully!');
      
      // Debounced cache invalidation
      debouncedCacheInvalidation(() => {
        OptimizedContentService.invalidateCache('siteSettings');
        refreshContent();
      });
      
    } catch (error) {
      console.error('Error saving links:', error);
      toast.error('Error saving links. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const addLink = () => {
    const newLink = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      url: '',
      category: 'Custom',
      description: ''
    };
    setAllLinks(prev => [...prev, newLink]);
  };

  const removeLink = (id: string) => {
    setAllLinks(prev => prev.filter(link => link.id !== id));
  };

  const updateLink = (id: string, field: string, value: string) => {
    setAllLinks(prev => prev.map(link =>
      link.id === id ? { ...link, [field]: value } : link
    ));
  };

  // Contact page link management functions
  const addContactLink = (linkId: string) => {
    const selectedLink = allLinks.find(link => link.id === linkId);
    if (selectedLink && !contactPageForm.contact_links.find(cl => cl.id === linkId)) {
      setContactPageForm(prev => ({
        ...prev,
        contact_links: [...prev.contact_links, {
          id: selectedLink.id,
          name: selectedLink.name,
          url: selectedLink.url,
          category: selectedLink.category,
          description: selectedLink.description
        }]
      }));
    }
  };

  const removeContactLink = (linkId: string) => {
    setContactPageForm(prev => ({
      ...prev,
      contact_links: prev.contact_links.filter(link => link.id !== linkId)
    }));
  };

  // Tracks management functions
  const addTrack = () => {
    const newTrack = {
      id: Math.random().toString(36).substr(2, 9),
      title: '',
      description: '',
      icon: 'Smartphone', // Default icon
      color: 'text-gdg-blue' // Default color
    };
    setHomePageForm(prev => ({
      ...prev,
      tracks_items: [...(prev.tracks_items || []), newTrack]
    }));
  };

  const removeTrack = (trackId: string) => {
    setHomePageForm(prev => ({
      ...prev,
      tracks_items: (prev.tracks_items || []).filter(track => track.id !== trackId)
    }));
  };

  const updateTrack = (trackId: string, field: string, value: string) => {
    setHomePageForm(prev => ({
      ...prev,
      tracks_items: (prev.tracks_items || []).map(track =>
        track.id === trackId ? { ...track, [field]: value } : track
      )
    }));
  };



  const handleSaveNavigation = async () => {
    setIsSaving(true);
    try {
      // Get current navigation item IDs from the form (only existing items with real IDs)
      const formItemIds = navigationForm.map(item => item.id).filter(id => id !== null && id !== undefined);

      // Get existing navigation item IDs from the loaded data
      const existingItemIds = navigationItems.map(item => item.id).filter(id => id);

      // Find items to delete (exist in database but not in form)
      const itemsToDelete = existingItemIds.filter(id => !formItemIds.includes(id));

      // Delete removed items
      const deletePromises = itemsToDelete.map(id =>
        ContentService.deleteNavigationItem(id)
      );

      // Update/create items from form
      const updatePromises = navigationForm.map((item, index) => {
        const itemData: Record<string, unknown> = {
          label: item.label,
          href: item.href,
          order_index: index,
          is_active: true
        };

        // Only include ID for existing items (not null)
        if (item.id) {
          itemData.id = item.id;
        }

        return ContentService.updateNavigationItem(itemData, currentAdmin?.id);
      });

      // Execute all operations
      await Promise.all([...deletePromises, ...updatePromises]);
      
      setIsEditing(false);
      toast.success('Navigation saved successfully!');
      
      // Debounced cache invalidation
      debouncedCacheInvalidation(() => {
        OptimizedContentService.invalidateCache('navigationItems');
        refreshContent();
      });
      
    } catch (error) {
      console.error('Error saving navigation:', error);
      toast.error('Error saving navigation. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveFooter = async () => {
    setIsSaving(true);
    try {
      // Update all footer content sections
      await ContentService.updateFooterContent('description', footerForm.description, currentAdmin?.id);
      await ContentService.updateFooterContent('copyright', footerForm.copyright, currentAdmin?.id);

      // Save Quick Links
      await ContentService.updateFooterContent('quick_links', JSON.stringify({
        links: footerForm.quickLinks
      }), currentAdmin?.id);

      // Save Resources
      await ContentService.updateFooterContent('resources', JSON.stringify({
        links: footerForm.resources
      }), currentAdmin?.id);

      // Save Contact Info
      await ContentService.updateFooterContent('contact_info', JSON.stringify(footerForm.contactInfo), currentAdmin?.id);

      // Save Newsletter Settings
      await ContentService.updateFooterContent('newsletter', JSON.stringify(footerForm.newsletter), currentAdmin?.id);

      setIsEditing(false);
      toast.success('Footer content saved successfully!');
      
      // Debounced cache invalidation
      debouncedCacheInvalidation(() => {
        OptimizedContentService.invalidateCache('footerContent');
        refreshContent();
      });
      
    } catch (error) {
      console.error('Error saving footer content:', error);
      toast.error('Error saving footer content. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const addNavigationItem = () => {
    setNavigationForm(prev => [...prev, {
      id: null, // Let Supabase auto-generate the ID
      label: '',
      href: '',
      order_index: prev.length
    }]);
  };

  const removeNavigationItem = (index: number) => {
    setNavigationForm(prev => prev.filter((_, i) => i !== index));
  };

  // Drag and drop handlers for navigation items
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);

    if (draggedItem === null || draggedItem === dropIndex) {
      setDraggedItem(null);
      return;
    }

    setNavigationForm(prev => {
      const newItems = [...prev];
      const draggedItemData = newItems[draggedItem];

      // Remove the dragged item
      newItems.splice(draggedItem, 1);

      // Insert it at the new position
      const insertIndex = draggedItem < dropIndex ? dropIndex - 1 : dropIndex;
      newItems.splice(insertIndex, 0, draggedItemData);

      // Update order_index for all items
      return newItems.map((item, index) => ({
        ...item,
        order_index: index
      }));
    });

    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  // Social links are now managed in the Links & URLs section



  // Update navigation form when navigationItems changes
  React.useEffect(() => {
    if (navigationItems && navigationItems.length > 0) {
      setNavigationForm(navigationItems.map(item => ({
        id: item.id || Math.random().toString(36).substr(2, 9),
        label: item.label || '',
        href: item.href || '',
        order_index: item.order_index || 0
      })));
    }
  }, [navigationItems]);

  // Update footer form when footerContent changes
  React.useEffect(() => {
    const parseFooterSection = (sectionData, fallback) => {
      try {
        if (typeof sectionData === 'string') {
          return JSON.parse(sectionData);
        }
        return sectionData || fallback;
      } catch (error) {
        return fallback;
      }
    };

    if (footerContent && Object.keys(footerContent).length > 0) {
      const quickLinksData = parseFooterSection(footerContent.quick_links, {
        links: [
          { name: 'Events', href: '/events' },
          { name: 'Blog', href: '/blog' },
          { name: 'Projects', href: '/projects' },
          { name: 'Team', href: '/team' }
        ]
      });

      const resourcesData = parseFooterSection(footerContent.resources, {
        links: [
          { name: 'Study Jams', href: '/resources' },
          { name: 'Cloud Credits', href: '/resources' },
          { name: 'Documentation', href: '/resources' },
          { name: 'Recordings', href: '/resources' }
        ]
      });

      const contactInfoData = parseFooterSection(footerContent.contact_info, {
        email: 'contact@gdgpsu.org',
        phone: '',
        address: 'Penn State University, University Park, PA',
        officeHours: 'Wednesdays 4-6 PM, IST Building'
      });

      const newsletterData = parseFooterSection(footerContent.newsletter, {
        title: 'Stay Updated',
        description: 'Get the latest updates on events, workshops, and opportunities.',
        placeholder: 'Enter your email',
        buttonText: 'Subscribe'
      });

      setFooterForm({
        description: footerContent.description || 'A student-led community passionate about Google technologies at Penn State University.',
        copyright: footerContent.copyright || '© 2024 GDG@PSU. All rights reserved.',
        quickLinks: quickLinksData.links || quickLinksData,
        resources: resourcesData.links || resourcesData,
        contactInfo: contactInfoData,
        newsletter: newsletterData
      });
    }
  }, [footerContent]);

  // Update contact page form when pageContent changes
  React.useEffect(() => {
    if (pageContent.contact && Object.keys(pageContent.contact).length > 0) {
      const contactContent = pageContent.contact;

      // Get the main section data where we save the contact page content
      const mainContent = contactContent.main || {};

      // Parse contact links if they exist
      let contactLinks = [];
      try {
        if (mainContent.contact_links && typeof mainContent.contact_links === 'string') {
          contactLinks = JSON.parse(mainContent.contact_links);
        } else if (Array.isArray(mainContent.contact_links)) {
          contactLinks = mainContent.contact_links;
        }
      } catch (error) {
    // Silently handle errors
  }

      setContactPageForm({
        title: mainContent.title || '',
        title_second_line: mainContent.title_second_line || '',
        subtitle: mainContent.subtitle || '',
        description: mainContent.description || 'We\'d love to hear from you! Whether you\'re interested in joining our chapter, have questions about upcoming events, or want to collaborate with us.',
        form_title: mainContent.form_title || 'Send us a message',
        success_message: mainContent.success_message || 'Thank you for your message! We\'ll get back to you soon.',
        button_text: mainContent.button_text || 'Send Message',
        quick_contact_title: mainContent.quick_contact_title || 'Quick Contact',
        email_label: mainContent.email_label || 'Email',
        email_url: mainContent.email_url || '',
        discord_label: mainContent.discord_label || 'Discord',
        discord_url: mainContent.discord_url || '',
        discord_description: mainContent.discord_description || 'Join our server for real-time chat',
        office_hours_label: mainContent.office_hours_label || 'Office Hours',
        office_hours_info: mainContent.office_hours_info || 'Wednesdays 4-6 PM, IST Building',
        meeting_time: mainContent.meeting_time || 'Thursdays at 7:00 PM',
        meeting_location: mainContent.meeting_location || 'Thomas Building 100',
        additional_links_title: mainContent.additional_links_title || 'Additional Links',
        contact_links: contactLinks || []
      });
    }
  }, [pageContent]);

  // Update home page form when pageContent changes
  React.useEffect(() => {
    if (pageContent.home && Object.keys(pageContent.home).length > 0) {
      const homeContent = pageContent.home;
      const heroContent = homeContent.hero || {};
      const tracksContent = homeContent.tracks || {};
      const eventsContent = homeContent.events || {};
      const projectsContent = homeContent.projects || {};
      const communityContent = homeContent.community || {};

      setHomePageForm({
        // Hero Section
        hero_badge_text: heroContent.badge_text || '',
        hero_title: heroContent.title || '',
        hero_subtitle: heroContent.subtitle || '',
        hero_description: heroContent.description || '',
        hero_primary_cta_text: heroContent.primary_cta_text || '',
        hero_primary_cta_link: heroContent.primary_cta_link || '',
        hero_secondary_cta_text: heroContent.secondary_cta_text || '',
        hero_secondary_cta_link: heroContent.secondary_cta_link || '',

        // What We Build Section
        tracks_title: tracksContent.title || '',
        tracks_description: tracksContent.description || '',
        tracks_items: tracksContent.items || [],

        // Upcoming Events Section
        events_title: eventsContent.title || '',
        events_description: eventsContent.description || '',
        events_cta_text: eventsContent.cta_text || '',
        events_cta_link: eventsContent.cta_link || '',
        events_no_events_message: eventsContent.no_events_message || '',

        // Featured Projects Section
        projects_title: projectsContent.title || '',
        projects_description: projectsContent.description || '',
        projects_cta_text: projectsContent.cta_text || '',
        projects_cta_link: projectsContent.cta_link || '',
        projects_no_projects_message: projectsContent.no_projects_message || '',

        // Join Community Section
        community_title: communityContent.title || '',
        community_description: communityContent.description || '',
        community_cta_text: communityContent.cta_text || '',
        community_cta_link: communityContent.cta_link || '',
        community_feature_1: communityContent.feature_1 || '',
        community_feature_2: communityContent.feature_2 || '',
        community_feature_3: communityContent.feature_3 || ''
      });
    }
  }, [pageContent]);

  // Update events page form when pageContent changes
  React.useEffect(() => {
    if (pageContent.events && Object.keys(pageContent.events).length > 0) {
      const eventsContent = pageContent.events;
      const headerContent = eventsContent.header || {};
      setEventsPageForm({
        title: headerContent.title || 'Events & Workshops',
        description: headerContent.description || 'Join our community for hands-on workshops, inspiring talks, and networking opportunities. From beginner-friendly introductions to advanced deep dives, there\'s something for every developer.',
        upcoming_section_title: headerContent.upcoming_section_title || 'Upcoming Events',
        past_section_title: headerContent.past_section_title || 'Past Events',
        no_events_message: headerContent.no_events_message || 'No events scheduled at the moment. Check back soon!'
      });
    }
  }, [pageContent]);

  // Update projects page form when pageContent changes
  React.useEffect(() => {
    if (pageContent.projects && Object.keys(pageContent.projects).length > 0) {
      const projectsContent = pageContent.projects;
      const headerContent = projectsContent.header || {};
      setProjectsPageForm({
        title: headerContent.title || 'Student',
        subtitle: headerContent.subtitle || 'Projects',
        description: headerContent.description || 'Discover innovative projects built by our community members. From mobile apps to AI research, see what happens when students collaborate and create.',
        featured_section_title: headerContent.featured_section_title || 'Featured Projects',
        all_projects_title: headerContent.all_projects_title || 'All Projects',
        contribute_cta: headerContent.contribute_cta || 'Want to showcase your project?',
        contribute_button: headerContent.contribute_button || 'Submit Project'
      });
    }
  }, [pageContent]);

  // Update team page form when pageContent changes
  React.useEffect(() => {
    if (pageContent.team && Object.keys(pageContent.team).length > 0) {
      const teamContent = pageContent.team;
      const headerContent = teamContent.header || {};
      setTeamPageForm({
        title: headerContent.title || 'Meet Our',
        subtitle: headerContent.subtitle || 'Team',
        description: headerContent.description || 'The passionate students and mentors who make GDG@PSU a thriving community for developers and tech enthusiasts.',
        leadership_title: headerContent.leadership_title || 'Leadership Team',
        organizers_title: headerContent.organizers_title || 'Organizers',
        members_title: headerContent.members_title || 'Active Members',
        join_team_cta: headerContent.join_team_cta || 'Interested in joining our team?',
        join_team_button: headerContent.join_team_button || 'Get Involved'
      });
    }
  }, [pageContent]);

  // Update blog page form when pageContent changes
  React.useEffect(() => {
    if (pageContent.blog && Object.keys(pageContent.blog).length > 0) {
      const blogContent = pageContent.blog;
      const headerContent = blogContent.header || {};
      setBlogPageForm({
        title: headerContent.title || 'Blog & Updates',
        description: headerContent.description || 'Insights, tutorials, and updates from our community. Learn about the latest technologies, workshop recaps, and member spotlights.',
        featured_title: headerContent.featured_title || 'Featured Posts',
        recent_title: headerContent.recent_title || 'Recent Posts',
        categories_title: headerContent.categories_title || 'Categories',
        search_placeholder: headerContent.search_placeholder || 'Search articles...',
        no_posts_message: headerContent.no_posts_message || 'No blog posts available yet.'
      });
    }
  }, [pageContent]);

  // Update sponsors page form when pageContent changes
  React.useEffect(() => {
    if (pageContent.sponsors && Object.keys(pageContent.sponsors).length > 0) {
      const sponsorsContent = pageContent.sponsors;
      const headerContent = sponsorsContent.header || {};
      setSponsorsPageForm({
        title: headerContent.title || 'Our',
        subtitle: headerContent.subtitle || 'Sponsors',
        description: headerContent.description || 'We\'re grateful to our sponsors and partners who make our events, workshops, and community initiatives possible.',
        platinum_title: headerContent.platinum_title || 'Platinum Sponsors',
        gold_title: headerContent.gold_title || 'Gold Sponsors',
        silver_title: headerContent.silver_title || 'Silver Sponsors',
        community_title: headerContent.community_title || 'Community Partners',
        become_sponsor_cta: headerContent.become_sponsor_cta || 'Interested in sponsoring us?',
        become_sponsor_button: headerContent.become_sponsor_button || 'Partner With Us'
      });
    }
  }, [pageContent]);

  // Update resources page form when pageContent changes
  React.useEffect(() => {
    if (pageContent.resources && Object.keys(pageContent.resources).length > 0) {
      const resourcesContent = pageContent.resources;
      const headerContent = resourcesContent.header || {};
      setResourcesPageForm({
        title: headerContent.title || 'Learning',
        subtitle: headerContent.subtitle || 'Resources',
        description: headerContent.description || 'Access study materials, cloud credits, documentation, and recorded sessions to accelerate your learning journey.',
        study_materials_title: headerContent.study_materials_title || 'Study Materials',
        cloud_credits_title: headerContent.cloud_credits_title || 'Cloud Credits',
        documentation_title: headerContent.documentation_title || 'Documentation',
        recordings_title: headerContent.recordings_title || 'Session Recordings',
        tools_title: headerContent.tools_title || 'Developer Tools'
      });
    }
  }, [pageContent]);

  // Authentication check after all hooks
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <AdminLayout
      title="Site & Content Management"
      subtitle="Manage website settings, content, and configuration"
      icon={FileText}
      actions={
        isEditing && (
          <div className="flex items-center space-x-3">


            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors font-medium text-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (activeTab === 'site-settings') handleSaveSiteSettings();
                if (activeTab === 'home-page') handleSaveHomePage();
                if (activeTab === 'events-page') handleSaveEventsPage();
                if (activeTab === 'projects-page') handleSaveProjectsPage();
                if (activeTab === 'team-page') handleSaveTeamPage();
                if (activeTab === 'blog-page') handleSaveBlogPage();
                if (activeTab === 'sponsors-page') handleSaveSponsorsPage();
                if (activeTab === 'resources-page') handleSaveResourcesPage();
                if (activeTab === 'contact-page') handleSaveContactPage();
                if (activeTab === 'links-urls') handleSaveLinks();
                if (activeTab === 'navigation') handleSaveNavigation();
                if (activeTab === 'footer') handleSaveFooter();
              }}
              disabled={isSaving}
              data-saving={isSaving ? "true" : "false"}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors font-medium ${
                isSaving 
                  ? 'bg-gray-400 text-gray-700 cursor-not-allowed opacity-50' 
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
            >
              <Save size={16} />
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        )
      }
    >
      {/* Category Tabs */}
      <div className="bg-muted/30 rounded-lg p-1 mb-6">
        <nav className="flex space-x-1">
          {tabCategories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => {
                  setActiveCategory(category.id);
                  // Set first tab of the category as active
                  setActiveTab(category.tabs[0].id);
                  setIsEditing(false);
                }}
                className={`flex items-center space-x-2 py-3 px-4 rounded-md font-medium text-sm whitespace-nowrap transition-all ${
                  activeCategory === category.id
                    ? 'bg-card text-primary shadow-sm border border-border'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Icon size={16} />
                <span>{category.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sub Tabs */}
      <div className="border-b border-border mb-8">
        <nav className="flex space-x-6 overflow-x-auto pb-1">
          {tabCategories
            .find(cat => cat.id === activeCategory)
            ?.tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsEditing(false);
                  }}
                  className={`flex items-center space-x-2 py-3 px-2 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-muted-foreground hover:text-gray-300 hover:border-border'
                  }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
        </nav>
      </div>

      {/* Site Settings */}
      {activeTab === 'site-settings' && (
        <div className="bg-card rounded-xl shadow-sm border border-border" data-editing={isEditing}>
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Site Settings</h2>
              <p className="text-muted-foreground mt-1">Configure basic site information</p>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors font-medium text-gray-300"
              >
                <Edit3 size={16} />
                <span>Edit Content</span>
              </button>
            )}
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Site Title</label>
                <p className="text-xs text-muted-foreground mb-3">Displayed in navigation header, contact page title, and footer</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={siteSettingsForm.site_title}
                    onChange={(e) => setSiteSettingsForm(prev => ({ ...prev, site_title: e.target.value }))}
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                  />
                ) : (
                  <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                    {siteSettingsForm.site_title}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Site Subtitle</label>
                <p className="text-xs text-muted-foreground mb-3">Shown under site title in navigation and footer</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={siteSettingsForm.site_subtitle}
                    onChange={(e) => setSiteSettingsForm(prev => ({ ...prev, site_subtitle: e.target.value }))}
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                  />
                ) : (
                  <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                    {siteSettingsForm.site_subtitle}
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-muted-foreground mb-1">Site Description</label>
                <p className="text-xs text-muted-foreground mb-3">General description used for SEO and site information</p>
                {isEditing ? (
                  <textarea
                    rows={3}
                    value={siteSettingsForm.site_description}
                    onChange={(e) => setSiteSettingsForm(prev => ({ ...prev, site_description: e.target.value }))}
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                  />
                ) : (
                  <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                    {siteSettingsForm.site_description}
                  </div>
                )}
              </div>




            </div>
          </div>
        </div>
      )}

      {/* Home Page */}
      {activeTab === 'home-page' && (
        <div className="bg-card rounded-xl shadow-sm border border-border" data-editing={isEditing}>
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Home Page Content</h2>
              <p className="text-muted-foreground mt-1">Edit all sections of the homepage</p>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors font-medium text-gray-300"
              >
                <Edit3 size={16} />
                <span>Edit Content</span>
              </button>
            )}
          </div>

          <div className="p-6 space-y-8">
            {/* Hero Section */}
            <div className="border-b border-border pb-8">
              <h3 className="text-lg font-semibold text-foreground mb-6">Hero Section</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Badge Text</label>
                  <p className="text-xs text-muted-foreground mb-3">Small badge text above the main title on homepage hero</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={homePageForm.hero_badge_text}
                      onChange={(e) => setHomePageForm(prev => ({ ...prev, hero_badge_text: e.target.value }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                      {homePageForm.hero_badge_text}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Main Title</label>
                  <p className="text-xs text-muted-foreground mb-3">Large main heading displayed prominently on homepage hero</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={homePageForm.hero_title}
                      onChange={(e) => setHomePageForm(prev => ({ ...prev, hero_title: e.target.value }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground text-2xl font-bold">
                      {homePageForm.hero_title}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Subtitle</label>
                  <p className="text-xs text-muted-foreground mb-3">Secondary heading shown below the main title</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={homePageForm.hero_subtitle}
                      onChange={(e) => setHomePageForm(prev => ({ ...prev, hero_subtitle: e.target.value }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground text-lg">
                      {homePageForm.hero_subtitle}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Description</label>
                  <p className="text-xs text-muted-foreground mb-3">Descriptive text shown below the hero title and subtitle</p>
                  {isEditing ? (
                    <textarea
                      rows={3}
                      value={homePageForm.hero_description}
                      onChange={(e) => setHomePageForm(prev => ({ ...prev, hero_description: e.target.value }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                      {homePageForm.hero_description}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Primary Button Text</label>
                    <p className="text-xs text-muted-foreground mb-3">Text for the main call-to-action button</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={homePageForm.hero_primary_cta_text}
                        onChange={(e) => setHomePageForm(prev => ({ ...prev, hero_primary_cta_text: e.target.value }))}
                        className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                        {homePageForm.hero_primary_cta_text}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Primary Button Link</label>
                    <p className="text-xs text-muted-foreground mb-3">URL where the primary button links to</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={homePageForm.hero_primary_cta_link}
                        onChange={(e) => setHomePageForm(prev => ({ ...prev, hero_primary_cta_link: e.target.value }))}
                        className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                        {homePageForm.hero_primary_cta_link}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Secondary Button Text</label>
                    <p className="text-xs text-muted-foreground mb-3">Text for the secondary call-to-action button</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={homePageForm.hero_secondary_cta_text}
                        onChange={(e) => setHomePageForm(prev => ({ ...prev, hero_secondary_cta_text: e.target.value }))}
                        className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                        {homePageForm.hero_secondary_cta_text}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Secondary Button Link</label>
                    <p className="text-xs text-muted-foreground mb-3">URL where the secondary button links to</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={homePageForm.hero_secondary_cta_link}
                        onChange={(e) => setHomePageForm(prev => ({ ...prev, hero_secondary_cta_link: e.target.value }))}
                        className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                        {homePageForm.hero_secondary_cta_link}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* What We Build Section */}
            <div className="border-b border-border pb-8">
              <h3 className="text-lg font-semibold text-foreground mb-2">What We Build Section</h3>
              <p className="text-sm text-muted-foreground mb-6">Technology tracks section displayed on the homepage</p>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Section Title</label>
                  <p className="text-xs text-muted-foreground mb-3">Main heading for the technology tracks section</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={homePageForm.tracks_title}
                      onChange={(e) => setHomePageForm(prev => ({ ...prev, tracks_title: e.target.value }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground text-xl font-semibold">
                      {homePageForm.tracks_title}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Section Description</label>
                  <p className="text-xs text-muted-foreground mb-3">Descriptive text shown below the section title</p>
                  {isEditing ? (
                    <textarea
                      rows={3}
                      value={homePageForm.tracks_description}
                      onChange={(e) => setHomePageForm(prev => ({ ...prev, tracks_description: e.target.value }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                      {homePageForm.tracks_description}
                    </div>
                  )}
                </div>

                {/* Tracks Management */}
                <div className="border-t border-border pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-md font-semibold text-foreground">Technology Tracks</h4>
                      <p className="text-sm text-muted-foreground">Manage the technology tracks displayed in this section</p>
                    </div>
                    {isEditing && (
                      <button
                        onClick={addTrack}
                        className="flex items-center space-x-2 px-4 py-2 bg-primary text-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                      >
                        <Plus size={16} />
                        <span>Add Track</span>
                      </button>
                    )}
                  </div>

                  {(!homePageForm.tracks_items || homePageForm.tracks_items.length === 0) ? (
                    <div className="text-center py-6 text-muted-foreground border border-border rounded-lg">
                      <p>No tracks added yet.</p>
                      {isEditing && (
                        <p className="text-sm mt-2">Click "Add Track" to create your first technology track.</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {(homePageForm.tracks_items || []).map((track) => (
                        <div key={track.id} className="border border-border rounded-lg p-4 bg-muted">
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">Track Title</label>
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={track.title}
                                    onChange={(e) => updateTrack(track.id, 'title', e.target.value)}
                                    className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                                    placeholder="e.g., Android"
                                  />
                                ) : (
                                  <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground font-medium">
                                    {track.title}
                                  </div>
                                )}
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">Icon</label>
                                {isEditing ? (
                                  <select
                                    value={track.icon}
                                    onChange={(e) => updateTrack(track.id, 'icon', e.target.value)}
                                    className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-400"
                                  >
                                    <option value="Smartphone">📱 Smartphone (Android)</option>
                                    <option value="Cloud">☁️ Cloud</option>
                                    <option value="Brain">🧠 Brain (AI/ML)</option>
                                    <option value="Code">💻 Code</option>
                                    <option value="Users">👥 Users</option>
                                    <option value="BookOpen">📖 Book</option>
                                  </select>
                                ) : (
                                  <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                                    {track.icon}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-muted-foreground mb-2">Color</label>
                              {isEditing ? (
                                <select
                                  value={track.color}
                                  onChange={(e) => updateTrack(track.id, 'color', e.target.value)}
                                  className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-400"
                                >
                                  <option value="text-gdg-blue">🔵 Blue</option>
                                  <option value="text-gdg-red">🔴 Red</option>
                                  <option value="text-gdg-green">🟢 Green</option>
                                  <option value="text-gdg-yellow">🟡 Yellow</option>
                                </select>
                              ) : (
                                <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                                  {track.color}
                                </div>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-muted-foreground mb-2">Description</label>
                              {isEditing ? (
                                <textarea
                                  rows={3}
                                  value={track.description}
                                  onChange={(e) => updateTrack(track.id, 'description', e.target.value)}
                                  className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                                  placeholder="Describe what this track covers..."
                                />
                              ) : (
                                <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                                  {track.description}
                                </div>
                              )}
                            </div>

                            {isEditing && (
                              <div className="flex justify-end">
                                <button
                                  onClick={() => removeTrack(track.id)}
                                  className="flex items-center space-x-2 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
                                >
                                  <Trash2 size={16} />
                                  <span>Remove Track</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Upcoming Events Section */}
            <div className="border-b border-border pb-8">
              <h3 className="text-lg font-semibold text-foreground mb-6">Upcoming Events Section</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Section Title</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={homePageForm.events_title}
                      onChange={(e) => setHomePageForm(prev => ({ ...prev, events_title: e.target.value }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground text-xl font-semibold">
                      {homePageForm.events_title}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Section Description</label>
                  {isEditing ? (
                    <textarea
                      rows={2}
                      value={homePageForm.events_description}
                      onChange={(e) => setHomePageForm(prev => ({ ...prev, events_description: e.target.value }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                      {homePageForm.events_description}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">CTA Button Text</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={homePageForm.events_cta_text}
                        onChange={(e) => setHomePageForm(prev => ({ ...prev, events_cta_text: e.target.value }))}
                        className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                        {homePageForm.events_cta_text}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">CTA Button Link</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={homePageForm.events_cta_link}
                        onChange={(e) => setHomePageForm(prev => ({ ...prev, events_cta_link: e.target.value }))}
                        className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                        {homePageForm.events_cta_link}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">No Events Message</label>
                  <p className="text-xs text-muted-foreground mb-3">Message shown when no upcoming events are available</p>
                  {isEditing ? (
                    <textarea
                      rows={2}
                      value={homePageForm.events_no_events_message}
                      onChange={(e) => setHomePageForm(prev => ({ ...prev, events_no_events_message: e.target.value }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      placeholder="We're planning exciting events for our community. Check back soon!"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                      {homePageForm.events_no_events_message}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Featured Projects Section */}
            <div className="border-b border-border pb-8">
              <h3 className="text-lg font-semibold text-foreground mb-6">Featured Projects Section</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Section Title</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={homePageForm.projects_title}
                      onChange={(e) => setHomePageForm(prev => ({ ...prev, projects_title: e.target.value }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground text-xl font-semibold">
                      {homePageForm.projects_title}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Section Description</label>
                  {isEditing ? (
                    <textarea
                      rows={3}
                      value={homePageForm.projects_description}
                      onChange={(e) => setHomePageForm(prev => ({ ...prev, projects_description: e.target.value }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                      {homePageForm.projects_description}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">CTA Button Text</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={homePageForm.projects_cta_text}
                        onChange={(e) => setHomePageForm(prev => ({ ...prev, projects_cta_text: e.target.value }))}
                        className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                        {homePageForm.projects_cta_text}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">CTA Button Link</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={homePageForm.projects_cta_link}
                        onChange={(e) => setHomePageForm(prev => ({ ...prev, projects_cta_link: e.target.value }))}
                        className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                        {homePageForm.projects_cta_link}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">No Projects Message</label>
                  <p className="text-xs text-muted-foreground mb-3">Message shown when no projects are available</p>
                  {isEditing ? (
                    <textarea
                      rows={2}
                      value={homePageForm.projects_no_projects_message}
                      onChange={(e) => setHomePageForm(prev => ({ ...prev, projects_no_projects_message: e.target.value }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      placeholder="Our community is working on exciting projects. Check back soon!"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                      {homePageForm.projects_no_projects_message}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Join Community Section */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-6">Join Community Section</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Section Title</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={homePageForm.community_title}
                      onChange={(e) => setHomePageForm(prev => ({ ...prev, community_title: e.target.value }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground text-xl font-semibold">
                      {homePageForm.community_title}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Section Description</label>
                  {isEditing ? (
                    <textarea
                      rows={3}
                      value={homePageForm.community_description}
                      onChange={(e) => setHomePageForm(prev => ({ ...prev, community_description: e.target.value }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                      {homePageForm.community_description}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Feature 1</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={homePageForm.community_feature_1}
                        onChange={(e) => setHomePageForm(prev => ({ ...prev, community_feature_1: e.target.value }))}
                        className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                        {homePageForm.community_feature_1}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Feature 2</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={homePageForm.community_feature_2}
                        onChange={(e) => setHomePageForm(prev => ({ ...prev, community_feature_2: e.target.value }))}
                        className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                        {homePageForm.community_feature_2}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Feature 3</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={homePageForm.community_feature_3}
                        onChange={(e) => setHomePageForm(prev => ({ ...prev, community_feature_3: e.target.value }))}
                        className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                        {homePageForm.community_feature_3}
                      </div>
                    )}
                  </div>
                </div>



                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">CTA Button Text</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={homePageForm.community_cta_text}
                        onChange={(e) => setHomePageForm(prev => ({ ...prev, community_cta_text: e.target.value }))}
                        className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                        {homePageForm.community_cta_text}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">CTA Button Link</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={homePageForm.community_cta_link}
                        onChange={(e) => setHomePageForm(prev => ({ ...prev, community_cta_link: e.target.value }))}
                        className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                        {homePageForm.community_cta_link}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contact Page */}
      {activeTab === 'contact-page' && (
        <div className="bg-card rounded-xl shadow-sm border border-border">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Contact Page Content</h2>
              <p className="text-muted-foreground mt-1">Edit the contact page content and messaging</p>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors font-medium text-gray-300"
              >
                <Edit3 size={16} />
                <span>Edit Content</span>
              </button>
            )}
          </div>

          <div className="p-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Page Title</label>
                <p className="text-xs text-muted-foreground mb-3">Main heading displayed on the Contact page</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={contactPageForm.title}
                    onChange={(e) => setContactPageForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                  />
                ) : (
                  <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground text-2xl font-bold">
                    {contactPageForm.title}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Title Second Line</label>
                <p className="text-xs text-muted-foreground mb-3">Second line of the main heading (e.g., "with GDG@PSU")</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={contactPageForm.title_second_line}
                    onChange={(e) => setContactPageForm(prev => ({ ...prev, title_second_line: e.target.value }))}
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                    placeholder="with GDG@PSU"
                  />
                ) : (
                  <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                    {contactPageForm.title_second_line}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Subtitle</label>
                <p className="text-xs text-muted-foreground mb-3">Secondary heading shown below the main title</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={contactPageForm.subtitle}
                    onChange={(e) => setContactPageForm(prev => ({ ...prev, subtitle: e.target.value }))}
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                  />
                ) : (
                  <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground text-lg">
                    {contactPageForm.subtitle}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Description</label>
                <p className="text-xs text-muted-foreground mb-3">Descriptive text shown below the page title</p>
                {isEditing ? (
                  <textarea
                    rows={4}
                    value={contactPageForm.description}
                    onChange={(e) => setContactPageForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                  />
                ) : (
                  <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                    {contactPageForm.description}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Contact Form Title</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={contactPageForm.form_title}
                    onChange={(e) => setContactPageForm(prev => ({ ...prev, form_title: e.target.value }))}
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                  />
                ) : (
                  <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                    {contactPageForm.form_title}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Success Message</label>
                {isEditing ? (
                  <textarea
                    rows={3}
                    value={contactPageForm.success_message}
                    onChange={(e) => setContactPageForm(prev => ({ ...prev, success_message: e.target.value }))}
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                  />
                ) : (
                  <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                    {contactPageForm.success_message}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Submit Button Text</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={contactPageForm.button_text}
                    onChange={(e) => setContactPageForm(prev => ({ ...prev, button_text: e.target.value }))}
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                  />
                ) : (
                  <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                    {contactPageForm.button_text}
                  </div>
                )}
              </div>

              <div className="border-t border-border pt-6 mt-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Contact Information Section</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Quick Contact Title</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={contactPageForm.quick_contact_title}
                        onChange={(e) => setContactPageForm(prev => ({ ...prev, quick_contact_title: e.target.value }))}
                        className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                        {contactPageForm.quick_contact_title}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Email Label</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={contactPageForm.email_label}
                        onChange={(e) => setContactPageForm(prev => ({ ...prev, email_label: e.target.value }))}
                        className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                        {contactPageForm.email_label}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Discord Label</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={contactPageForm.discord_label}
                        onChange={(e) => setContactPageForm(prev => ({ ...prev, discord_label: e.target.value }))}
                        className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                        {contactPageForm.discord_label}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Discord Description</label>
                    <p className="text-xs text-muted-foreground mb-3">Description text shown under Discord link</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={contactPageForm.discord_description}
                        onChange={(e) => setContactPageForm(prev => ({ ...prev, discord_description: e.target.value }))}
                        className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                        {contactPageForm.discord_description}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Email URL</label>
                    {isEditing ? (
                      <div className="space-y-2">
                        <select
                          onChange={(e) => {
                            if (e.target.value === 'custom') return;
                            const selectedLink = allLinks.find(link => link.id === e.target.value);
                            if (selectedLink) {
                              setContactPageForm(prev => ({ ...prev, email_url: selectedLink.url }));
                            }
                          }}
                          className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-blue-400"
                        >
                          <option value="custom">Custom URL or select from links</option>
                          {allLinks
                            .filter(link => link.url.includes('mailto:') || link.category.toLowerCase().includes('email') || link.name.toLowerCase().includes('email'))
                            .map(link => (
                              <option key={link.id} value={link.id}>
                                {link.name} - {link.url}
                              </option>
                            ))}
                        </select>
                        <input
                          type="text"
                          value={contactPageForm.email_url || ''}
                          onChange={(e) => setContactPageForm(prev => ({ ...prev, email_url: e.target.value }))}
                          placeholder="mailto:contact@gdgpsu.org or custom URL"
                          className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                        />
                      </div>
                    ) : (
                      <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                        {contactPageForm.email_url || 'mailto:contact@gdgpsu.org'}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Discord URL</label>
                    {isEditing ? (
                      <div className="space-y-2">
                        <select
                          onChange={(e) => {
                            if (e.target.value === 'custom') return;
                            const selectedLink = allLinks.find(link => link.id === e.target.value);
                            if (selectedLink) {
                              setContactPageForm(prev => ({ ...prev, discord_url: selectedLink.url }));
                            }
                          }}
                          className="w-full px-3 py-2 border border-border rounded-lg bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-blue-400"
                        >
                          <option value="custom">Custom URL or select from links</option>
                          {allLinks
                            .filter(link => link.url.includes('discord') || link.category.toLowerCase().includes('social') || link.name.toLowerCase().includes('discord'))
                            .map(link => (
                              <option key={link.id} value={link.id}>
                                {link.name} - {link.url}
                              </option>
                            ))}
                        </select>
                        <input
                          type="text"
                          value={contactPageForm.discord_url || ''}
                          onChange={(e) => setContactPageForm(prev => ({ ...prev, discord_url: e.target.value }))}
                          placeholder="https://discord.gg/gdgpsu or custom URL"
                          className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                        />
                      </div>
                    ) : (
                      <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                        {contactPageForm.discord_url || 'Not set'}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Office Hours Label</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={contactPageForm.office_hours_label}
                        onChange={(e) => setContactPageForm(prev => ({ ...prev, office_hours_label: e.target.value }))}
                        className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                        {contactPageForm.office_hours_label}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Office Hours Information</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={contactPageForm.office_hours_info}
                        onChange={(e) => setContactPageForm(prev => ({ ...prev, office_hours_info: e.target.value }))}
                        className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                        {contactPageForm.office_hours_info}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Meeting Information */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Meeting Information</h3>
              <p className="text-sm text-muted-foreground mb-4">Displayed in "When & Where We Meet" section on Contact page</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Meeting Time</label>
                  <p className="text-xs text-muted-foreground mb-3">When your regular meetings happen (e.g., "Thursdays at 7:00 PM")</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={contactPageForm.meeting_time}
                      onChange={(e) => setContactPageForm(prev => ({ ...prev, meeting_time: e.target.value }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      placeholder="Thursdays at 7:00 PM"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                      {contactPageForm.meeting_time}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Meeting Location</label>
                  <p className="text-xs text-muted-foreground mb-3">Where your meetings take place (e.g., "Thomas Building 100")</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={contactPageForm.meeting_location}
                      onChange={(e) => setContactPageForm(prev => ({ ...prev, meeting_location: e.target.value }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      placeholder="Thomas Building 100"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                      {contactPageForm.meeting_location}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Links */}
            <div className="border-t border-border pt-6 mt-6">
              <div>
                {/* Additional Links Title */}
                <div className="border-t border-border pt-6 mt-6">
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Additional Links Section Title</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={contactPageForm.additional_links_title}
                        onChange={(e) => setContactPageForm(prev => ({ ...prev, additional_links_title: e.target.value }))}
                        className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                        {contactPageForm.additional_links_title}
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Page Links Section */}
                <div className="border-t border-border pt-6 mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Additional Contact Links</h3>
                      <p className="text-sm text-muted-foreground">Select additional links from your Links & URLs to display in the contact info section</p>
                    </div>
                    {isEditing && allLinks.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              addContactLink(e.target.value);
                              e.target.value = '';
                            }
                          }}
                          className="px-3 py-2 border border-border rounded-lg bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-blue-400"
                        >
                          <option value="">Select a link to add</option>
                          {allLinks
                            .filter(link => !contactPageForm.contact_links.find(cl => cl.id === link.id))
                            .map(link => (
                              <option key={link.id} value={link.id}>
                                {link.name} ({link.category})
                              </option>
                            ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {contactPageForm.contact_links.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground border border-border rounded-lg">
                      <p>No links selected for the contact page.</p>
                      {isEditing && allLinks.length > 0 && (
                        <p className="text-sm mt-2">Use the dropdown above to add links from your Links & URLs section.</p>
                      )}
                      {allLinks.length === 0 && (
                        <p className="text-sm mt-2">Add some links in the Links & URLs section first.</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {contactPageForm.contact_links.map((link) => (
                        <div key={link.id} className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <div>
                                <h4 className="font-medium text-foreground">{link.name}</h4>
                                <p className="text-sm text-muted-foreground">{link.url}</p>
                                {link.description && (
                                  <p className="text-xs text-muted-foreground mt-1">{link.description}</p>
                                )}
                              </div>
                              <span className="px-2 py-1 bg-primary text-blue-100 text-xs rounded-full">
                                {link.category}
                              </span>
                            </div>
                          </div>
                          {isEditing && (
                            <button
                              onClick={() => removeContactLink(link.id)}
                              className="ml-4 p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Links & URLs */}
      {activeTab === 'links-urls' && (
        <div className="bg-card rounded-xl shadow-sm border border-border">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Links & URLs</h2>
              <p className="text-muted-foreground mt-1">Manage all external links (Discord, GitHub, social media) used throughout the site</p>
            </div>
            <div className="flex items-center space-x-3">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors font-medium text-gray-300"
                >
                  <Edit3 size={16} />
                  <span>Edit Content</span>
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors font-medium text-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">All Links</h3>
                <p className="text-sm text-muted-foreground">Manage all links used throughout your website</p>
              </div>
              {isEditing && (
                <button
                  onClick={addLink}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary text-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  <Plus size={16} />
                  <span>Add Link</span>
                </button>
              )}
            </div>

            {allLinks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No links added yet.</p>
                {isEditing && (
                  <p className="text-sm mt-2">Click "Add Link" to create your first link.</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {allLinks.map((link) => (
                  <div key={link.id} className="border border-border rounded-lg p-4">
                    <div className="space-y-4">
                      {/* First Row: Name, URL, Category */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-muted-foreground mb-2">Link Name</label>
                          {isEditing ? (
                            <input
                              type="text"
                              value={link.name}
                              onChange={(e) => updateLink(link.id, 'name', e.target.value)}
                              className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground appearance-none"
                              placeholder="e.g., Discord Server"
                            />
                          ) : (
                            <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                              {link.name || 'Unnamed Link'}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-muted-foreground mb-2">URL</label>
                          {isEditing ? (
                            <input
                              type="url"
                              value={link.url}
                              onChange={(e) => updateLink(link.id, 'url', e.target.value)}
                              className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground appearance-none"
                              placeholder="https://example.com"
                            />
                          ) : (
                            <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground break-all">
                              {link.url || 'No URL'}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-muted-foreground mb-2">Category</label>
                          {isEditing ? (
                            <input
                              type="text"
                              value={link.category}
                              onChange={(e) => updateLink(link.id, 'category', e.target.value)}
                              className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground appearance-none"
                              placeholder="e.g., Social, Development, Official"
                              list={`categories-${link.id}`}
                            />
                          ) : (
                            <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                              {link.category || 'No category'}
                            </div>
                          )}
                          {isEditing && (
                            <datalist id={`categories-${link.id}`}>
                              <option value="Social" />
                              <option value="Development" />
                              <option value="Official" />
                              <option value="Custom" />
                              <option value="Communication" />
                              <option value="Education" />
                              <option value="Events" />
                              <option value="Resources" />
                            </datalist>
                          )}
                        </div>
                      </div>

                      {/* Second Row: Description and Actions */}
                      <div className="flex items-end gap-4">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-muted-foreground mb-2">Description</label>
                          {isEditing ? (
                            <input
                              type="text"
                              value={link.description}
                              onChange={(e) => updateLink(link.id, 'description', e.target.value)}
                              className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground appearance-none"
                              placeholder="Optional description"
                            />
                          ) : (
                            <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                              {link.description || 'No description'}
                            </div>
                          )}
                        </div>
                        {isEditing && (
                          <button
                            onClick={() => removeLink(link.id)}
                            className="p-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0"
                            title="Remove link"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold text-foreground mb-2">📝 How it works</h4>
              <p className="text-sm text-gray-300">
                These links will automatically populate throughout your website wherever they're referenced.
                Update them here once and they'll be updated everywhere - in the footer, contact page, social media sections, etc.
              </p>
              <p className="text-sm text-gray-300 mt-2">
                <strong>Usage:</strong> Use <code className="bg-card px-1 rounded">getLink('discord')</code> or <code className="bg-card px-1 rounded">getLink('github')</code> in your components to reference links.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      {activeTab === 'navigation' && (
        <div className="bg-card rounded-xl shadow-sm border border-border">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Navigation Menu</h2>
              <p className="text-muted-foreground mt-1">Manage the main navigation menu items shown in the site header</p>
            </div>
            <div className="flex items-center space-x-3">
              {isEditing && (
                <button
                  onClick={addNavigationItem}
                  className="flex items-center space-x-2 px-4 py-2 border border-blue-600 text-primary rounded-lg hover:bg-muted transition-colors font-medium"
                >
                  <Plus size={16} />
                  <span>Add Item</span>
                </button>
              )}
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors font-medium text-gray-300"
                >
                  <Edit3 size={16} />
                  <span>Edit Content</span>
                </button>
              )}
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {navigationForm.map((item, index) => (
                <div
                  key={item.id || index}
                  className={`flex items-center space-x-4 p-4 border rounded-lg transition-all ${draggedItem === index
                    ? 'opacity-50 scale-95 border-gray-600'
                    : dragOverIndex === index && draggedItem !== null && draggedItem !== index
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-border'
                    }`}
                  draggable={isEditing}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                >
                  {/* Drag Handle */}
                  {isEditing && (
                    <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-gray-300 transition-colors">
                      <GripVertical size={20} />
                    </div>
                  )}

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">Label</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={item.label}
                          onChange={(e) => {
                            const newNav = [...navigationForm];
                            newNav[index].label = e.target.value;
                            setNavigationForm(newNav);
                          }}
                          className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                          placeholder="Menu item label"
                        />
                      ) : (
                        <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                          {item.label || 'Untitled'}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">Link</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={item.href}
                          onChange={(e) => {
                            const newNav = [...navigationForm];
                            newNav[index].href = e.target.value;
                            setNavigationForm(newNav);
                          }}
                          className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                          placeholder="/page-url or https://external.com"
                        />
                      ) : (
                        <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground flex items-center">
                          {item.href || 'No link'}
                          {item.href && item.href.startsWith('http') && <ExternalLink size={14} className="ml-2 text-muted-foreground" />}
                        </div>
                      )}
                    </div>
                  </div>
                  {isEditing && (
                    <button
                      onClick={() => removeNavigationItem(index)}
                      className="p-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}

              {navigationForm.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No navigation items yet. {isEditing && 'Click "Add Item" to get started.'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Events Page */}
      {activeTab === 'events-page' && (
        <div className="bg-card rounded-xl shadow-sm border border-border">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Events Page Content</h2>
              <p className="text-muted-foreground mt-1">Manage the content displayed on the Events page</p>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors font-medium text-gray-300"
              >
                <Edit3 size={16} />
                <span>Edit Content</span>
              </button>
            )}
          </div>

          <div className="p-6 space-y-6">
            {/* Header Section */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Page Header</h3>
              <p className="text-sm text-muted-foreground mb-4">Main header content shown at the top of the Events page</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Page Title</label>
                  <p className="text-xs text-muted-foreground mb-3">Large heading displayed at the top of the Events page</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={eventsPageForm.title}
                      onChange={(e) => setEventsPageForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      placeholder="Events & Workshops"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                      {eventsPageForm.title}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Page Description</label>
                  <p className="text-xs text-muted-foreground mb-3">Descriptive text shown below the page title</p>
                  {isEditing ? (
                    <textarea
                      rows={3}
                      value={eventsPageForm.description}
                      onChange={(e) => setEventsPageForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      placeholder="Join our community for hands-on workshops..."
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                      {eventsPageForm.description}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section Titles */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Section Titles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Upcoming Events Section</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={eventsPageForm.upcoming_section_title}
                      onChange={(e) => setEventsPageForm(prev => ({ ...prev, upcoming_section_title: e.target.value }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      placeholder="Upcoming Events"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                      {eventsPageForm.upcoming_section_title}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Past Events Section</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={eventsPageForm.past_section_title}
                      onChange={(e) => setEventsPageForm(prev => ({ ...prev, past_section_title: e.target.value }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      placeholder="Past Events"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                      {eventsPageForm.past_section_title}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Messages</h3>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">No Events Message</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={eventsPageForm.no_events_message}
                    onChange={(e) => setEventsPageForm(prev => ({ ...prev, no_events_message: e.target.value }))}
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                    placeholder="No events scheduled at the moment. Check back soon!"
                  />
                ) : (
                  <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                    {eventsPageForm.no_events_message}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Projects Page */}
      {activeTab === 'projects-page' && (
        <div className="bg-card rounded-xl shadow-sm border border-border">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Projects Page Content</h2>
              <p className="text-muted-foreground mt-1">Manage the content displayed on the Projects page</p>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors font-medium text-gray-300"
              >
                <Edit3 size={16} />
                <span>Edit Content</span>
              </button>
            )}
          </div>

          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Page Header</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Main Title</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={projectsPageForm.title}
                      onChange={(e) => setProjectsPageForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      placeholder="Student"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                      {projectsPageForm.title}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Highlighted Subtitle</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={projectsPageForm.subtitle}
                      onChange={(e) => setProjectsPageForm(prev => ({ ...prev, subtitle: e.target.value }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      placeholder="Projects"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                      {projectsPageForm.subtitle}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Description</label>
                  {isEditing ? (
                    <textarea
                      rows={3}
                      value={projectsPageForm.description}
                      onChange={(e) => setProjectsPageForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      placeholder="Discover innovative projects built by our community members..."
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                      {projectsPageForm.description}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Section Titles & CTAs</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Featured Section Title</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={projectsPageForm.featured_section_title}
                      onChange={(e) => setProjectsPageForm(prev => ({ ...prev, featured_section_title: e.target.value }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      placeholder="Featured Projects"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                      {projectsPageForm.featured_section_title}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">All Projects Title</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={projectsPageForm.all_projects_title}
                      onChange={(e) => setProjectsPageForm(prev => ({ ...prev, all_projects_title: e.target.value }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      placeholder="All Projects"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                      {projectsPageForm.all_projects_title}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Contribute CTA Text</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={projectsPageForm.contribute_cta}
                      onChange={(e) => setProjectsPageForm(prev => ({ ...prev, contribute_cta: e.target.value }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      placeholder="Want to showcase your project?"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                      {projectsPageForm.contribute_cta}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Contribute Button Text</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={projectsPageForm.contribute_button}
                      onChange={(e) => setProjectsPageForm(prev => ({ ...prev, contribute_button: e.target.value }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      placeholder="Submit Project"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                      {projectsPageForm.contribute_button}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Team Page */}
      {activeTab === 'team-page' && (
        <div className="bg-card rounded-xl shadow-sm border border-border">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Team Page Content</h2>
              <p className="text-muted-foreground mt-1">Manage the content displayed on the Team page</p>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors font-medium text-gray-300"
              >
                <Edit3 size={16} />
                <span>Edit Content</span>
              </button>
            )}
          </div>

          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Page Header</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Main Title</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={teamPageForm.title}
                      onChange={(e) => setTeamPageForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      placeholder="Meet Our"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                      {teamPageForm.title}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Highlighted Subtitle</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={teamPageForm.subtitle}
                      onChange={(e) => setTeamPageForm(prev => ({ ...prev, subtitle: e.target.value }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      placeholder="Team"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                      {teamPageForm.subtitle}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Description</label>
                  {isEditing ? (
                    <textarea
                      rows={3}
                      value={teamPageForm.description}
                      onChange={(e) => setTeamPageForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      placeholder="The passionate students and mentors who make GDG@PSU..."
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                      {teamPageForm.description}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Section Titles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Leadership Section</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={teamPageForm.leadership_title}
                      onChange={(e) => setTeamPageForm(prev => ({ ...prev, leadership_title: e.target.value }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      placeholder="Leadership Team"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                      {teamPageForm.leadership_title}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Organizers Section</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={teamPageForm.organizers_title}
                      onChange={(e) => setTeamPageForm(prev => ({ ...prev, organizers_title: e.target.value }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      placeholder="Organizers"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                      {teamPageForm.organizers_title}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Members Section</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={teamPageForm.members_title}
                      onChange={(e) => setTeamPageForm(prev => ({ ...prev, members_title: e.target.value }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      placeholder="Active Members"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                      {teamPageForm.members_title}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Join Team CTA</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={teamPageForm.join_team_cta}
                      onChange={(e) => setTeamPageForm(prev => ({ ...prev, join_team_cta: e.target.value }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      placeholder="Interested in joining our team?"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                      {teamPageForm.join_team_cta}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Call to Action</h3>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Join Team Button Text</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={teamPageForm.join_team_button}
                    onChange={(e) => setTeamPageForm(prev => ({ ...prev, join_team_button: e.target.value }))}
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                    placeholder="Get Involved"
                  />
                ) : (
                  <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                    {teamPageForm.join_team_button}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Blog Page */}
      {activeTab === 'blog-page' && (
        <div className="bg-card rounded-xl shadow-sm border border-border">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Blog Page Content</h2>
              <p className="text-muted-foreground mt-1">Manage the content displayed on the Blog page</p>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors font-medium text-gray-300"
              >
                <Edit3 size={16} />
                <span>Edit Content</span>
              </button>
            )}
          </div>

          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Page Header</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Page Title</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={blogPageForm.title}
                      onChange={(e) => setBlogPageForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      placeholder="Blog & Updates"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                      {blogPageForm.title}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Description</label>
                  {isEditing ? (
                    <textarea
                      rows={3}
                      value={blogPageForm.description}
                      onChange={(e) => setBlogPageForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      placeholder="Insights, tutorials, and updates from our community..."
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                      {blogPageForm.description}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Section Titles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Featured Posts Section</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={blogPageForm.featured_title}
                      onChange={(e) => setBlogPageForm(prev => ({ ...prev, featured_title: e.target.value }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      placeholder="Featured Posts"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                      {blogPageForm.featured_title}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Recent Posts Section</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={blogPageForm.recent_title}
                      onChange={(e) => setBlogPageForm(prev => ({ ...prev, recent_title: e.target.value }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      placeholder="Recent Posts"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                      {blogPageForm.recent_title}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Categories Section</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={blogPageForm.categories_title}
                      onChange={(e) => setBlogPageForm(prev => ({ ...prev, categories_title: e.target.value }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      placeholder="Categories"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                      {blogPageForm.categories_title}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Search Placeholder</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={blogPageForm.search_placeholder}
                      onChange={(e) => setBlogPageForm(prev => ({ ...prev, search_placeholder: e.target.value }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      placeholder="Search articles..."
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                      {blogPageForm.search_placeholder}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Messages</h3>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">No Posts Message</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={blogPageForm.no_posts_message}
                    onChange={(e) => setBlogPageForm(prev => ({ ...prev, no_posts_message: e.target.value }))}
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                    placeholder="No blog posts available yet."
                  />
                ) : (
                  <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                    {blogPageForm.no_posts_message}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sponsors Page */}
      {activeTab === 'sponsors-page' && (
        <div className="bg-card rounded-xl shadow-sm border border-border">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Sponsors Page Content</h2>
              <p className="text-muted-foreground mt-1">Manage the content displayed on the Sponsors page</p>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors font-medium text-gray-300"
              >
                <Edit3 size={16} />
                <span>Edit Content</span>
              </button>
            )}
          </div>

          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Page Header</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Main Title</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={sponsorsPageForm.title}
                      onChange={(e) => setSponsorsPageForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      placeholder="Our"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                      {sponsorsPageForm.title}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Highlighted Subtitle</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={sponsorsPageForm.subtitle}
                      onChange={(e) => setSponsorsPageForm(prev => ({ ...prev, subtitle: e.target.value }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      placeholder="Sponsors"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                      {sponsorsPageForm.subtitle}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Description</label>
                  {isEditing ? (
                    <textarea
                      rows={3}
                      value={sponsorsPageForm.description}
                      onChange={(e) => setSponsorsPageForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      placeholder="We're grateful to our sponsors and partners..."
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                      {sponsorsPageForm.description}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Sponsor Tier Titles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Platinum Sponsors</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={sponsorsPageForm.platinum_title}
                      onChange={(e) => setSponsorsPageForm(prev => ({ ...prev, platinum_title: e.target.value }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      placeholder="Platinum Sponsors"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                      {sponsorsPageForm.platinum_title}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Gold Sponsors</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={sponsorsPageForm.gold_title}
                      onChange={(e) => setSponsorsPageForm(prev => ({ ...prev, gold_title: e.target.value }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      placeholder="Gold Sponsors"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                      {sponsorsPageForm.gold_title}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Silver Sponsors</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={sponsorsPageForm.silver_title}
                      onChange={(e) => setSponsorsPageForm(prev => ({ ...prev, silver_title: e.target.value }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      placeholder="Silver Sponsors"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                      {sponsorsPageForm.silver_title}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Community Partners</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={sponsorsPageForm.community_title}
                      onChange={(e) => setSponsorsPageForm(prev => ({ ...prev, community_title: e.target.value }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      placeholder="Community Partners"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                      {sponsorsPageForm.community_title}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Call to Action</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Become Sponsor CTA</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={sponsorsPageForm.become_sponsor_cta}
                      onChange={(e) => setSponsorsPageForm(prev => ({ ...prev, become_sponsor_cta: e.target.value }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      placeholder="Interested in sponsoring us?"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                      {sponsorsPageForm.become_sponsor_cta}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Sponsor Button Text</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={sponsorsPageForm.become_sponsor_button}
                      onChange={(e) => setSponsorsPageForm(prev => ({ ...prev, become_sponsor_button: e.target.value }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      placeholder="Partner With Us"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                      {sponsorsPageForm.become_sponsor_button}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resources Page */}
      {activeTab === 'resources-page' && (
        <div className="bg-card rounded-xl shadow-sm border border-border">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Resources Page Content</h2>
              <p className="text-muted-foreground mt-1">Manage the content displayed on the Resources page</p>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors font-medium text-gray-300"
              >
                <Edit3 size={16} />
                <span>Edit Content</span>
              </button>
            )}
          </div>

          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Page Header</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Main Title</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={resourcesPageForm.title}
                      onChange={(e) => setResourcesPageForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      placeholder="Learning"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                      {resourcesPageForm.title}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Highlighted Subtitle</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={resourcesPageForm.subtitle}
                      onChange={(e) => setResourcesPageForm(prev => ({ ...prev, subtitle: e.target.value }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      placeholder="Resources"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                      {resourcesPageForm.subtitle}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Description</label>
                  {isEditing ? (
                    <textarea
                      rows={3}
                      value={resourcesPageForm.description}
                      onChange={(e) => setResourcesPageForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      placeholder="Access study materials, cloud credits, documentation..."
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                      {resourcesPageForm.description}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Resource Section Titles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Study Materials</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={resourcesPageForm.study_materials_title}
                      onChange={(e) => setResourcesPageForm(prev => ({ ...prev, study_materials_title: e.target.value }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      placeholder="Study Materials"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                      {resourcesPageForm.study_materials_title}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Cloud Credits</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={resourcesPageForm.cloud_credits_title}
                      onChange={(e) => setResourcesPageForm(prev => ({ ...prev, cloud_credits_title: e.target.value }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      placeholder="Cloud Credits"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                      {resourcesPageForm.cloud_credits_title}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Documentation</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={resourcesPageForm.documentation_title}
                      onChange={(e) => setResourcesPageForm(prev => ({ ...prev, documentation_title: e.target.value }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      placeholder="Documentation"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                      {resourcesPageForm.documentation_title}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Session Recordings</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={resourcesPageForm.recordings_title}
                      onChange={(e) => setResourcesPageForm(prev => ({ ...prev, recordings_title: e.target.value }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      placeholder="Session Recordings"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                      {resourcesPageForm.recordings_title}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Developer Tools</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={resourcesPageForm.tools_title}
                      onChange={(e) => setResourcesPageForm(prev => ({ ...prev, tools_title: e.target.value }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      placeholder="Developer Tools"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                      {resourcesPageForm.tools_title}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      {activeTab === 'footer' && (
        <div className="bg-card rounded-xl shadow-sm border border-border">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Footer Content</h2>
              <p className="text-muted-foreground mt-1">Manage footer text and social media links</p>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors font-medium text-gray-300"
              >
                <Edit3 size={16} />
                <span>Edit Content</span>
              </button>
            )}
          </div>

          <div className="p-6 space-y-8">
            {/* Footer Text */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Footer Text</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Description</label>
                  {isEditing ? (
                    <textarea
                      rows={3}
                      value={footerForm.description}
                      onChange={(e) => setFooterForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                      {footerForm.description}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Copyright Text</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={footerForm.copyright}
                      onChange={(e) => setFooterForm(prev => ({ ...prev, copyright: e.target.value }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                      {footerForm.copyright}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Social Links - Using Links & URLs */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Social Media Links</h3>
                  <p className="text-sm text-muted-foreground mt-1">Links are managed in the "Links & URLs" tab above</p>
                </div>
                <button
                  onClick={() => setActiveTab('links-urls')}
                  className="flex items-center space-x-2 px-4 py-2 border border-blue-600 text-primary rounded-lg hover:bg-muted transition-colors font-medium"
                >
                  <ExternalLink size={16} />
                  <span>Manage Links</span>
                </button>
              </div>

              {/* Display links from the main Links & URLs panel */}
              <div className="space-y-4">
                {allLinks.filter(link => link.category === 'Social').length > 0 ? (
                  allLinks.filter(link => link.category === 'Social').map((link) => (
                    <div key={link.id} className="p-4 border border-border rounded-lg bg-muted">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-muted-foreground mb-1">Link Name</label>
                          <div className="text-foreground font-medium">{link.name}</div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-muted-foreground mb-1">URL</label>
                          <div className="text-foreground break-all">{link.url}</div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-muted-foreground mb-1">Description</label>
                          <div className="text-foreground">{link.description || 'No description'}</div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 border border-border rounded-lg bg-muted">
                    <div className="text-muted-foreground mb-2">No social media links found</div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add links with category "Social" in the Links & URLs tab to display them here.
                    </p>
                    <button
                      onClick={() => setActiveTab('links-urls')}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-primary text-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                    >
                      <Plus size={16} />
                      <span>Add Social Links</span>
                    </button>
                  </div>
                )}

                {/* Show all other categories as well */}
                {['Development', 'Official', 'Communication', 'Custom'].map(category => {
                  const categoryLinks = allLinks.filter(link => link.category === category);
                  if (categoryLinks.length === 0) return null;

                  return (
                    <div key={category} className="mt-6">
                      <h4 className="text-md font-semibold text-foreground mb-3">{category} Links</h4>
                      <div className="space-y-3">
                        {categoryLinks.map((link) => (
                          <div key={link.id} className="p-3 border border-border rounded-lg bg-muted">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-foreground font-medium">{link.name}</div>
                                <div className="text-sm text-muted-foreground">{link.url}</div>
                              </div>
                              <div className="text-xs text-muted-foreground bg-gray-800 px-2 py-1 rounded">
                                {category}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Quick Links</h3>
                {isEditing && (
                  <button
                    onClick={() => setFooterForm(prev => ({
                      ...prev,
                      quickLinks: [...prev.quickLinks, { name: '', href: '' }]
                    }))}
                    className="flex items-center space-x-2 px-3 py-2 border border-blue-600 text-primary rounded-lg hover:bg-muted transition-colors text-sm"
                  >
                    <Plus size={14} />
                    <span>Add Link</span>
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {footerForm.quickLinks.map((link, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-border rounded-lg bg-muted">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">Link Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={link.name}
                          onChange={(e) => {
                            const newLinks = [...footerForm.quickLinks];
                            newLinks[index].name = e.target.value;
                            setFooterForm(prev => ({ ...prev, quickLinks: newLinks }));
                          }}
                          className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                          placeholder="e.g., Events"
                        />
                      ) : (
                        <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                          {link.name}
                        </div>
                      )}
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-muted-foreground mb-2">URL</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={link.href}
                            onChange={(e) => {
                              const newLinks = [...footerForm.quickLinks];
                              newLinks[index].href = e.target.value;
                              setFooterForm(prev => ({ ...prev, quickLinks: newLinks }));
                            }}
                            className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                            placeholder="/events"
                          />
                        ) : (
                          <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                            {link.href}
                          </div>
                        )}
                      </div>
                      {isEditing && (
                        <button
                          onClick={() => {
                            const newLinks = footerForm.quickLinks.filter((_, i) => i !== index);
                            setFooterForm(prev => ({ ...prev, quickLinks: newLinks }));
                          }}
                          className="p-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resources */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Resources</h3>
                {isEditing && (
                  <button
                    onClick={() => setFooterForm(prev => ({
                      ...prev,
                      resources: [...prev.resources, { name: '', href: '' }]
                    }))}
                    className="flex items-center space-x-2 px-3 py-2 border border-blue-600 text-primary rounded-lg hover:bg-muted transition-colors text-sm"
                  >
                    <Plus size={14} />
                    <span>Add Resource</span>
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {footerForm.resources.map((resource, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-border rounded-lg bg-muted">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">Resource Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={resource.name}
                          onChange={(e) => {
                            const newResources = [...footerForm.resources];
                            newResources[index].name = e.target.value;
                            setFooterForm(prev => ({ ...prev, resources: newResources }));
                          }}
                          className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                          placeholder="e.g., Study Jams"
                        />
                      ) : (
                        <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                          {resource.name}
                        </div>
                      )}
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-muted-foreground mb-2">URL</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={resource.href}
                            onChange={(e) => {
                              const newResources = [...footerForm.resources];
                              newResources[index].href = e.target.value;
                              setFooterForm(prev => ({ ...prev, resources: newResources }));
                            }}
                            className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                            placeholder="/resources"
                          />
                        ) : (
                          <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                            {resource.href}
                          </div>
                        )}
                      </div>
                      {isEditing && (
                        <button
                          onClick={() => {
                            const newResources = footerForm.resources.filter((_, i) => i !== index);
                            setFooterForm(prev => ({ ...prev, resources: newResources }));
                          }}
                          className="p-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Email</label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={footerForm.contactInfo.email}
                      onChange={(e) => setFooterForm(prev => ({
                        ...prev,
                        contactInfo: { ...prev.contactInfo, email: e.target.value }
                      }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      placeholder="contact@gdgpsu.org"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                      {footerForm.contactInfo.email}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Phone (Optional)</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={footerForm.contactInfo.phone}
                      onChange={(e) => setFooterForm(prev => ({
                        ...prev,
                        contactInfo: { ...prev.contactInfo, phone: e.target.value }
                      }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      placeholder="(555) 123-4567"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                      {footerForm.contactInfo.phone || 'Not provided'}
                    </div>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Address</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={footerForm.contactInfo.address}
                      onChange={(e) => setFooterForm(prev => ({
                        ...prev,
                        contactInfo: { ...prev.contactInfo, address: e.target.value }
                      }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      placeholder="Penn State University, University Park, PA"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                      {footerForm.contactInfo.address}
                    </div>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Office Hours</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={footerForm.contactInfo.officeHours}
                      onChange={(e) => setFooterForm(prev => ({
                        ...prev,
                        contactInfo: { ...prev.contactInfo, officeHours: e.target.value }
                      }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      placeholder="Wednesdays 4-6 PM, IST Building"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                      {footerForm.contactInfo.officeHours}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Newsletter Settings */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Newsletter Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Newsletter Title</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={footerForm.newsletter.title}
                      onChange={(e) => setFooterForm(prev => ({
                        ...prev,
                        newsletter: { ...prev.newsletter, title: e.target.value }
                      }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      placeholder="Stay Updated"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                      {footerForm.newsletter.title}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Newsletter Description</label>
                  {isEditing ? (
                    <textarea
                      rows={3}
                      value={footerForm.newsletter.description}
                      onChange={(e) => setFooterForm(prev => ({
                        ...prev,
                        newsletter: { ...prev.newsletter, description: e.target.value }
                      }))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                      placeholder="Get the latest updates on events, workshops, and opportunities."
                    />
                  ) : (
                    <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                      {footerForm.newsletter.description}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Input Placeholder</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={footerForm.newsletter.placeholder}
                        onChange={(e) => setFooterForm(prev => ({
                          ...prev,
                          newsletter: { ...prev.newsletter, placeholder: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                        placeholder="Enter your email"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                        {footerForm.newsletter.placeholder}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Button Text</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={footerForm.newsletter.buttonText}
                        onChange={(e) => setFooterForm(prev => ({
                          ...prev,
                          newsletter: { ...prev.newsletter, buttonText: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground placeholder:text-muted-foreground"
                        placeholder="Subscribe"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-card border border-border rounded-lg text-foreground">
                        {footerForm.newsletter.buttonText}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminContent;