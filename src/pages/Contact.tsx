import React, { Suspense } from 'react';
import { Mail, MessageSquare, Users, Calendar, Github, Twitter, Instagram } from 'lucide-react';
import { useContent } from '@/contexts/ContentContext';
import { ContactService, type ContactFormData } from '@/services/contactService';

const HeroScene = React.lazy(() => import('@/components/HeroScene'));

const Contact = () => {
  const { getPageSection, getSiteSetting, getLink } = useContent();
  
  // Get dynamic content from admin panel
  const rawContactContent = getPageSection('contact', 'main') || {};
  
  // Parse contact links and social links if they exist
  const contactContent = React.useMemo(() => {
    const content = { ...rawContactContent };
    
    // Parse contact_links if it's a JSON string
    if (content.contact_links && typeof content.contact_links === 'string') {
      try {
        content.contact_links = JSON.parse(content.contact_links);
      } catch (error) {
        content.contact_links = [];
      }
    } else if (!Array.isArray(content.contact_links)) {
      content.contact_links = [];
    }

    // Parse social_links if it's a JSON string
    if (content.social_links && typeof content.social_links === 'string') {
      try {
        content.social_links = JSON.parse(content.social_links);
      } catch (error) {
        content.social_links = [];
      }
    } else if (!Array.isArray(content.social_links)) {
      content.social_links = [];
    }
    
    return content;
  }, [rawContactContent]);
  

  
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    type: 'general',
    message: '',
    interests: [] as string[],
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitStatus, setSubmitStatus] = React.useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const contactTypes = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'join', label: 'Join Chapter' },
    { value: 'volunteer', label: 'Volunteer Opportunity' },
    { value: 'sponsor', label: 'Partnership/Sponsorship' },
    { value: 'speaker', label: 'Speaking Opportunity' },
  ];

  const interestAreas = [
    'Android Development',
    'Web Development',
    'Machine Learning',
    'Cloud Computing',
    'UI/UX Design',
    'Data Science',
    'Cybersecurity',
    'DevOps',
  ];

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: '' });

    try {
      const result = await ContactService.submitContactForm(formData);

      if (result.success) {
        setSubmitStatus({
          type: 'success',
          message: 'Thank you for your message! We\'ll get back to you soon.'
        });
        // Reset form
        setFormData({
          name: '',
          email: '',
          type: 'general',
          message: '',
          interests: [],
        });
      } else {
        setSubmitStatus({
          type: 'error',
          message: result.error || 'Failed to send message. Please try again.'
        });
      }
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: 'An unexpected error occurred. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
      // Clear status after 5 seconds
      setTimeout(() => {
        setSubmitStatus({ type: null, message: '' });
      }, 5000);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with 3D Scene */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <Suspense fallback={<div className="absolute inset-0 bg-background" />}>
          <HeroScene />
        </Suspense>
        
        {/* Hero Content */}
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <div className="animate-fade-up backdrop-blur-sm bg-background/20 rounded-2xl p-8 border border-white/10">
            <div className="flex items-center justify-center space-x-2 mb-6">
              <span className="text-sm font-medium text-primary uppercase tracking-wide">
                Contact Us
              </span>
              <div className="w-12 h-px bg-border"></div>
            </div>
            
            <h1 className="font-display text-5xl lg:text-7xl font-bold mb-6 leading-tight text-foreground drop-shadow-lg">
              {contactContent.title || 'Get in Touch'}
              <br />
              <span className="text-primary">with {getSiteSetting('site_title') || 'GDG PSU'}</span>
            </h1>
            
            <p className="text-xl text-muted-foreground content-measure mx-auto mb-8 drop-shadow-md">
              {contactContent.subtitle || 'Ready to join our community? Have questions about events? Let\'s connect.'}
            </p>
          </div>
        </div>
      </section>

      <div className="editorial-grid py-16">
        {/* Contact Form */}
        <div className="col-span-12 lg:col-span-8">
          <div className="gdg-accent-bar pl-6">
            <h2 className="text-display text-2xl font-semibold mb-6">{contactContent.form_title || 'Send us a Message'}</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="your.email@psu.edu"
                  />
                </div>
              </div>

              {/* Inquiry Type */}
              <div>
                <label htmlFor="type" className="block text-sm font-medium mb-2">
                  Type of Inquiry
                </label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-4 py-3 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {contactTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Interests (show only for join/volunteer) */}
              {(formData.type === 'join' || formData.type === 'volunteer') && (
                <div>
                  <label className="block text-sm font-medium mb-3">
                    Areas of Interest (select all that apply)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {interestAreas.map((interest) => (
                      <label key={interest} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.interests.includes(interest)}
                          onChange={() => handleInterestToggle(interest)}
                          className="w-4 h-4 text-gdg-blue bg-background border border-input rounded focus:ring-primary focus:ring-2"
                        />
                        <span className="text-sm">{interest}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  required
                  rows={6}
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full px-4 py-3 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  placeholder="Tell us more about your inquiry..."
                />
              </div>

              {/* Status Messages */}
              {submitStatus.type && (
                <div className={`p-4 rounded-lg ${
                  submitStatus.type === 'success' 
                    ? 'bg-green-900/20 border border-green-500 text-green-400' 
                    : 'bg-red-900/20 border border-red-500 text-red-400'
                }`}>
                  {submitStatus.message}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-editorial px-6 py-3 bg-gdg-blue text-foreground border-gdg-blue hover:bg-gdg-blue/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Sending...</span>
                  </>
                ) : (
                  <span>{contactContent.button_text || 'Send Message'}</span>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Contact Info & Links */}
        <div className="col-span-12 lg:col-span-4 lg:col-start-9 space-y-8">
          {/* Quick Contact */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="font-display font-semibold text-lg mb-4">{contactContent.quick_contact_title || 'Quick Contact'}</h3>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Mail size={18} className="text-gdg-blue mt-0.5" />
                <div>
                  <div className="font-medium text-sm">{contactContent.email_label || 'Email'}</div>
                  {contactContent.email_url ? (
                    <a 
                      href={contactContent.email_url} 
                      className="text-muted-foreground text-sm hover:text-gdg-blue transition-colors"
                      target={contactContent.email_url.startsWith('mailto:') ? '_self' : '_blank'}
                      rel={contactContent.email_url.startsWith('mailto:') ? '' : 'noopener noreferrer'}
                    >
                      {contactContent.email_url.startsWith('mailto:') 
                        ? contactContent.email_url.replace('mailto:', '') 
                        : 'Contact Us'}
                    </a>
                  ) : (
                    <a href="mailto:contact@gdgpsu.org" className="text-muted-foreground text-sm hover:text-gdg-blue transition-colors">
                      contact@gdgpsu.org
                    </a>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <MessageSquare size={18} className="text-gdg-blue mt-0.5" />
                <div>
                  <div className="font-medium text-sm">{contactContent.discord_label || 'Discord'}</div>
                  {contactContent.discord_url ? (
                    <a 
                      href={contactContent.discord_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-muted-foreground text-sm hover:text-gdg-blue transition-colors"
                    >
                      {contactContent.discord_description || 'Join our server for real-time chat'}
                    </a>
                  ) : (
                    <span className="text-muted-foreground text-sm">
                      {contactContent.discord_description || 'Join our server for real-time chat'}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Calendar size={18} className="text-gdg-blue mt-0.5" />
                <div>
                  <div className="font-medium text-sm">{contactContent.office_hours_label || 'Office Hours'}</div>
                  <span className="text-muted-foreground text-sm">
                    {contactContent.office_hours_info || 'Wednesdays 4-6 PM, IST Building'}
                  </span>
                </div>
              </div>

              {/* Dynamic Contact Links */}
              {contactContent.contact_links && contactContent.contact_links.length > 0 && (
                <>
                  <div className="border-t border-border pt-4 mt-4">
                    <div className="text-sm font-medium text-muted-foreground mb-3">
                      {contactContent.additional_links_title || 'Additional Links'}
                    </div>
                  </div>
                  {contactContent.contact_links.map((link: any) => (
                    <div key={link.id} className="flex items-start space-x-3">
                      <div className="w-[18px] h-[18px] mt-0.5 flex items-center justify-center">
                        <div className="w-2 h-2 bg-gdg-blue rounded-full"></div>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          <a 
                            href={link.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:text-gdg-blue transition-colors"
                          >
                            {link.name}
                          </a>
                        </div>
                        {link.description && (
                          <span className="text-muted-foreground text-sm">
                            {link.description}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>




        </div>
      </div>
    </div>
  );
};

export default Contact;