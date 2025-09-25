import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Github, Twitter, Instagram, Mail, MessageCircle, Linkedin, Facebook, Youtube } from 'lucide-react';
import AdminLoginModal from '@/components/AdminLoginModal';
import { useAdmin } from '@/contexts/AdminContext';
import { useContent } from '@/contexts/ContentContext';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { ContentService } from '@/services/contentService';
import { NewsletterService } from '@/services/newsletterService';

const Footer = () => {
  const [email, setEmail] = React.useState('');
  const [showAdminModal, setShowAdminModal] = React.useState(false);
  const [adminSecretCode, setAdminSecretCode] = React.useState('');
  const [isSubscribing, setIsSubscribing] = React.useState(false);
  const [subscriptionMessage, setSubscriptionMessage] = React.useState('');
  const { login, isLoading, error } = useAdmin();
  
  // Lock body scroll when modal is open
  useBodyScrollLock(showAdminModal);
  const navigate = useNavigate();
  const { getFooterSection, getSiteSetting, getAllLinks } = useContent();

  // Load admin secret code on component mount
  React.useEffect(() => {
    const loadSecretCode = async () => {
      try {
        const code = await ContentService.getAdminSecretCode();
        setAdminSecretCode(code);
      } catch (error) {
    // Silently handle errors
  }
    };
    loadSecretCode();
  }, []);

  // Icon mapping for social links
  const iconMap: Record<string, any> = {
    Github,
    Twitter,
    Instagram,
    Mail,
    MessageCircle,
    Linkedin,
    Facebook,
    Youtube
  };

  // Get dynamic content - using the correct keys that match the admin panel
  const footerDescription = getFooterSection('description');
  const footerCopyright = getFooterSection('copyright');
  const quickLinksContent = getFooterSection('quick_links') || {};
  const resourcesContent = getFooterSection('resources') || {};
  // Parse contact info with fallbacks
  const contactContent = React.useMemo(() => {
    try {
      const contactData = getFooterSection('contact_info');
      if (typeof contactData === 'string') {
        return JSON.parse(contactData);
      }
      return contactData || {};
    } catch (error) {
      return {};
    }
  }, [getFooterSection]);
  // Parse newsletter content with fallbacks
  const newsletterContent = React.useMemo(() => {
    try {
      const newsletterData = getFooterSection('newsletter');
      if (typeof newsletterData === 'string') {
        return JSON.parse(newsletterData);
      }
      return newsletterData || {};
    } catch (error) {
      return {};
    }
  }, [getFooterSection]);

  // Get social links from centralized system
  const dynamicSocialLinks = React.useMemo(() => {
    try {
      const centralizedLinks = getAllLinks('Social') || [];
      
      return centralizedLinks.map((link, index) => {
        const platformName = (link.name || '').toLowerCase();
        let icon = Mail;
        
        if (platformName.includes('discord')) icon = MessageCircle;
        else if (platformName.includes('github')) icon = Github;
        else if (platformName.includes('twitter') || platformName.includes('x')) icon = Twitter;
        else if (platformName.includes('linkedin')) icon = Linkedin;
        else if (platformName.includes('instagram')) icon = Instagram;
        else if (platformName.includes('facebook')) icon = Facebook;
        else if (platformName.includes('youtube')) icon = Youtube;
        else if (platformName.includes('email') || platformName.includes('mail')) icon = Mail;
        
        return {
          id: link.id || `social-${index}`,
          name: link.name,
          href: link.url,
          icon: icon
        };
      });
    } catch (error) {
      return [];
    }
  }, [getAllLinks]);



  // Parse dynamic content from admin panel with fallbacks
  const quickLinksData = React.useMemo(() => {
    try {
      if (quickLinksContent.links) {
        return quickLinksContent.links;
      }
      // Try to parse if it's a JSON string
      if (typeof quickLinksContent === 'string') {
        const parsed = JSON.parse(quickLinksContent);
        return parsed.links || [];
      }
      return [];
    } catch (error) {
      return [];
    }
  }, [quickLinksContent]);

  const resourcesData = React.useMemo(() => {
    try {
      if (resourcesContent.links) {
        return resourcesContent.links;
      }
      // Try to parse if it's a JSON string
      if (typeof resourcesContent === 'string') {
        const parsed = JSON.parse(resourcesContent);
        return parsed.links || [];
      }
      return [];
    } catch (error) {
      return [];
    }
  }, [resourcesContent]);

  // Use only dynamic content from admin panel
  const quickLinks = quickLinksData;
  const resources = resourcesData;

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for admin secret code
    if (email === adminSecretCode) {
      setShowAdminModal(true);
      return;
    }
    
    setIsSubscribing(true);
    setSubscriptionMessage('');
    
    try {
      await NewsletterService.subscribe(email);
      setSubscriptionMessage('✅ Please check your email to confirm your subscription!');
      setEmail('');
    } catch (error: any) {
      setSubscriptionMessage(`❌ ${error.message || 'Subscription failed. Please try again.'}`);
    } finally {
      setIsSubscribing(false);
      
      // Clear message after 5 seconds
      setTimeout(() => {
        setSubscriptionMessage('');
      }, 5000);
    }
  };

  const handleAdminLogin = async (credentials: { username: string; password: string }) => {
    const success = await login(credentials);
    if (success) {
      setShowAdminModal(false);
      setEmail('');
      navigate('/admin');
    }
  };

  return (
    <footer className="bg-card/30 border-t border-border">
      <div className="editorial-grid py-20 max-w-7xl mx-auto">
        {/* Main Footer Content */}
        <div className="col-span-12 md:col-span-6 lg:col-span-4">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold text-xl">G</span>
            </div>
            <div className="flex flex-col">
              <span className="font-display font-semibold text-2xl leading-none">
                {getSiteSetting('site_title')}
              </span>
              <span className="text-muted-foreground text-sm">
                {getSiteSetting('site_subtitle')}
              </span>
            </div>
          </div>
          
          {footerDescription && (
            <p className="text-muted-foreground content-measure mb-8 leading-relaxed">
              {footerDescription}
            </p>
          )}

          <div className="flex space-x-3">
            {dynamicSocialLinks.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.id}
                  href={social.href}
                  className="magnetic-button p-3 hover:bg-primary/10 rounded-lg transition-colors group focus-ring"
                  title={social.name}
                >
                  <Icon size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
                </a>
              );
            })}
          </div>
        </div>

        {/* Quick Links */}
        {quickLinks.length > 0 && (
          <div className="col-span-6 md:col-span-3 lg:col-span-2">
            <h4 className="font-display font-semibold text-lg mb-6">
              Quick Links
            </h4>
          <ul className="space-y-4">
            {quickLinks.map((link, index) => (
              <li key={`quicklink-${index}-${link.name}`}>
                <Link 
                  to={link.href}
                  className="text-muted-foreground hover:text-primary transition-colors underline-slide focus-ring"
                >
                  {link.name}
                </Link>
              </li>
            ))}

          </ul>
          </div>
        )}

        {/* Resources */}
        {resources.length > 0 && (
          <div className="col-span-6 md:col-span-3 lg:col-span-2">
            <h4 className="font-display font-semibold text-lg mb-6">
              Resources
            </h4>
          <ul className="space-y-4">
            {resources.map((link, index) => (
              <li key={`resource-${index}-${link.name}`}>
                <Link 
                  to={link.href}
                  className="text-muted-foreground hover:text-primary transition-colors underline-slide focus-ring"
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
          </div>
        )}

        {/* Connect */}
        {(contactContent.email || contactContent.phone || contactContent.address || contactContent.officeHours) && (
          <div className="col-span-12 md:col-span-6 lg:col-span-4">
            <h4 className="font-display font-semibold text-lg mb-6">
              Connect With Us
            </h4>
          <div className="space-y-4">
            {contactContent.email && (
              <div>
                <p className="text-sm font-medium text-foreground mb-1">Email</p>
                <a 
                  href={`mailto:${contactContent.email}`} 
                  className="text-muted-foreground hover:text-primary transition-colors text-sm"
                >
                  {contactContent.email}
                </a>
              </div>
            )}
            {contactContent.phone && (
              <div>
                <p className="text-sm font-medium text-foreground mb-1">Phone</p>
                <a 
                  href={`tel:${contactContent.phone}`} 
                  className="text-muted-foreground hover:text-primary transition-colors text-sm"
                >
                  {contactContent.phone}
                </a>
              </div>
            )}
            {contactContent.address && (
              <div>
                <p className="text-sm font-medium text-foreground mb-1">Location</p>
                <p className="text-muted-foreground text-sm whitespace-pre-line">
                  {contactContent.address}
                </p>
              </div>
            )}
            {contactContent.officeHours && (
              <div>
                <p className="text-sm font-medium text-foreground mb-1">Office Hours</p>
                <p className="text-muted-foreground text-sm whitespace-pre-line">
                  {contactContent.officeHours}
                </p>
              </div>
            )}
          </div>
          </div>
        )}

        {/* Newsletter - Full Width Bottom */}
        {newsletterContent.title && (
          <div className="col-span-12 mt-12 pt-8 border-t border-border">
            <div className="max-w-2xl mx-auto text-center">
              <h4 className="font-display font-semibold text-xl mb-4">
                {newsletterContent.title}
              </h4>
              {newsletterContent.description && (
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {newsletterContent.description}
                </p>
              )}
              <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder={newsletterContent.placeholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubscribing}
                  className="flex-1 px-4 py-3 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/35 focus:border-primary transition-colors disabled:opacity-50"
                />
                <button 
                  type="submit"
                  disabled={isSubscribing}
                  className="px-6 py-3 bg-primary text-black rounded-lg font-medium hover:bg-primary/90 transition-colors focus-ring whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubscribing ? 'Subscribing...' : (newsletterContent.buttonText || 'Subscribe')}
                </button>
              </form>
              
              {subscriptionMessage && (
                <div className="mt-4 text-center">
                  <p className="text-sm font-medium">
                    {subscriptionMessage}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Footer */}
      {footerCopyright && (
        <div className="border-t border-border">
          <div className="editorial-grid py-8">
            <div className="col-span-12 md:col-span-8 lg:col-span-8">
              <p className="text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Brand Usage:</strong> GDG on Campus is a program of Google Developer Groups. 
                This chapter is student-led and not sponsored by Google.
              </p>
              <p className="text-muted-foreground mt-2">
                Proudly representing Penn State University students in technology and development.
              </p>
            </div>
          
            <div className="col-span-12 md:col-span-4 lg:col-span-4 flex items-center justify-start md:justify-end mt-4 md:mt-0">
              <p className="text-muted-foreground">
                {footerCopyright}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        onLogin={handleAdminLogin}
        isLoading={isLoading}
        error={error}
      />
    </footer>
  );
};

export default Footer;