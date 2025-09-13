import React, { useState } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { useContent } from '@/contexts/ContentContext';
import { useDev } from '@/contexts/DevContext';
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
  GripVertical
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { ContentService } from '@/services/contentService';

const AdminContent = () => {
  const { isAuthenticated, currentAdmin } = useAdmin();
  const { isDevelopmentMode, allowDirectAdminAccess } = useDev();
  const {
    siteSettings,
    pageContent,
    navigationItems,
    footerContent,
    refreshContent
  } = useContent();

  const [activeTab, setActiveTab] = useState('site-settings');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Allow direct access in development mode if enabled
  const canAccess = isAuthenticated || (isDevelopmentMode && allowDirectAdminAccess);

  if (!canAccess) {
    return <Navigate to="/" replace />;
  }

  // Form states for different sections
  const [siteSettingsForm, setSiteSettingsForm] = useState({
    site_title: siteSettings.site_title || 'GDG@PSU',
    site_subtitle: siteSettings.site_subtitle || 'Penn State University',
    site_description: siteSettings.site_description || 'A student-led community passionate about Google technologies',
    contact_email: siteSettings.contact_email || 'contact@gdgpsu.org',
    meeting_time: siteSettings.meeting_time || 'Thursdays at 7:00 PM',
    meeting_location: siteSettings.meeting_location || 'Thomas Building 100'
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

      // Featured Projects Section
      projects_title: projectsContent.title || '',
      projects_description: projectsContent.description || '',
      projects_cta_text: projectsContent.cta_text || '',
      projects_cta_link: projectsContent.cta_link || '',

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
      console.warn('Error parsing contact links:', error);
    }



    return {
      title: mainContent.title || 'Get in Touch',
      subtitle: mainContent.subtitle || 'Ready to join our community?',
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
      additional_links_title: mainContent.additional_links_title || 'Additional Links',
      contact_links: contactLinks || []
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
          console.error('Error parsing links:', error);
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
        console.warn('Error parsing footer section:', error);
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

  const tabs = [
    { id: 'site-settings', label: 'Site Settings', icon: Settings },
    { id: 'home-page', label: 'Home Page', icon: Home },
    { id: 'contact-page', label: 'Contact Page', icon: Mail },
    { id: 'links-urls', label: 'Links & URLs', icon: ExternalLink },
    { id: 'navigation', label: 'Navigation', icon: NavIcon },
    { id: 'footer', label: 'Footer', icon: Layout },
  ];

  const handleSaveSiteSettings = async () => {
    setIsSaving(true);
    try {
      const promises = Object.entries(siteSettingsForm).map(([key, value]) =>
        ContentService.updateSiteSetting(key, value, currentAdmin?.id)
      );

      await Promise.all(promises);

      // Force immediate refresh to make changes visible instantly
      await refreshContent();

      setIsEditing(false);

      // Show success feedback
    } catch (error) {
      console.error('Error saving site settings:', error);
      // TODO: Add proper error handling/toast notification
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveHomePage = async () => {
    setIsSaving(true);
    try {
      // Save each section separately
      const heroData = {
        badge_text: homePageForm.hero_badge_text,
        title: homePageForm.hero_title,
        subtitle: homePageForm.hero_subtitle,
        description: homePageForm.hero_description,
        primary_cta_text: homePageForm.hero_primary_cta_text,
        primary_cta_link: homePageForm.hero_primary_cta_link,
        secondary_cta_text: homePageForm.hero_secondary_cta_text,
        secondary_cta_link: homePageForm.hero_secondary_cta_link
      };

      const tracksData = {
        title: homePageForm.tracks_title,
        description: homePageForm.tracks_description,
        items: homePageForm.tracks_items
      };

      const eventsData = {
        title: homePageForm.events_title,
        description: homePageForm.events_description,
        cta_text: homePageForm.events_cta_text,
        cta_link: homePageForm.events_cta_link
      };

      const projectsData = {
        title: homePageForm.projects_title,
        description: homePageForm.projects_description,
        cta_text: homePageForm.projects_cta_text,
        cta_link: homePageForm.projects_cta_link
      };

      const communityData = {
        title: homePageForm.community_title,
        description: homePageForm.community_description,
        cta_text: homePageForm.community_cta_text,
        cta_link: homePageForm.community_cta_link,
        feature_1: homePageForm.community_feature_1,
        feature_2: homePageForm.community_feature_2,
        feature_3: homePageForm.community_feature_3
      };

      // Save all sections
      await Promise.all([
        ContentService.updatePageContent('home', 'hero', heroData, currentAdmin?.id),
        ContentService.updatePageContent('home', 'tracks', tracksData, currentAdmin?.id),
        ContentService.updatePageContent('home', 'events', eventsData, currentAdmin?.id),
        ContentService.updatePageContent('home', 'projects', projectsData, currentAdmin?.id),
        ContentService.updatePageContent('home', 'community', communityData, currentAdmin?.id)
      ]);

      await refreshContent();
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving home page:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveContactPage = async () => {
    setIsSaving(true);
    try {
      // Prepare the contact page data with contact_links as JSON string
      const contactPageData = {
        ...contactPageForm,
        contact_links: JSON.stringify(contactPageForm.contact_links)
      };

      const result = await ContentService.updatePageContent('contact', 'main', contactPageData, currentAdmin?.id);

      await refreshContent();
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving contact page:', error);
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

      await refreshContent();
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving links:', error);
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
        const itemData: any = {
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
      await refreshContent();
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving navigation:', error);
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

      await refreshContent();
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving footer:', error);
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
        console.warn('Error parsing contact links:', error);
      }

      setContactPageForm({
        title: mainContent.title || 'Get in Touch',
        subtitle: mainContent.subtitle || 'Ready to join our community?',
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

        // Featured Projects Section
        projects_title: projectsContent.title || '',
        projects_description: projectsContent.description || '',
        projects_cta_text: projectsContent.cta_text || '',
        projects_cta_link: projectsContent.cta_link || '',

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
              className="px-4 py-2 border border-gray-700 rounded-lg hover:bg-gray-900 transition-colors font-medium text-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (activeTab === 'site-settings') handleSaveSiteSettings();
                if (activeTab === 'home-page') handleSaveHomePage();
                if (activeTab === 'contact-page') handleSaveContactPage();
                if (activeTab === 'links-urls') handleSaveLinks();
                if (activeTab === 'navigation') handleSaveNavigation();
                if (activeTab === 'footer') handleSaveFooter();
              }}
              disabled={isSaving}
              className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
            >
              <Save size={16} />
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        )
      }
    >
      {/* Tabs */}
      <div className="border-b border-gray-800 mb-8">
        <nav className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsEditing(false);
                }}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-700'
                  }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Site Settings */}
      {activeTab === 'site-settings' && (
        <div className="bg-black rounded-xl shadow-sm border border-gray-800">
          <div className="p-6 border-b border-gray-800 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Site Settings</h2>
              <p className="text-gray-400 mt-1">Configure basic site information</p>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Edit3 size={16} />
                <span>Edit</span>
              </button>
            )}
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Site Title</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={siteSettingsForm.site_title}
                    onChange={(e) => setSiteSettingsForm(prev => ({ ...prev, site_title: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white">
                    {siteSettingsForm.site_title}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Site Subtitle</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={siteSettingsForm.site_subtitle}
                    onChange={(e) => setSiteSettingsForm(prev => ({ ...prev, site_subtitle: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white">
                    {siteSettingsForm.site_subtitle}
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Site Description</label>
                {isEditing ? (
                  <textarea
                    rows={3}
                    value={siteSettingsForm.site_description}
                    onChange={(e) => setSiteSettingsForm(prev => ({ ...prev, site_description: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white">
                    {siteSettingsForm.site_description}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Contact Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={siteSettingsForm.contact_email}
                    onChange={(e) => setSiteSettingsForm(prev => ({ ...prev, contact_email: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white">
                    {siteSettingsForm.contact_email}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Meeting Time</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={siteSettingsForm.meeting_time}
                    onChange={(e) => setSiteSettingsForm(prev => ({ ...prev, meeting_time: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white">
                    {siteSettingsForm.meeting_time}
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Meeting Location</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={siteSettingsForm.meeting_location}
                    onChange={(e) => setSiteSettingsForm(prev => ({ ...prev, meeting_location: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white">
                    {siteSettingsForm.meeting_location}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Home Page */}
      {activeTab === 'home-page' && (
        <div className="bg-black rounded-xl shadow-sm border border-gray-800">
          <div className="p-6 border-b border-gray-800 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Home Page Content</h2>
              <p className="text-gray-400 mt-1">Edit all sections of the homepage</p>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Edit3 size={16} />
                <span>Edit</span>
              </button>
            )}
          </div>

          <div className="p-6 space-y-8">
            {/* Hero Section */}
            <div className="border-b border-gray-800 pb-8">
              <h3 className="text-lg font-semibold text-white mb-6">Hero Section</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Badge Text</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={homePageForm.hero_badge_text}
                      onChange={(e) => setHomePageForm(prev => ({ ...prev, hero_badge_text: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white">
                      {homePageForm.hero_badge_text}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Main Title</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={homePageForm.hero_title}
                      onChange={(e) => setHomePageForm(prev => ({ ...prev, hero_title: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white text-2xl font-bold">
                      {homePageForm.hero_title}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Subtitle</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={homePageForm.hero_subtitle}
                      onChange={(e) => setHomePageForm(prev => ({ ...prev, hero_subtitle: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white text-lg">
                      {homePageForm.hero_subtitle}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  {isEditing ? (
                    <textarea
                      rows={3}
                      value={homePageForm.hero_description}
                      onChange={(e) => setHomePageForm(prev => ({ ...prev, hero_description: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white">
                      {homePageForm.hero_description}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Primary Button Text</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={homePageForm.hero_primary_cta_text}
                        onChange={(e) => setHomePageForm(prev => ({ ...prev, hero_primary_cta_text: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white">
                        {homePageForm.hero_primary_cta_text}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Primary Button Link</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={homePageForm.hero_primary_cta_link}
                        onChange={(e) => setHomePageForm(prev => ({ ...prev, hero_primary_cta_link: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white">
                        {homePageForm.hero_primary_cta_link}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Secondary Button Text</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={homePageForm.hero_secondary_cta_text}
                        onChange={(e) => setHomePageForm(prev => ({ ...prev, hero_secondary_cta_text: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white">
                        {homePageForm.hero_secondary_cta_text}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Secondary Button Link</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={homePageForm.hero_secondary_cta_link}
                        onChange={(e) => setHomePageForm(prev => ({ ...prev, hero_secondary_cta_link: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white">
                        {homePageForm.hero_secondary_cta_link}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* What We Build Section */}
            <div className="border-b border-gray-800 pb-8">
              <h3 className="text-lg font-semibold text-white mb-6">What We Build Section</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Section Title</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={homePageForm.tracks_title}
                      onChange={(e) => setHomePageForm(prev => ({ ...prev, tracks_title: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white text-xl font-semibold">
                      {homePageForm.tracks_title}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Section Description</label>
                  {isEditing ? (
                    <textarea
                      rows={3}
                      value={homePageForm.tracks_description}
                      onChange={(e) => setHomePageForm(prev => ({ ...prev, tracks_description: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white">
                      {homePageForm.tracks_description}
                    </div>
                  )}
                </div>

                {/* Tracks Management */}
                <div className="border-t border-gray-700 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-md font-semibold text-white">Technology Tracks</h4>
                      <p className="text-sm text-gray-400">Manage the technology tracks displayed in this section</p>
                    </div>
                    {isEditing && (
                      <button
                        onClick={addTrack}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        <Plus size={16} />
                        <span>Add Track</span>
                      </button>
                    )}
                  </div>

                  {(!homePageForm.tracks_items || homePageForm.tracks_items.length === 0) ? (
                    <div className="text-center py-6 text-gray-400 border border-gray-800 rounded-lg">
                      <p>No tracks added yet.</p>
                      {isEditing && (
                        <p className="text-sm mt-2">Click "Add Track" to create your first technology track.</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {(homePageForm.tracks_items || []).map((track) => (
                        <div key={track.id} className="border border-gray-800 rounded-lg p-4 bg-gray-900">
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Track Title</label>
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={track.title}
                                    onChange={(e) => updateTrack(track.id, 'title', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                                    placeholder="e.g., Android"
                                  />
                                ) : (
                                  <div className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white font-medium">
                                    {track.title}
                                  </div>
                                )}
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Icon</label>
                                {isEditing ? (
                                  <select
                                    value={track.icon}
                                    onChange={(e) => updateTrack(track.id, 'icon', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-700 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                                  >
                                    <option value="Smartphone">📱 Smartphone (Android)</option>
                                    <option value="Cloud">☁️ Cloud</option>
                                    <option value="Brain">🧠 Brain (AI/ML)</option>
                                    <option value="Code">💻 Code</option>
                                    <option value="Users">👥 Users</option>
                                    <option value="BookOpen">📖 Book</option>
                                  </select>
                                ) : (
                                  <div className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white">
                                    {track.icon}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">Color</label>
                              {isEditing ? (
                                <select
                                  value={track.color}
                                  onChange={(e) => updateTrack(track.id, 'color', e.target.value)}
                                  className="w-full px-4 py-3 border border-gray-700 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                                >
                                  <option value="text-gdg-blue">🔵 Blue</option>
                                  <option value="text-gdg-red">🔴 Red</option>
                                  <option value="text-gdg-green">🟢 Green</option>
                                  <option value="text-gdg-yellow">🟡 Yellow</option>
                                </select>
                              ) : (
                                <div className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white">
                                  {track.color}
                                </div>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                              {isEditing ? (
                                <textarea
                                  rows={3}
                                  value={track.description}
                                  onChange={(e) => updateTrack(track.id, 'description', e.target.value)}
                                  className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                                  placeholder="Describe what this track covers..."
                                />
                              ) : (
                                <div className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white">
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
            <div className="border-b border-gray-800 pb-8">
              <h3 className="text-lg font-semibold text-white mb-6">Upcoming Events Section</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Section Title</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={homePageForm.events_title}
                      onChange={(e) => setHomePageForm(prev => ({ ...prev, events_title: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white text-xl font-semibold">
                      {homePageForm.events_title}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Section Description</label>
                  {isEditing ? (
                    <textarea
                      rows={2}
                      value={homePageForm.events_description}
                      onChange={(e) => setHomePageForm(prev => ({ ...prev, events_description: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white">
                      {homePageForm.events_description}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">CTA Button Text</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={homePageForm.events_cta_text}
                        onChange={(e) => setHomePageForm(prev => ({ ...prev, events_cta_text: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white">
                        {homePageForm.events_cta_text}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">CTA Button Link</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={homePageForm.events_cta_link}
                        onChange={(e) => setHomePageForm(prev => ({ ...prev, events_cta_link: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white">
                        {homePageForm.events_cta_link}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Featured Projects Section */}
            <div className="border-b border-gray-800 pb-8">
              <h3 className="text-lg font-semibold text-white mb-6">Featured Projects Section</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Section Title</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={homePageForm.projects_title}
                      onChange={(e) => setHomePageForm(prev => ({ ...prev, projects_title: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white text-xl font-semibold">
                      {homePageForm.projects_title}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Section Description</label>
                  {isEditing ? (
                    <textarea
                      rows={3}
                      value={homePageForm.projects_description}
                      onChange={(e) => setHomePageForm(prev => ({ ...prev, projects_description: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white">
                      {homePageForm.projects_description}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">CTA Button Text</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={homePageForm.projects_cta_text}
                        onChange={(e) => setHomePageForm(prev => ({ ...prev, projects_cta_text: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white">
                        {homePageForm.projects_cta_text}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">CTA Button Link</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={homePageForm.projects_cta_link}
                        onChange={(e) => setHomePageForm(prev => ({ ...prev, projects_cta_link: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white">
                        {homePageForm.projects_cta_link}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Join Community Section */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-6">Join Community Section</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Section Title</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={homePageForm.community_title}
                      onChange={(e) => setHomePageForm(prev => ({ ...prev, community_title: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white text-xl font-semibold">
                      {homePageForm.community_title}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Section Description</label>
                  {isEditing ? (
                    <textarea
                      rows={3}
                      value={homePageForm.community_description}
                      onChange={(e) => setHomePageForm(prev => ({ ...prev, community_description: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white">
                      {homePageForm.community_description}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Feature 1</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={homePageForm.community_feature_1}
                        onChange={(e) => setHomePageForm(prev => ({ ...prev, community_feature_1: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white">
                        {homePageForm.community_feature_1}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Feature 2</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={homePageForm.community_feature_2}
                        onChange={(e) => setHomePageForm(prev => ({ ...prev, community_feature_2: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white">
                        {homePageForm.community_feature_2}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Feature 3</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={homePageForm.community_feature_3}
                        onChange={(e) => setHomePageForm(prev => ({ ...prev, community_feature_3: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white">
                        {homePageForm.community_feature_3}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">CTA Button Text</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={homePageForm.community_cta_text}
                        onChange={(e) => setHomePageForm(prev => ({ ...prev, community_cta_text: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white">
                        {homePageForm.community_cta_text}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">CTA Button Link</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={homePageForm.community_cta_link}
                        onChange={(e) => setHomePageForm(prev => ({ ...prev, community_cta_link: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white">
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
        <div className="bg-black rounded-xl shadow-sm border border-gray-800">
          <div className="p-6 border-b border-gray-800 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Contact Page Content</h2>
              <p className="text-gray-400 mt-1">Edit the contact page content and messaging</p>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Edit3 size={16} />
                <span>Edit</span>
              </button>
            )}
          </div>

          <div className="p-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Page Title</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={contactPageForm.title}
                    onChange={(e) => setContactPageForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white text-2xl font-bold">
                    {contactPageForm.title}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Subtitle</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={contactPageForm.subtitle}
                    onChange={(e) => setContactPageForm(prev => ({ ...prev, subtitle: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white text-lg">
                    {contactPageForm.subtitle}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                {isEditing ? (
                  <textarea
                    rows={4}
                    value={contactPageForm.description}
                    onChange={(e) => setContactPageForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white">
                    {contactPageForm.description}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Contact Form Title</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={contactPageForm.form_title}
                    onChange={(e) => setContactPageForm(prev => ({ ...prev, form_title: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white">
                    {contactPageForm.form_title}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Success Message</label>
                {isEditing ? (
                  <textarea
                    rows={3}
                    value={contactPageForm.success_message}
                    onChange={(e) => setContactPageForm(prev => ({ ...prev, success_message: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white">
                    {contactPageForm.success_message}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Submit Button Text</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={contactPageForm.button_text}
                    onChange={(e) => setContactPageForm(prev => ({ ...prev, button_text: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white">
                    {contactPageForm.button_text}
                  </div>
                )}
              </div>

              <div className="border-t border-gray-800 pt-6 mt-6">
                <h3 className="text-lg font-semibold text-white mb-4">Contact Information Section</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Quick Contact Title</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={contactPageForm.quick_contact_title}
                        onChange={(e) => setContactPageForm(prev => ({ ...prev, quick_contact_title: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white">
                        {contactPageForm.quick_contact_title}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email Label</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={contactPageForm.email_label}
                        onChange={(e) => setContactPageForm(prev => ({ ...prev, email_label: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white">
                        {contactPageForm.email_label}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Discord Label</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={contactPageForm.discord_label}
                        onChange={(e) => setContactPageForm(prev => ({ ...prev, discord_label: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white">
                        {contactPageForm.discord_label}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Discord Description</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={contactPageForm.discord_description}
                        onChange={(e) => setContactPageForm(prev => ({ ...prev, discord_description: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white">
                        {contactPageForm.discord_description}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email URL</label>
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
                          className="w-full px-3 py-2 border border-gray-700 rounded-lg bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                          className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                        />
                      </div>
                    ) : (
                      <div className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white">
                        {contactPageForm.email_url || 'mailto:contact@gdgpsu.org'}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Discord URL</label>
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
                          className="w-full px-3 py-2 border border-gray-700 rounded-lg bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                          className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                        />
                      </div>
                    ) : (
                      <div className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white">
                        {contactPageForm.discord_url || 'Not set'}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Office Hours Label</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={contactPageForm.office_hours_label}
                        onChange={(e) => setContactPageForm(prev => ({ ...prev, office_hours_label: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white">
                        {contactPageForm.office_hours_label}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Office Hours Information</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={contactPageForm.office_hours_info}
                        onChange={(e) => setContactPageForm(prev => ({ ...prev, office_hours_info: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white">
                        {contactPageForm.office_hours_info}
                      </div>
                    )}
                  </div>
                </div>





                {/* Additional Links Title */}
                <div className="border-t border-gray-800 pt-6 mt-6">
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Additional Links Section Title</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={contactPageForm.additional_links_title}
                        onChange={(e) => setContactPageForm(prev => ({ ...prev, additional_links_title: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white">
                        {contactPageForm.additional_links_title}
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Page Links Section */}
                <div className="border-t border-gray-800 pt-6 mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Additional Contact Links</h3>
                      <p className="text-sm text-gray-400">Select additional links from your Links & URLs to display in the contact info section</p>
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
                          className="px-3 py-2 border border-gray-700 rounded-lg bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                    <div className="text-center py-6 text-gray-400 border border-gray-800 rounded-lg">
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
                        <div key={link.id} className="flex items-center justify-between p-4 border border-gray-800 rounded-lg bg-gray-900">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <div>
                                <h4 className="font-medium text-white">{link.name}</h4>
                                <p className="text-sm text-gray-400">{link.url}</p>
                                {link.description && (
                                  <p className="text-xs text-gray-500 mt-1">{link.description}</p>
                                )}
                              </div>
                              <span className="px-2 py-1 bg-blue-600 text-blue-100 text-xs rounded-full">
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
        <div className="bg-black rounded-xl shadow-sm border border-gray-800">
          <div className="p-6 border-b border-gray-800 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Links & URLs</h2>
              <p className="text-gray-400 mt-1">Manage all external links used throughout the site</p>
            </div>
            <div className="flex items-center space-x-3">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Edit3 size={16} />
                  <span>Edit</span>
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-gray-700 rounded-lg hover:bg-gray-900 transition-colors font-medium text-gray-300"
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
                <h3 className="text-lg font-semibold text-white">All Links</h3>
                <p className="text-sm text-gray-400">Manage all links used throughout your website</p>
              </div>
              {isEditing && (
                <button
                  onClick={addLink}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Plus size={16} />
                  <span>Add Link</span>
                </button>
              )}
            </div>

            {allLinks.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>No links added yet.</p>
                {isEditing && (
                  <p className="text-sm mt-2">Click "Add Link" to create your first link.</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {allLinks.map((link) => (
                  <div key={link.id} className="border border-gray-800 rounded-lg p-4">
                    <div className="space-y-4">
                      {/* First Row: Name, URL, Category */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Link Name</label>
                          {isEditing ? (
                            <input
                              type="text"
                              value={link.name}
                              onChange={(e) => updateLink(link.id, 'name', e.target.value)}
                              className="w-full px-3 py-2 bg-black border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white placeholder:text-gray-500 appearance-none"
                              placeholder="e.g., Discord Server"
                            />
                          ) : (
                            <div className="px-3 py-2 bg-black border border-gray-700 rounded-lg text-white">
                              {link.name || 'Unnamed Link'}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">URL</label>
                          {isEditing ? (
                            <input
                              type="url"
                              value={link.url}
                              onChange={(e) => updateLink(link.id, 'url', e.target.value)}
                              className="w-full px-3 py-2 bg-black border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white placeholder:text-gray-500 appearance-none"
                              placeholder="https://example.com"
                            />
                          ) : (
                            <div className="px-3 py-2 bg-black border border-gray-700 rounded-lg text-white break-all">
                              {link.url || 'No URL'}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                          {isEditing ? (
                            <input
                              type="text"
                              value={link.category}
                              onChange={(e) => updateLink(link.id, 'category', e.target.value)}
                              className="w-full px-3 py-2 bg-black border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white placeholder:text-gray-500 appearance-none"
                              placeholder="e.g., Social, Development, Official"
                              list={`categories-${link.id}`}
                            />
                          ) : (
                            <div className="px-3 py-2 bg-black border border-gray-700 rounded-lg text-white">
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
                          <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                          {isEditing ? (
                            <input
                              type="text"
                              value={link.description}
                              onChange={(e) => updateLink(link.id, 'description', e.target.value)}
                              className="w-full px-3 py-2 bg-black border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white placeholder:text-gray-500 appearance-none"
                              placeholder="Optional description"
                            />
                          ) : (
                            <div className="px-3 py-2 bg-black border border-gray-700 rounded-lg text-white">
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

            <div className="mt-8 p-4 bg-gray-900 rounded-lg">
              <h4 className="font-semibold text-white mb-2">📝 How it works</h4>
              <p className="text-sm text-gray-300">
                These links will automatically populate throughout your website wherever they're referenced.
                Update them here once and they'll be updated everywhere - in the footer, contact page, social media sections, etc.
              </p>
              <p className="text-sm text-gray-300 mt-2">
                <strong>Usage:</strong> Use <code className="bg-black px-1 rounded">getLink('discord')</code> or <code className="bg-black px-1 rounded">getLink('github')</code> in your components to reference links.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      {activeTab === 'navigation' && (
        <div className="bg-black rounded-xl shadow-sm border border-gray-800">
          <div className="p-6 border-b border-gray-800 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Navigation Menu</h2>
              <p className="text-gray-400 mt-1">Manage the main navigation menu items</p>
            </div>
            <div className="flex items-center space-x-3">
              {isEditing && (
                <button
                  onClick={addNavigationItem}
                  className="flex items-center space-x-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-gray-900 transition-colors font-medium"
                >
                  <Plus size={16} />
                  <span>Add Item</span>
                </button>
              )}
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Edit3 size={16} />
                  <span>Edit</span>
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
                      : 'border-gray-800'
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
                    <div className="cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-300 transition-colors">
                      <GripVertical size={20} />
                    </div>
                  )}

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Label</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={item.label}
                          onChange={(e) => {
                            const newNav = [...navigationForm];
                            newNav[index].label = e.target.value;
                            setNavigationForm(newNav);
                          }}
                          className="w-full px-3 py-2 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                          placeholder="Menu item label"
                        />
                      ) : (
                        <div className="px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white">
                          {item.label || 'Untitled'}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Link</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={item.href}
                          onChange={(e) => {
                            const newNav = [...navigationForm];
                            newNav[index].href = e.target.value;
                            setNavigationForm(newNav);
                          }}
                          className="w-full px-3 py-2 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                          placeholder="/page-url or https://external.com"
                        />
                      ) : (
                        <div className="px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white flex items-center">
                          {item.href || 'No link'}
                          {item.href && item.href.startsWith('http') && <ExternalLink size={14} className="ml-2 text-gray-400" />}
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
                <div className="text-center py-8 text-gray-500">
                  No navigation items yet. {isEditing && 'Click "Add Item" to get started.'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      {activeTab === 'footer' && (
        <div className="bg-black rounded-xl shadow-sm border border-gray-800">
          <div className="p-6 border-b border-gray-800 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Footer Content</h2>
              <p className="text-gray-400 mt-1">Manage footer text and social media links</p>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Edit3 size={16} />
                <span>Edit</span>
              </button>
            )}
          </div>

          <div className="p-6 space-y-8">
            {/* Footer Text */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Footer Text</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  {isEditing ? (
                    <textarea
                      rows={3}
                      value={footerForm.description}
                      onChange={(e) => setFooterForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white">
                      {footerForm.description}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Copyright Text</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={footerForm.copyright}
                      onChange={(e) => setFooterForm(prev => ({ ...prev, copyright: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white">
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
                  <h3 className="text-lg font-semibold text-white">Social Media Links</h3>
                  <p className="text-sm text-gray-400 mt-1">Links are managed in the "Links & URLs" tab above</p>
                </div>
                <button
                  onClick={() => setActiveTab('links-urls')}
                  className="flex items-center space-x-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-gray-900 transition-colors font-medium"
                >
                  <ExternalLink size={16} />
                  <span>Manage Links</span>
                </button>
              </div>

              {/* Display links from the main Links & URLs panel */}
              <div className="space-y-4">
                {allLinks.filter(link => link.category === 'Social').length > 0 ? (
                  allLinks.filter(link => link.category === 'Social').map((link) => (
                    <div key={link.id} className="p-4 border border-gray-800 rounded-lg bg-gray-900">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">Link Name</label>
                          <div className="text-white font-medium">{link.name}</div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">URL</label>
                          <div className="text-white break-all">{link.url}</div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                          <div className="text-white">{link.description || 'No description'}</div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 border border-gray-800 rounded-lg bg-gray-900">
                    <div className="text-gray-400 mb-2">No social media links found</div>
                    <p className="text-sm text-gray-500 mb-4">
                      Add links with category "Social" in the Links & URLs tab to display them here.
                    </p>
                    <button
                      onClick={() => setActiveTab('links-urls')}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
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
                      <h4 className="text-md font-semibold text-white mb-3">{category} Links</h4>
                      <div className="space-y-3">
                        {categoryLinks.map((link) => (
                          <div key={link.id} className="p-3 border border-gray-800 rounded-lg bg-gray-900">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-white font-medium">{link.name}</div>
                                <div className="text-sm text-gray-400">{link.url}</div>
                              </div>
                              <div className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
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
                <h3 className="text-lg font-semibold text-white">Quick Links</h3>
                {isEditing && (
                  <button
                    onClick={() => setFooterForm(prev => ({
                      ...prev,
                      quickLinks: [...prev.quickLinks, { name: '', href: '' }]
                    }))}
                    className="flex items-center space-x-2 px-3 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-gray-900 transition-colors text-sm"
                  >
                    <Plus size={14} />
                    <span>Add Link</span>
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {footerForm.quickLinks.map((link, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-gray-800 rounded-lg bg-gray-900">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Link Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={link.name}
                          onChange={(e) => {
                            const newLinks = [...footerForm.quickLinks];
                            newLinks[index].name = e.target.value;
                            setFooterForm(prev => ({ ...prev, quickLinks: newLinks }));
                          }}
                          className="w-full px-3 py-2 bg-black border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white placeholder:text-gray-500"
                          placeholder="e.g., Events"
                        />
                      ) : (
                        <div className="px-3 py-2 bg-black border border-gray-700 rounded-lg text-white">
                          {link.name}
                        </div>
                      )}
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-400 mb-2">URL</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={link.href}
                            onChange={(e) => {
                              const newLinks = [...footerForm.quickLinks];
                              newLinks[index].href = e.target.value;
                              setFooterForm(prev => ({ ...prev, quickLinks: newLinks }));
                            }}
                            className="w-full px-3 py-2 bg-black border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white placeholder:text-gray-500"
                            placeholder="/events"
                          />
                        ) : (
                          <div className="px-3 py-2 bg-black border border-gray-700 rounded-lg text-white">
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
                <h3 className="text-lg font-semibold text-white">Resources</h3>
                {isEditing && (
                  <button
                    onClick={() => setFooterForm(prev => ({
                      ...prev,
                      resources: [...prev.resources, { name: '', href: '' }]
                    }))}
                    className="flex items-center space-x-2 px-3 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-gray-900 transition-colors text-sm"
                  >
                    <Plus size={14} />
                    <span>Add Resource</span>
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {footerForm.resources.map((resource, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-gray-800 rounded-lg bg-gray-900">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Resource Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={resource.name}
                          onChange={(e) => {
                            const newResources = [...footerForm.resources];
                            newResources[index].name = e.target.value;
                            setFooterForm(prev => ({ ...prev, resources: newResources }));
                          }}
                          className="w-full px-3 py-2 bg-black border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white placeholder:text-gray-500"
                          placeholder="e.g., Study Jams"
                        />
                      ) : (
                        <div className="px-3 py-2 bg-black border border-gray-700 rounded-lg text-white">
                          {resource.name}
                        </div>
                      )}
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-400 mb-2">URL</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={resource.href}
                            onChange={(e) => {
                              const newResources = [...footerForm.resources];
                              newResources[index].href = e.target.value;
                              setFooterForm(prev => ({ ...prev, resources: newResources }));
                            }}
                            className="w-full px-3 py-2 bg-black border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white placeholder:text-gray-500"
                            placeholder="/resources"
                          />
                        ) : (
                          <div className="px-3 py-2 bg-black border border-gray-700 rounded-lg text-white">
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
              <h3 className="text-lg font-semibold text-white mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={footerForm.contactInfo.email}
                      onChange={(e) => setFooterForm(prev => ({
                        ...prev,
                        contactInfo: { ...prev.contactInfo, email: e.target.value }
                      }))}
                      className="w-full px-3 py-2 bg-black border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white placeholder:text-gray-500"
                      placeholder="contact@gdgpsu.org"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-black border border-gray-700 rounded-lg text-white">
                      {footerForm.contactInfo.email}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Phone (Optional)</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={footerForm.contactInfo.phone}
                      onChange={(e) => setFooterForm(prev => ({
                        ...prev,
                        contactInfo: { ...prev.contactInfo, phone: e.target.value }
                      }))}
                      className="w-full px-3 py-2 bg-black border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white placeholder:text-gray-500"
                      placeholder="(555) 123-4567"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-black border border-gray-700 rounded-lg text-white">
                      {footerForm.contactInfo.phone || 'Not provided'}
                    </div>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-2">Address</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={footerForm.contactInfo.address}
                      onChange={(e) => setFooterForm(prev => ({
                        ...prev,
                        contactInfo: { ...prev.contactInfo, address: e.target.value }
                      }))}
                      className="w-full px-3 py-2 bg-black border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white placeholder:text-gray-500"
                      placeholder="Penn State University, University Park, PA"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-black border border-gray-700 rounded-lg text-white">
                      {footerForm.contactInfo.address}
                    </div>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-2">Office Hours</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={footerForm.contactInfo.officeHours}
                      onChange={(e) => setFooterForm(prev => ({
                        ...prev,
                        contactInfo: { ...prev.contactInfo, officeHours: e.target.value }
                      }))}
                      className="w-full px-3 py-2 bg-black border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white placeholder:text-gray-500"
                      placeholder="Wednesdays 4-6 PM, IST Building"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-black border border-gray-700 rounded-lg text-white">
                      {footerForm.contactInfo.officeHours}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Newsletter Settings */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Newsletter Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Newsletter Title</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={footerForm.newsletter.title}
                      onChange={(e) => setFooterForm(prev => ({
                        ...prev,
                        newsletter: { ...prev.newsletter, title: e.target.value }
                      }))}
                      className="w-full px-3 py-2 bg-black border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white placeholder:text-gray-500"
                      placeholder="Stay Updated"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-black border border-gray-700 rounded-lg text-white">
                      {footerForm.newsletter.title}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Newsletter Description</label>
                  {isEditing ? (
                    <textarea
                      rows={3}
                      value={footerForm.newsletter.description}
                      onChange={(e) => setFooterForm(prev => ({
                        ...prev,
                        newsletter: { ...prev.newsletter, description: e.target.value }
                      }))}
                      className="w-full px-3 py-2 bg-black border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white placeholder:text-gray-500"
                      placeholder="Get the latest updates on events, workshops, and opportunities."
                    />
                  ) : (
                    <div className="px-3 py-2 bg-black border border-gray-700 rounded-lg text-white">
                      {footerForm.newsletter.description}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Input Placeholder</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={footerForm.newsletter.placeholder}
                        onChange={(e) => setFooterForm(prev => ({
                          ...prev,
                          newsletter: { ...prev.newsletter, placeholder: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-black border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white placeholder:text-gray-500"
                        placeholder="Enter your email"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-black border border-gray-700 rounded-lg text-white">
                        {footerForm.newsletter.placeholder}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Button Text</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={footerForm.newsletter.buttonText}
                        onChange={(e) => setFooterForm(prev => ({
                          ...prev,
                          newsletter: { ...prev.newsletter, buttonText: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-black border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white placeholder:text-gray-500"
                        placeholder="Subscribe"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-black border border-gray-700 rounded-lg text-white">
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