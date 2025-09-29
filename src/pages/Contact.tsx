import React, { Suspense } from 'react';
import { Mail, MessageSquare, Users, Calendar, Github, Twitter, Instagram, Upload, X, FileText, Clock, MapPin } from 'lucide-react';
import { useContent } from '@/contexts/ContentContext';
import { ContactService, type ContactFormData } from '@/services/contactService';
import { BlogSubmissionService } from '@/services/blogSubmissionService';
import { supabase } from '@/lib/supabase';

const HeroScene = React.lazy(() => import('@/components/HeroScene'));

const Contact = () => {
  const { getPageSection, getSiteSetting, getLink } = useContent();
  
  // Parse contact links and social links if they exist
  const contactContent = React.useMemo(() => {
    const rawContactContent = getPageSection('contact', 'main') || {};
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
  }, [getPageSection]);
  

  
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    type: 'general',
    message: '',
    interests: [] as string[],
    blogSubmissionFile: null as File | null,
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitStatus, setSubmitStatus] = React.useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [fileUploadError, setFileUploadError] = React.useState<string>('');

  const contactTypes = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'join', label: 'Join Chapter' },
    { value: 'volunteer', label: 'Volunteer Opportunity' },
    { value: 'sponsor', label: 'Partnership/Sponsorship' },
    { value: 'speaker', label: 'Speaking Opportunity' },
    { value: 'blog_submission', label: 'Blog Submission' },
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileUploadError('');
    
    if (!file) {
      setFormData(prev => ({ ...prev, blogSubmissionFile: null }));
      return;
    }

    // Validate file type (PDF only)
    if (file.type !== 'application/pdf') {
      setFileUploadError('Please upload a PDF file only.');
      e.target.value = '';
      return;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setFileUploadError('File size must be less than 5MB.');
      e.target.value = '';
      return;
    }

    setFormData(prev => ({ ...prev, blogSubmissionFile: file }));
  };

  const removeFile = () => {
    setFormData(prev => ({ ...prev, blogSubmissionFile: null }));
    setFileUploadError('');
    // Reset file input
    const fileInput = document.getElementById('blog-file') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: '' });

    try {
      let fileUploadResult = null;

      // Handle file upload for blog submissions
      if (formData.type === 'blog_submission' && formData.blogSubmissionFile) {
  
        

        // Use secure BlogSubmissionService
        try {
          const uploadResult = await BlogSubmissionService.uploadBlogSubmission(
            formData.blogSubmissionFile,
            formData.name,
            formData.email
          );
          
          if (uploadResult) {
            fileUploadResult = {
              id: uploadResult.id,
              original_name: uploadResult.original_name,
              file_path: uploadResult.file_path
            };
          } else {
            throw new Error('Blog submission upload failed');
          }
        } catch (uploadError) {
          setSubmitStatus({
            type: 'error',
            message: 'File upload failed, but we can still process your submission. Please mention the file in your message or try again later.'
          });
        }
      }

      // Submit the contact form with file info (exclude the file object)
      const submissionData = {
        name: formData.name,
        email: formData.email,
        type: formData.type,
        message: formData.message,
        interests: formData.interests,
        fileUploadId: fileUploadResult?.id,
        fileName: fileUploadResult?.original_name
      };



      const result = await ContactService.submitContactForm(submissionData);

      if (result.success) {
        setSubmitStatus({
          type: 'success',
          message: formData.type === 'blog_submission' && formData.blogSubmissionFile
            ? 'Thank you for your blog submission! We\'ve received your file and will review it soon.'
            : 'Thank you for your message! We\'ll get back to you soon.'
        });
        // Reset form
        setFormData({
          name: '',
          email: '',
          type: 'general',
          message: '',
          interests: [],
          blogSubmissionFile: null,
        });
        setFileUploadError('');
        // Reset file input
        const fileInput = document.getElementById('blog-file') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
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
      <section className="relative h-[60vh] sm:h-[70vh] md:h-[80vh] lg:h-screen flex items-center justify-center overflow-hidden">
        <Suspense fallback={<div className="absolute inset-0 bg-background" />}>
          <HeroScene />
        </Suspense>
        
        {/* Hero Content */}
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <div className="animate-fade-up backdrop-blur-sm bg-background/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 border border-white/10">
            <div className="flex items-center justify-center space-x-2 mb-4 sm:mb-6">
              <span className="text-xs sm:text-sm font-medium text-primary uppercase tracking-wide">
                Contact Us
              </span>
              <div className="w-8 sm:w-12 h-px bg-border"></div>
            </div>
            
            {contactContent.title && (
              <h1 className="font-display text-responsive-3xl font-bold mb-4 sm:mb-6 leading-tight text-foreground drop-shadow-lg">
                {contactContent.title}
                {contactContent.title_second_line && (
                  <>
                    <br />
                    <span className="text-primary">{contactContent.title_second_line}</span>
                  </>
                )}
              </h1>
            )}
            
            {contactContent.subtitle && (
              <p className="text-responsive-base text-muted-foreground content-measure mx-auto mb-6 sm:mb-8 drop-shadow-md">
                {contactContent.subtitle}
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="editorial-grid py-12 sm:py-16">
        {/* Contact Form */}
        <div className="col-span-12 lg:col-span-8">
          <div className="gdg-accent-bar pl-4 sm:pl-6">
            {contactContent.form_title && (
              <h2 className="text-display text-responsive-lg font-semibold mb-4 sm:mb-6">{contactContent.form_title}</h2>
            )}
            
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

              {/* File Upload (show only for blog submission) */}
              {formData.type === 'blog_submission' && (
                <div>
                  <label htmlFor="blog-file" className="block text-sm font-medium mb-2">
                    Blog Post File (PDF only, max 5MB)
                  </label>
                  
                  {!formData.blogSubmissionFile ? (
                    <div className="relative">
                      <input
                        type="file"
                        id="blog-file"
                        accept=".pdf,application/pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <label
                        htmlFor="blog-file"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/30 transition-colors"
                      >
                        <Upload size={24} className="text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground text-center">
                          Click to upload your blog post PDF<br />
                          <span className="text-xs">Maximum file size: 5MB</span>
                        </span>
                      </label>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-4 bg-muted/30 border border-border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText size={20} className="text-gdg-blue" />
                        <div>
                          <div className="text-sm font-medium">{formData.blogSubmissionFile.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {(formData.blogSubmissionFile.size / (1024 * 1024)).toFixed(2)} MB
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeFile}
                        className="p-1 hover:bg-muted rounded-full transition-colors"
                      >
                        <X size={16} className="text-muted-foreground hover:text-foreground" />
                      </button>
                    </div>
                  )}

                  {fileUploadError && (
                    <div className="mt-2 text-sm text-red-500">
                      {fileUploadError}
                    </div>
                  )}

                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <strong>Blog Submission Guidelines:</strong><br />
                      • Submit your blog post as a PDF file<br />
                      • Include your name and contact information in the document<br />
                      • Our team will review your submission and get back to you<br />
                      • Accepted posts may be edited for style and formatting
                    </p>
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
                  <span>{contactContent.button_text}</span>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Contact Info & Links */}
        <div className="col-span-12 lg:col-span-4 lg:col-start-9 space-y-8">
          {/* Quick Contact */}
          <div className="bg-card border border-border rounded-lg p-6">
            {contactContent.quick_contact_title && (
              <h3 className="font-display font-semibold text-lg mb-4">{contactContent.quick_contact_title}</h3>
            )}
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Mail size={18} className="text-gdg-blue mt-0.5" />
                <div>
                  {contactContent.email_label && (
                    <div className="font-medium text-sm">{contactContent.email_label}</div>
                  )}
                  {contactContent.email_url && (
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
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <MessageSquare size={18} className="text-gdg-blue mt-0.5" />
                <div>
                  {contactContent.discord_label && (
                    <div className="font-medium text-sm">{contactContent.discord_label}</div>
                  )}
                  {contactContent.discord_url && contactContent.discord_description && (
                    <a 
                      href={contactContent.discord_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-muted-foreground text-sm hover:text-gdg-blue transition-colors"
                    >
                      {contactContent.discord_description}
                    </a>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Calendar size={18} className="text-gdg-blue mt-0.5" />
                <div>
                  {contactContent.office_hours_label && (
                    <div className="font-medium text-sm">{contactContent.office_hours_label}</div>
                  )}
                  {contactContent.office_hours_info && (
                    <span className="text-muted-foreground text-sm">
                      {contactContent.office_hours_info}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* When & Where We Meet */}
          {(contactContent.meeting_time || contactContent.meeting_location) && (
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-display font-semibold text-lg mb-4">When & Where We Meet</h3>
              
              <div className="space-y-4">
                {contactContent.meeting_time && (
                  <div className="flex items-start space-x-3">
                    <Clock size={18} className="text-gdg-blue mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">Regular Meetings</div>
                      <span className="text-muted-foreground text-sm">
                        {contactContent.meeting_time}
                      </span>
                    </div>
                  </div>
                )}

                {contactContent.meeting_location && (
                  <div className="flex items-start space-x-3">
                    <MapPin size={18} className="text-gdg-blue mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">Location</div>
                      <span className="text-muted-foreground text-sm">
                        {contactContent.meeting_location}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Additional Links */}
          {contactContent.contact_links && contactContent.contact_links.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-6">
              {contactContent.additional_links_title && (
                <h3 className="font-display font-semibold text-lg mb-4">
                  {contactContent.additional_links_title}
                </h3>
              )}
              
              <div className="space-y-4">
                {contactContent.contact_links.map((link: { id: string; name: string; url: string; description?: string }) => (
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
              </div>
            </div>
          )}




        </div>
      </div>
    </div>
  );
};

export default Contact;