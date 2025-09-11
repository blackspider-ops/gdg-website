import React, { Suspense } from 'react';
import { Mail, MessageSquare, Users, Calendar, Github, Twitter, Instagram } from 'lucide-react';

const HeroScene = React.lazy(() => import('@/components/HeroScene'));

const Contact = () => {
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    type: 'general',
    message: '',
    interests: [] as string[],
  });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement form submission when backend is connected
    console.log('Form submitted:', formData);
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
          <div className="animate-fade-up">
            <div className="flex items-center justify-center space-x-2 mb-6">
              <span className="text-sm font-medium text-primary uppercase tracking-wide">
                Contact Us
              </span>
              <div className="w-12 h-px bg-border"></div>
            </div>
            
            <h1 className="font-display text-5xl lg:text-7xl font-bold mb-6 leading-tight">
              Get in Touch
              <br />
              <span className="text-primary">with GDG PSU</span>
            </h1>
            
            <p className="text-xl text-muted-foreground content-measure mx-auto mb-8">
              Ready to join our community? Have questions about events? Let's connect.
            </p>
          </div>
        </div>
      </section>

      <div className="editorial-grid py-16">
        {/* Contact Form */}
        <div className="col-span-12 lg:col-span-8">
          <div className="gdg-accent-bar pl-6">
            <h2 className="text-display text-2xl font-semibold mb-6">Send us a Message</h2>
            
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
                    className="w-full px-4 py-3 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gdg-blue"
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
                    className="w-full px-4 py-3 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gdg-blue"
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
                  className="w-full px-4 py-3 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gdg-blue"
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
                          className="w-4 h-4 text-gdg-blue bg-background border border-input rounded focus:ring-gdg-blue focus:ring-2"
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
                  className="w-full px-4 py-3 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gdg-blue resize-none"
                  placeholder="Tell us more about your inquiry..."
                />
              </div>

              <button
                type="submit"
                className="btn-editorial px-6 py-3 bg-gdg-blue text-white border-gdg-blue hover:bg-gdg-blue/90"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>

        {/* Contact Info & Links */}
        <div className="col-span-12 lg:col-span-4 lg:col-start-9 space-y-8">
          {/* Quick Contact */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="font-display font-semibold text-lg mb-4">Quick Contact</h3>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Mail size={18} className="text-gdg-blue mt-0.5" />
                <div>
                  <div className="font-medium text-sm">Email</div>
                  <a href="mailto:contact@gdgpsu.org" className="text-muted-foreground text-sm hover:text-gdg-blue transition-colors">
                    contact@gdgpsu.org
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <MessageSquare size={18} className="text-gdg-blue mt-0.5" />
                <div>
                  <div className="font-medium text-sm">Discord</div>
                  <span className="text-muted-foreground text-sm">
                    Join our server for real-time chat
                  </span>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Calendar size={18} className="text-gdg-blue mt-0.5" />
                <div>
                  <div className="font-medium text-sm">Office Hours</div>
                  <span className="text-muted-foreground text-sm">
                    Wednesdays 4-6 PM, IST Building
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="font-display font-semibold text-lg mb-4">Follow Us</h3>
            
            <div className="space-y-3">
              <a href="#" className="flex items-center space-x-3 p-3 hover:bg-muted rounded-md transition-colors group">
                <Github size={18} className="text-muted-foreground group-hover:text-gdg-blue transition-colors" />
                <span className="text-sm">@gdgpsu</span>
              </a>
              
              <a href="#" className="flex items-center space-x-3 p-3 hover:bg-muted rounded-md transition-colors group">
                <Twitter size={18} className="text-muted-foreground group-hover:text-gdg-blue transition-colors" />
                <span className="text-sm">@gdgpsu</span>
              </a>
              
              <a href="#" className="flex items-center space-x-3 p-3 hover:bg-muted rounded-md transition-colors group">
                <Instagram size={18} className="text-muted-foreground group-hover:text-gdg-blue transition-colors" />
                <span className="text-sm">@gdg.psu</span>
              </a>
            </div>
          </div>

          {/* Newsletter Signup */}
          <div className="bg-gdg-blue/5 border border-gdg-blue/20 rounded-lg p-6">
            <div className="flex items-start space-x-4 mb-4">
              <div className="w-10 h-10 bg-gdg-blue rounded-lg flex items-center justify-center flex-shrink-0">
                <Users size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-display font-semibold mb-1">Stay in the Loop</h3>
                <p className="text-muted-foreground text-sm">
                  Get weekly updates on events and opportunities.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gdg-blue"
              />
              <button className="btn-editorial px-4 py-2 bg-gdg-blue text-white border-gdg-blue hover:bg-gdg-blue/90 w-full">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;