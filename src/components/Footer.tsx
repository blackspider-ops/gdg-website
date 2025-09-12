import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Github, Twitter, Instagram, Mail } from 'lucide-react';
import AdminLoginModal from '@/components/AdminLoginModal';
import { useAdmin } from '@/contexts/AdminContext';
import { useContent } from '@/contexts/ContentContext';
import { ContentService } from '@/services/contentService';

const Footer = () => {
  const [email, setEmail] = React.useState('');
  const [showAdminModal, setShowAdminModal] = React.useState(false);
  const [adminSecretCode, setAdminSecretCode] = React.useState('gdg-secret@mail.com');
  const { login, isLoading, error } = useAdmin();
  const navigate = useNavigate();
  const { socialLinks, getFooterSection, getSiteSetting } = useContent();

  // Load admin secret code on component mount
  React.useEffect(() => {
    const loadSecretCode = async () => {
      try {
        const code = await ContentService.getAdminSecretCode();
        setAdminSecretCode(code);
      } catch (error) {
        console.error('Error loading admin secret code:', error);
      }
    };
    loadSecretCode();
  }, []);

  // Icon mapping for social links
  const iconMap: Record<string, any> = {
    Github,
    Twitter,
    Instagram,
    Mail
  };

  // Get dynamic content
  const aboutContent = getFooterSection('about') || {};
  const quickLinksContent = getFooterSection('quick_links') || {};
  const resourcesContent = getFooterSection('resources') || {};
  const contactContent = getFooterSection('contact_info') || {};
  const newsletterContent = getFooterSection('newsletter') || {};

  const quickLinks = quickLinksContent.links || [
    { name: 'Events', href: '/events' },
    { name: 'Blog', href: '/blog' },
    { name: 'Projects', href: '/projects' },
    { name: 'Team', href: '/team' },
  ];

  const resources = resourcesContent.links || [
    { name: 'Study Jams', href: '/resources' },
    { name: 'Cloud Credits', href: '/resources' },
    { name: 'Documentation', href: '/resources' },
    { name: 'Recordings', href: '/resources' },
  ];

  // Use dynamic social links
  const dynamicSocialLinks = socialLinks.map(link => ({
    name: link.platform,
    href: link.url,
    icon: iconMap[link.icon] || Mail
  }));

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for admin secret code
    if (email === adminSecretCode) {
      setShowAdminModal(true);
      return;
    }
    
    // TODO: Implement newsletter subscription when backend is connected
    console.log('Newsletter subscription:', email);
    setEmail('');
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
                {aboutContent.title || 'GDG@PSU'}
              </span>
              <span className="text-muted-foreground text-sm">
                {aboutContent.subtitle || 'Penn State University'}
              </span>
            </div>
          </div>
          
          <p className="text-muted-foreground content-measure mb-8 leading-relaxed">
            {aboutContent.description || 'A student-led community passionate about Google technologies, development, and building the future together at Penn State University.'}
          </p>

          <div className="flex space-x-3">
            {dynamicSocialLinks.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.name}
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
        <div className="col-span-6 md:col-span-3 lg:col-span-2">
          <h4 className="font-display font-semibold text-lg mb-6">
            {quickLinksContent.title || 'Quick Links'}
          </h4>
          <ul className="space-y-4">
            {quickLinks.map((link) => (
              <li key={link.name}>
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

        {/* Resources */}
        <div className="col-span-6 md:col-span-3 lg:col-span-2">
          <h4 className="font-display font-semibold text-lg mb-6">
            {resourcesContent.title || 'Resources'}
          </h4>
          <ul className="space-y-4">
            {resources.map((link) => (
              <li key={link.name}>
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

        {/* Connect */}
        <div className="col-span-12 md:col-span-6 lg:col-span-4">
          <h4 className="font-display font-semibold text-lg mb-6">
            {contactContent.title || 'Connect With Us'}
          </h4>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Email</p>
              <a 
                href={`mailto:${contactContent.email || getSiteSetting('contact_email') || 'contact@gdgpsu.org'}`} 
                className="text-muted-foreground hover:text-primary transition-colors text-sm"
              >
                {contactContent.email || getSiteSetting('contact_email') || 'contact@gdgpsu.org'}
              </a>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Location</p>
              <p className="text-muted-foreground text-sm whitespace-pre-line">
                {contactContent.location || 'Penn State University\nUniversity Park, PA'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Meeting Times</p>
              <p className="text-muted-foreground text-sm whitespace-pre-line">
                {contactContent.meeting_times || `${getSiteSetting('meeting_time') || 'Thursdays at 7:00 PM'}\n${getSiteSetting('meeting_location') || 'Thomas Building 100'}`}
              </p>
            </div>
          </div>
        </div>

        {/* Newsletter - Full Width Bottom */}
        <div className="col-span-12 mt-12 pt-8 border-t border-border">
          <div className="max-w-2xl mx-auto text-center">
            <h4 className="font-display font-semibold text-xl mb-4">
              {newsletterContent.title || 'Stay Updated'}
            </h4>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              {newsletterContent.description || 'Get the latest updates on events, workshops, and opportunities delivered to your inbox.'}
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder={newsletterContent.placeholder || 'Enter your email'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 px-4 py-3 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/35 focus:border-primary transition-colors"
              />
              <button 
                type="submit"
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors focus-ring whitespace-nowrap"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
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
              © 2025 GDG@PSU. All rights reserved.
            </p>
          </div>
        </div>
      </div>

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