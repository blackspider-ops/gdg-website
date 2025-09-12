import { useState } from 'react';
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
  ExternalLink
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
    socialLinks,
    footerContent,
    refreshContent
  } = useContent();

  const [activeTab, setActiveTab] = useState('site-settings');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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

  const [homeHeroForm, setHomeHeroForm] = useState(() => {
    const heroContent = pageContent.home?.hero || {};
    return {
      title: heroContent.title || 'Google Developer Group',
      subtitle: heroContent.subtitle || 'at Penn State University',
      description: heroContent.description || 'Join our community of passionate developers, designers, and tech enthusiasts.',
      cta_text: heroContent.cta_text || 'Join Chapter',
      cta_link: heroContent.cta_link || '/contact'
    };
  });

  const [contactPageForm, setContactPageForm] = useState(() => {
    const contactContent = pageContent.contact || {};
    return {
      title: contactContent.title || 'Get in Touch',
      subtitle: contactContent.subtitle || 'Ready to join our community?',
      description: contactContent.description || 'We\'d love to hear from you! Whether you\'re interested in joining our chapter, have questions about upcoming events, or want to collaborate with us.',
      form_title: contactContent.form_title || 'Send us a message',
      success_message: contactContent.success_message || 'Thank you for your message! We\'ll get back to you soon.'
    };
  });

  const [navigationForm, setNavigationForm] = useState(() => {
    return navigationItems.map(item => ({
      id: item.id || Math.random().toString(36).substr(2, 9),
      label: item.label || '',
      href: item.href || '',
      order_index: item.order_index || 0
    }));
  });

  const [footerForm, setFooterForm] = useState(() => {
    return {
      description: footerContent.description || 'A student-led community passionate about Google technologies at Penn State University.',
      copyright: footerContent.copyright || '© 2024 GDG@PSU. All rights reserved.',
      social_links: socialLinks.map(link => ({
        id: link.id || Math.random().toString(36).substr(2, 9),
        platform: link.platform || '',
        url: link.url || '',
        icon: link.icon || ''
      }))
    };
  });

  const tabs = [
    { id: 'site-settings', label: 'Site Settings', icon: Settings },
    { id: 'home-page', label: 'Home Page', icon: Home },
    { id: 'contact-page', label: 'Contact Page', icon: Mail },
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
      await refreshContent();
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving site settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveHomeHero = async () => {
    setIsSaving(true);
    try {
      await ContentService.updatePageContent('home', 'hero', homeHeroForm, currentAdmin?.id);
      await refreshContent();
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving home hero:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveContactPage = async () => {
    setIsSaving(true);
    try {
      await ContentService.updatePageContent('contact', 'main', contactPageForm, currentAdmin?.id);
      await refreshContent();
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving contact page:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNavigation = async () => {
    setIsSaving(true);
    try {
      // Delete existing navigation items and create new ones
      const promises = navigationForm.map((item, index) =>
        ContentService.updateNavigationItem({
          id: item.id,
          label: item.label,
          href: item.href,
          order_index: index,
          is_active: true
        }, currentAdmin?.id)
      );

      await Promise.all(promises);
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
      // Update footer content sections
      await ContentService.updateFooterContent('description', footerForm.description, currentAdmin?.id);
      await ContentService.updateFooterContent('copyright', footerForm.copyright, currentAdmin?.id);

      // Update social links
      const socialPromises = footerForm.social_links.map((link, index) =>
        ContentService.updateSocialLink({
          id: link.id,
          platform: link.platform,
          url: link.url,
          icon: link.icon,
          is_active: true,
          order_index: index
        }, currentAdmin?.id)
      );

      await Promise.all(socialPromises);
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
      id: Math.random().toString(36).substr(2, 9),
      label: '',
      href: '',
      order_index: prev.length
    }]);
  };

  const removeNavigationItem = (index: number) => {
    setNavigationForm(prev => prev.filter((_, i) => i !== index));
  };

  const addSocialLink = () => {
    setFooterForm(prev => ({
      ...prev,
      social_links: [...prev.social_links, {
        id: Math.random().toString(36).substr(2, 9),
        platform: '',
        url: '',
        icon: ''
      }]
    }));
  };

  const removeSocialLink = (index: number) => {
    setFooterForm(prev => ({
      ...prev,
      social_links: prev.social_links.filter((_, i) => i !== index)
    }));
  };

  return (
    <AdminLayout
      title="Content Management"
      subtitle="Manage website content with easy-to-use forms"
      icon={FileText}
      actions={
        isEditing && (
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors font-medium text-foreground"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (activeTab === 'site-settings') handleSaveSiteSettings();
                if (activeTab === 'home-page') handleSaveHomeHero();
                if (activeTab === 'contact-page') handleSaveContactPage();
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
      <div className="border-b border-gray-200 mb-8">
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
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Site Settings</h2>
              <p className="text-gray-600 mt-1">Configure basic site information</p>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Site Title</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={siteSettingsForm.site_title}
                    onChange={(e) => setSiteSettingsForm(prev => ({ ...prev, site_title: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                    {siteSettingsForm.site_title}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Site Subtitle</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={siteSettingsForm.site_subtitle}
                    onChange={(e) => setSiteSettingsForm(prev => ({ ...prev, site_subtitle: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                    {siteSettingsForm.site_subtitle}
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Site Description</label>
                {isEditing ? (
                  <textarea
                    rows={3}
                    value={siteSettingsForm.site_description}
                    onChange={(e) => setSiteSettingsForm(prev => ({ ...prev, site_description: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                    {siteSettingsForm.site_description}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={siteSettingsForm.contact_email}
                    onChange={(e) => setSiteSettingsForm(prev => ({ ...prev, contact_email: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                    {siteSettingsForm.contact_email}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Time</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={siteSettingsForm.meeting_time}
                    onChange={(e) => setSiteSettingsForm(prev => ({ ...prev, meeting_time: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                    {siteSettingsForm.meeting_time}
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Location</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={siteSettingsForm.meeting_location}
                    onChange={(e) => setSiteSettingsForm(prev => ({ ...prev, meeting_location: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Home Page Hero Section</h2>
              <p className="text-gray-600 mt-1">Edit the main hero section on the homepage</p>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Main Title</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={homeHeroForm.title}
                    onChange={(e) => setHomeHeroForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-2xl font-bold">
                    {homeHeroForm.title}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={homeHeroForm.subtitle}
                    onChange={(e) => setHomeHeroForm(prev => ({ ...prev, subtitle: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-lg">
                    {homeHeroForm.subtitle}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                {isEditing ? (
                  <textarea
                    rows={4}
                    value={homeHeroForm.description}
                    onChange={(e) => setHomeHeroForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                    {homeHeroForm.description}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Button Text</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={homeHeroForm.cta_text}
                      onChange={(e) => setHomeHeroForm(prev => ({ ...prev, cta_text: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                      {homeHeroForm.cta_text}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Button Link</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={homeHeroForm.cta_link}
                      onChange={(e) => setHomeHeroForm(prev => ({ ...prev, cta_link: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                      {homeHeroForm.cta_link}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contact Page */}
      {activeTab === 'contact-page' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Contact Page Content</h2>
              <p className="text-gray-600 mt-1">Edit the contact page content and messaging</p>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Page Title</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={contactPageForm.title}
                    onChange={(e) => setContactPageForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-2xl font-bold">
                    {contactPageForm.title}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={contactPageForm.subtitle}
                    onChange={(e) => setContactPageForm(prev => ({ ...prev, subtitle: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-lg">
                    {contactPageForm.subtitle}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                {isEditing ? (
                  <textarea
                    rows={4}
                    value={contactPageForm.description}
                    onChange={(e) => setContactPageForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                    {contactPageForm.description}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Form Title</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={contactPageForm.form_title}
                    onChange={(e) => setContactPageForm(prev => ({ ...prev, form_title: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                    {contactPageForm.form_title}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Success Message</label>
                {isEditing ? (
                  <textarea
                    rows={3}
                    value={contactPageForm.success_message}
                    onChange={(e) => setContactPageForm(prev => ({ ...prev, success_message: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                    {contactPageForm.success_message}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      {activeTab === 'navigation' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Navigation Menu</h2>
              <p className="text-gray-600 mt-1">Manage the main navigation menu items</p>
            </div>
            <div className="flex items-center space-x-3">
              {isEditing && (
                <button
                  onClick={addNavigationItem}
                  className="flex items-center space-x-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
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
                <div key={item.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={item.label}
                          onChange={(e) => {
                            const newNav = [...navigationForm];
                            newNav[index].label = e.target.value;
                            setNavigationForm(newNav);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Menu item label"
                        />
                      ) : (
                        <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                          {item.label || 'Untitled'}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Link</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={item.href}
                          onChange={(e) => {
                            const newNav = [...navigationForm];
                            newNav[index].href = e.target.value;
                            setNavigationForm(newNav);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="/page-url or https://external.com"
                        />
                      ) : (
                        <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 flex items-center">
                          {item.href || 'No link'}
                          {item.href && item.href.startsWith('http') && <ExternalLink size={14} className="ml-2 text-gray-400" />}
                        </div>
                      )}
                    </div>
                  </div>
                  {isEditing && (
                    <button
                      onClick={() => removeNavigationItem(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Footer Content</h2>
              <p className="text-gray-600 mt-1">Manage footer text and social media links</p>
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Footer Text</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  {isEditing ? (
                    <textarea
                      rows={3}
                      value={footerForm.description}
                      onChange={(e) => setFooterForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                      {footerForm.description}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Copyright Text</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={footerForm.copyright}
                      onChange={(e) => setFooterForm(prev => ({ ...prev, copyright: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                      {footerForm.copyright}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Social Media Links</h3>
                {isEditing && (
                  <button
                    onClick={addSocialLink}
                    className="flex items-center space-x-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                  >
                    <Plus size={16} />
                    <span>Add Link</span>
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {footerForm.social_links.map((link, index) => (
                  <div key={link.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={link.platform}
                            onChange={(e) => {
                              const newFooter = { ...footerForm };
                              newFooter.social_links[index].platform = e.target.value;
                              setFooterForm(newFooter);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Twitter, LinkedIn, etc."
                          />
                        ) : (
                          <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                            {link.platform || 'Untitled'}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                        {isEditing ? (
                          <input
                            type="url"
                            value={link.url}
                            onChange={(e) => {
                              const newFooter = { ...footerForm };
                              newFooter.social_links[index].url = e.target.value;
                              setFooterForm(newFooter);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="https://twitter.com/username"
                          />
                        ) : (
                          <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                            {link.url || 'No URL'}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={link.icon}
                            onChange={(e) => {
                              const newFooter = { ...footerForm };
                              newFooter.social_links[index].icon = e.target.value;
                              setFooterForm(newFooter);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="twitter, linkedin, github"
                          />
                        ) : (
                          <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                            {link.icon || 'No icon'}
                          </div>
                        )}
                      </div>
                    </div>
                    {isEditing && (
                      <button
                        onClick={() => removeSocialLink(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}

                {footerForm.social_links.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No social links yet. {isEditing && 'Click "Add Link" to get started.'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminContent;