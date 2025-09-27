import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { useContent } from '@/contexts/ContentContext';
import { Navigate } from 'react-router-dom';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import { Calendar, Plus, Edit, Trash2, Users, MapPin, ExternalLink, UserCheck, X, Save, Search, Filter, Eye, EyeOff, Mail, Star } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { EventsService, type Event } from '@/services/eventsService';
import { AttendanceService, type Attendee } from '@/services/attendanceService';
import { EmailService, type EventEmailRequest } from '@/services/emailService';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

const AdminEvents = () => {
  const { isAuthenticated } = useAdmin();

  const { refreshContent } = useContent();
  const [events, setEvents] = useState<Event[]>([]);
  const [eventStats, setEventStats] = useState({
    total: 0,
    upcoming: 0,
    past: 0,
    totalAttendees: 0
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewingAttendees, setViewingAttendees] = useState<Event | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<any>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailData, setEmailData] = useState({
    subject: '',
    message: '',
    email_type: 'reminder' as 'reminder' | 'thank_you' | 'update' | 'custom',
    custom_emails: ''
  });
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Lock body scroll when any modal is open
  useBodyScrollLock(showCreateForm || !!editingEvent || !!viewingAttendees || showEmailModal);

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Unified form data state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    image_url: '',
    registration_url: '',
    google_form_url: '',
    registration_type: 'both' as 'external' | 'internal' | 'both',
    max_participants: '',
    external_attendees: '',
    registration_enabled: true,
    is_featured: false,
    level: 'open_for_all' as 'beginner' | 'intermediate' | 'advanced' | 'open_for_all'
  });

  // Load events and stats
  useEffect(() => {
    loadEvents();
    loadEventStats();
  }, []);

  // Filter events
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || (event as any).type === filterType;
    
    const now = new Date();
    const eventDate = new Date(event.date);
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'upcoming' && eventDate > now) ||
                         (filterStatus === 'past' && eventDate <= now) ||
                         (filterStatus === 'featured' && event.is_featured);
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const eventsData = await EventsService.getEvents();
      setEvents(eventsData);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const loadEventStats = async () => {
    try {
      const stats = await EventsService.getEventStats();
      setEventStats(stats);
    } catch (error) {
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: '',
      location: '',
      image_url: '',
      registration_url: '',
      google_form_url: '',
      registration_type: 'both',
      max_participants: '',
      external_attendees: '',
      registration_enabled: true,
      is_featured: false,
      level: 'open_for_all'
    });
    setError(null);
    setSuccess(null);
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    
    try {
      const eventData = {
        title: formData.title,
        description: formData.description,
        date: formData.date,
        location: formData.location,
        image_url: formData.image_url,
        registration_url: formData.registration_url,
        google_form_url: formData.google_form_url,
        registration_type: formData.registration_type,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
        external_attendees: formData.external_attendees ? parseInt(formData.external_attendees) : 0,
        registration_enabled: formData.registration_enabled,
        is_featured: formData.is_featured,
        level: formData.level
      };
      
      const created = await EventsService.createEvent(eventData);
      if (created) {
        await loadEvents();
        await loadEventStats();
        await refreshContent();
        setShowCreateForm(false);
        resetForm();
        setSuccess('Event created successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Failed to create event. Please try again.');
      }
    } catch (error) {
      setError('An error occurred while creating the event.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditEvent = (event: Event) => {
    const formattedDate = new Date(event.date).toISOString().slice(0, 16);
    setFormData({
      title: event.title,
      description: event.description,
      date: formattedDate,
      location: event.location,
      image_url: event.image_url || '',
      registration_url: event.registration_url || '',
      google_form_url: event.google_form_url || '',
      registration_type: event.registration_type || 'both',
      max_participants: event.max_participants?.toString() || '',
      external_attendees: event.external_attendees?.toString() || '0',
      registration_enabled: event.registration_enabled !== false,
      is_featured: event.is_featured,
      level: event.level || 'open_for_all'
    });
    setEditingEvent(event);
    setError(null);
    setSuccess(null);
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    
    setIsSaving(true);
    setError(null);

    try {
      const eventData = {
        title: formData.title,
        description: formData.description,
        date: formData.date,
        location: formData.location,
        image_url: formData.image_url,
        registration_url: formData.registration_url,
        google_form_url: formData.google_form_url,
        registration_type: formData.registration_type,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
        external_attendees: formData.external_attendees ? parseInt(formData.external_attendees) : 0,
        registration_enabled: formData.registration_enabled,
        is_featured: formData.is_featured,
        level: formData.level
      };
      
      const updatedEvent = await EventsService.updateEvent(editingEvent.id, eventData);
      
      if (updatedEvent) {
        await loadEvents();
        await loadEventStats();
        await refreshContent();
        setEditingEvent(null);
        resetForm();
        setSuccess('Event updated successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Failed to update event. Please try again.');
      }
    } catch (error) {
      setError('An error occurred while updating the event.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      try {
        const success = await EventsService.deleteEvent(id);
        if (success) {
          await loadEvents();
          await loadEventStats();
          await refreshContent();
          setSuccess('Event deleted successfully!');
          setTimeout(() => setSuccess(null), 3000);
        } else {
          setError('Failed to delete event. Please try again.');
        }
      } catch (error) {
        setError('An error occurred while deleting the event.');
      }
    }
  };

  const handleToggleFeatured = async (event: Event) => {
    try {
      const newFeaturedStatus = !event.is_featured;
      const updated = await EventsService.updateEvent(event.id, {
        is_featured: newFeaturedStatus
      });
      if (updated) {
        // Update the local state immediately for better UX
        setEvents(prevEvents => 
          prevEvents.map(e => 
            e.id === event.id 
              ? { ...e, is_featured: newFeaturedStatus }
              : e
          )
        );
        await loadEventStats();
        await refreshContent();
        setSuccess(`Event ${newFeaturedStatus ? 'featured' : 'unfeatured'} successfully!`);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (error) {
      setError('Failed to update event status.');
      console.error('Toggle featured error:', error);
    }
  };

  const handleViewAttendees = async (event: Event) => {
    try {
      setViewingAttendees(event);
      const eventAttendees = await AttendanceService.getEventAttendees(event.id);
      const stats = await AttendanceService.getEventAttendanceStats(event.id);
      setAttendees(eventAttendees);
      setAttendanceStats(stats);
    } catch (error) {
      setError('Failed to load attendees');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleCloseAttendeesModal = () => {
    setViewingAttendees(null);
    setAttendees([]);
    setAttendanceStats(null);
  };

  const getEmailTemplates = (event: Event | null) => {
    if (!event) return {
      reminder: { subject: '', message: '' },
      thank_you: { subject: '', message: '' },
      update: { subject: '', message: '' },
      custom: { subject: '', message: '' }
    };

    const eventDate = new Date(event.date);
    const isUpcoming = eventDate > new Date();

    return {
      reminder: {
        subject: `Reminder: ${event.title}`,
        message: `Dear {name},

We hope you're excited about the upcoming event!

Please make sure to arrive on time. We're looking forward to seeing you there!

If you have any questions or need directions, feel free to reach out to us.

Best regards,
The GDG@PSU Team`
      },
      thank_you: {
        subject: `Thank you for attending: ${event.title}`,
        message: `Dear {name},

Thank you for attending our event! We hope you enjoyed it and found it valuable.

Your participation made it a great success!

We'd love to hear your feedback and see you at future events. If you have any questions or suggestions, please don't hesitate to reach out.

Best regards,
The GDG@PSU Team`
      },
      update: {
        subject: `Update: ${event.title}`,
        message: `Dear {name},

We have an important update regarding the upcoming event.

[Please add your update information here]

If you have any questions about these changes, please feel free to contact us.

Best regards,
The GDG@PSU Team`
      },
      custom: {
        subject: `${event.title}`,
        message: `Dear {name},

[Add your custom message here]

Best regards,
The GDG@PSU Team`
      }
    };
  };

  const handleEmailAttendees = () => {
    if (!viewingAttendees) return;

    // Determine if event is upcoming or past
    const eventDate = new Date(viewingAttendees.date);
    const now = new Date();
    const isUpcoming = eventDate > now;
    
    // Get email templates and set default based on event timing
    const templates = getEmailTemplates(viewingAttendees);
    const defaultType = isUpcoming ? 'reminder' : 'thank_you';
    
    setEmailData({
      subject: templates[defaultType].subject,
      message: templates[defaultType].message,
      email_type: defaultType,
      custom_emails: ''
    });
    
    setShowEmailModal(true);
  };

  const handleSendEmail = async () => {
    if (!viewingAttendees || !emailData.subject || !emailData.message) return;

    setIsSendingEmail(true);
    setError(null);

    try {
      const result = await EmailService.sendEventEmail({
        event_id: viewingAttendees.id,
        subject: emailData.subject,
        message: emailData.message,
        email_type: emailData.email_type,
        custom_emails: emailData.custom_emails
      });

      if (result.success) {
        setSuccess(`Email sent successfully to ${result.total_sent} recipients!`);
        setShowEmailModal(false);
        
        // Reset email data
        setEmailData({
          subject: '',
          message: '',
          email_type: 'reminder',
          custom_emails: ''
        });
      } else {
        setError(result.error || 'Failed to send email');
      }
    } catch (error) {
      setError('Failed to send email. Please try again.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleToggleAttendance = async (attendeeId: string, currentStatus: boolean) => {
    try {
      const success = await AttendanceService.markAttendance(attendeeId, !currentStatus);
      if (success && viewingAttendees) {
        // Refresh the attendees list and stats
        const eventAttendees = await AttendanceService.getEventAttendees(viewingAttendees.id);
        const stats = await AttendanceService.getEventAttendanceStats(viewingAttendees.id);
        setAttendees(eventAttendees);
        setAttendanceStats(stats);
        setSuccess(`Attendance ${!currentStatus ? 'marked' : 'unmarked'} successfully!`);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (error) {
      setError('Failed to update attendance');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleToggleRegistration = async (event: Event) => {
    try {
      const updated = await EventsService.updateEvent(event.id, {
        registration_enabled: !event.registration_enabled
      });
      if (updated) {
        await loadEvents();
        await loadEventStats();
        await refreshContent();
        setSuccess(`Registration ${event.registration_enabled ? 'disabled' : 'enabled'} successfully!`);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (error) {
      setError('Failed to update registration status.');
    }
  };

  return (
    <AdminPageWrapper pageName="Admin Events" pageTitle="Event Management">
      <AdminLayout
        title="Event Management"
      subtitle="Create and manage GDG events"
      icon={Calendar}
      actions={
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          <Plus size={16} />
          <span>Create Event</span>
        </button>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-4">
            <Calendar size={24} className="text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-foreground mb-1">{eventStats.total}</div>
          <div className="text-sm text-muted-foreground">Total Events</div>
        </div>
        
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-4">
            <Users size={24} className="text-green-500" />
          </div>
          <div className="text-3xl font-bold text-foreground mb-1">{eventStats.totalAttendees}</div>
          <div className="text-sm text-muted-foreground">Total Attendees</div>
        </div>
        
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-4">
            <Calendar size={24} className="text-purple-500" />
          </div>
          <div className="text-3xl font-bold text-foreground mb-1">{eventStats.upcoming}</div>
          <div className="text-sm text-muted-foreground">Upcoming Events</div>
        </div>
        
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-4">
            <Calendar size={24} className="text-orange-500" />
          </div>
          <div className="text-3xl font-bold text-foreground mb-1">{eventStats.past}</div>
          <div className="text-sm text-muted-foreground">Past Events</div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-900/20 border border-green-500 text-green-400 px-4 py-3 rounded-lg mb-6">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-card rounded-xl p-6 shadow-sm border border-border mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search events by title, description, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground bg-card"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Filter size={16} className="text-muted-foreground" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground bg-card"
            >
              <option value="all">All Types</option>
              <option value="Workshop">Workshops</option>
              <option value="Talk">Talks</option>
              <option value="Networking">Networking</option>
              <option value="Study Jam">Study Jams</option>
              <option value="Featured">Featured</option>
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground bg-card"
            >
              <option value="all">All Events</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
              <option value="featured">Featured Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="bg-card rounded-xl shadow-sm border border-border">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Events ({filteredEvents.length})</h2>
        </div>
            
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading events...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <Calendar size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No events found</h3>
              <p className="text-muted-foreground mb-6">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map((event) => (
                <div key={event.id} className="border border-border rounded-lg p-6 hover:bg-muted transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold text-foreground">{event.title}</h3>
                        {event.is_featured && (
                          <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full font-medium">
                            Featured
                          </span>
                        )}
                        {event.level && (
                          <span className={`px-2 py-1 text-xs rounded-full font-medium border ${
                            event.level === 'beginner' ? 'bg-green-900 text-green-300 border-green-600' :
                            event.level === 'intermediate' ? 'bg-yellow-900 text-yellow-300 border-yellow-600' :
                            event.level === 'advanced' ? 'bg-red-900 text-red-300 border-red-600' :
                            event.level === 'open_for_all' ? 'bg-blue-900 text-blue-300 border-blue-600' :
                            'bg-gray-700 text-gray-300 border-gray-600'
                          }`}>
                            {event.level === 'open_for_all' ? 'Open for All' : 
                             event.level === 'beginner' ? 'Beginner' :
                             event.level === 'intermediate' ? 'Intermediate' :
                             event.level === 'advanced' ? 'Advanced' :
                             event.level}
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground mb-4">{event.description}</p>
                      
                      <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-2">
                          <Calendar size={16} />
                          <span>{new Date(event.date).toLocaleDateString()} at {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin size={16} />
                          <span>{event.location}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleToggleRegistration(event)}
                        className={`p-2 hover:bg-gray-800 rounded-lg transition-colors ${
                          event.registration_enabled ? 'text-green-400 hover:text-green-300' : 'text-muted-foreground hover:text-muted-foreground'
                        }`}
                        title={event.registration_enabled ? 'Disable registration' : 'Enable registration'}
                      >
                        {event.registration_enabled ? <Eye size={18} /> : <EyeOff size={18} />}
                      </button>
                      <button 
                        onClick={() => handleViewAttendees(event)}
                        className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-muted-foreground hover:text-blue-400"
                        title="View Registrations"
                      >
                        <UserCheck size={18} />
                      </button>
                      <button 
                        onClick={() => handleToggleFeatured(event)}
                        className={`p-2 hover:bg-gray-800 rounded-lg transition-colors ${
                          event.is_featured ? 'text-yellow-400 hover:text-yellow-300' : 'text-gray-400 hover:text-yellow-400'
                        }`}
                        title={event.is_featured ? 'Remove from featured' : 'Mark as featured'}
                      >
                        <Star 
                          size={18} 
                          className={event.is_featured ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'} 
                        />
                      </button>
                      <button 
                        onClick={() => handleEditEvent(event)}
                        className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-muted-foreground hover:text-blue-400"
                        title="Edit Event"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteEvent(event.id)}
                        className="p-2 hover:bg-red-900/50 rounded-lg transition-colors text-muted-foreground hover:text-red-400"
                        title="Delete Event"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Event Modal */}
      {showCreateForm && (
        <div 
          className="fixed inset-0 z-50 bg-card/50 flex items-center justify-center p-4"
          style={{ 
            overflow: 'hidden',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCreateForm(false);
              resetForm();
            }
          }}
          onWheel={(e) => e.preventDefault()}
          onTouchMove={(e) => e.preventDefault()}
          onScroll={(e) => e.preventDefault()}
        >
          <div 
            className="bg-card rounded-xl shadow-xl border border-border w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            {/* Fixed Header */}
            <div className="flex-shrink-0 p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">Create New Event</h2>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    resetForm();
                  }}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto overflow-auto p-6">
              <form onSubmit={handleCreateEvent} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Event Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground bg-muted"
                  placeholder="Enter event title"
                />
              </div>
                
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground bg-muted"
                  placeholder="Enter event description"
                />
              </div>
                
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground bg-muted"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground bg-muted"
                    placeholder="Event location"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Event Capacity</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.max_participants}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_participants: e.target.value }))}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground bg-muted"
                    placeholder="Maximum number of participants"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Leave empty for unlimited capacity
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">External Attendees</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.external_attendees}
                    onChange={(e) => setFormData(prev => ({ ...prev, external_attendees: e.target.value }))}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground bg-muted"
                    placeholder="Number of external attendees"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Manual count for external registrations
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">Event Level</label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value as 'beginner' | 'intermediate' | 'advanced' | 'open_for_all' }))}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground bg-muted"
                >
                  <option value="open_for_all">Open for All</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Select the appropriate skill level for this event
                </p>
              </div>

              {error && (
                <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}
              
              <div className="flex space-x-3 pt-6 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    resetForm();
                  }}
                  className="flex-1 px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors font-medium text-gray-300"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-6 py-3 bg-primary text-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save size={16} className="mr-2" />
                      Create Event
                    </>
                  )}
                </button>
              </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {editingEvent && (
        <div 
          className="fixed inset-0 z-50 bg-card/50 flex items-center justify-center p-4"
          style={{ 
            overflow: 'hidden',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setEditingEvent(null);
              resetForm();
            }
          }}
          onWheel={(e) => e.preventDefault()}
          onTouchMove={(e) => e.preventDefault()}
          onScroll={(e) => e.preventDefault()}
        >
          <div 
            className="bg-card rounded-xl shadow-xl border border-border w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            {/* Fixed Header */}
            <div className="flex-shrink-0 p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">Edit Event</h2>
                <button
                  onClick={() => {
                    setEditingEvent(null);
                    resetForm();
                  }}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto overflow-auto p-6">
              <form onSubmit={handleUpdateEvent} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Event Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground bg-muted"
                  placeholder="Enter event title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground bg-muted"
                  placeholder="Enter event description"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground bg-muted"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground bg-muted"
                    placeholder="Event location"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Event Capacity</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.max_participants}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_participants: e.target.value }))}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground bg-muted"
                    placeholder="Maximum number of participants"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Leave empty for unlimited capacity
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">External Attendees</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.external_attendees}
                    onChange={(e) => setFormData(prev => ({ ...prev, external_attendees: e.target.value }))}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground bg-muted"
                    placeholder="Number of external attendees"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Manual count for external registrations
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">Event Level</label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value as 'beginner' | 'intermediate' | 'advanced' | 'open_for_all' }))}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground bg-muted"
                >
                  <option value="open_for_all">Open for All</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Select the appropriate skill level for this event
                </p>
              </div>

              {error && (
                <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}
              
              <div className="flex space-x-3 pt-6 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setEditingEvent(null);
                    resetForm();
                  }}
                  className="flex-1 px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors font-medium text-gray-300"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-6 py-3 bg-primary text-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save size={16} className="mr-2" />
                      Update Event
                    </>
                  )}
                </button>
              </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Attendees Modal */}
      {viewingAttendees && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={handleCloseAttendeesModal}
        >
          <div 
            className="bg-card rounded-xl shadow-xl border border-border w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            {/* Fixed Header */}
            <div className="flex-shrink-0 p-6 border-b border-border">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    Event Registrations
                  </h2>
                  <p className="text-muted-foreground mt-1">
                    {viewingAttendees.title}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleEmailAttendees}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                    title={`Send email to attendees and custom recipients`}
                  >
                    <Mail size={16} />
                    <span>Email All ({attendees.length > 0 ? attendees.length : 'Custom Only'})</span>
                  </button>
                  <button
                    onClick={handleCloseAttendeesModal}
                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              
              {/* Stats */}
              {attendanceStats && (
                <div className="grid grid-cols-4 gap-4 mt-4">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-blue-500">
                      {attendanceStats.totalRegistrations}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Internal Registrations
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-purple-500">
                      {viewingAttendees.external_attendees || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      External Attendees
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-orange-500">
                      {attendanceStats.totalRegistrations + (viewingAttendees.external_attendees || 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total Attendees
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-green-500">
                      {attendanceStats.totalAttended}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Attended (Internal)
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {attendees.length > 0 ? (
                <div className="space-y-4">
                  {attendees.map((attendee) => (
                    <div 
                      key={attendee.id} 
                      className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div>
                              <h3 className="font-semibold text-foreground">
                                {attendee.attendee_name}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {attendee.attendee_email}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center space-x-4 text-sm text-muted-foreground">
                            <span>
                              Registered: {new Date(attendee.registration_date).toLocaleDateString()}
                            </span>
                            {attendee.check_in_time && (
                              <span>
                                Checked in: {new Date(attendee.check_in_time).toLocaleString()}
                              </span>
                            )}
                          </div>
                          {attendee.notes && (
                            <div className="mt-2">
                              <p className="text-sm text-muted-foreground">
                                <strong>Notes:</strong> {attendee.notes}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleToggleAttendance(attendee.id, attendee.attended)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                              attendee.attended 
                                ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40'
                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:hover:bg-gray-900/40'
                            }`}
                            title={`Click to mark as ${attendee.attended ? 'not attended' : 'attended'}`}
                          >
                            {attendee.attended ? '✓ Attended' : '○ Registered'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    No Registrations Yet
                  </h3>
                  <p className="text-muted-foreground">
                    No one has registered for this event yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && viewingAttendees && (
        <div 
          className="fixed inset-0 z-50 bg-card/50 flex items-center justify-center p-4"
          style={{ 
            overflow: 'hidden',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowEmailModal(false);
            }
          }}
          onWheel={(e) => e.preventDefault()}
          onTouchMove={(e) => e.preventDefault()}
          onScroll={(e) => e.preventDefault()}
        >
          <div 
            className="bg-card rounded-xl shadow-xl border border-border w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            {/* Fixed Header */}
            <div className="flex-shrink-0 p-6 border-b border-border">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    Send Email to Attendees
                  </h2>
                  <p className="text-muted-foreground mt-1">
                    {viewingAttendees.title} • {(() => {
                      const customEmailCount = emailData.custom_emails 
                        ? emailData.custom_emails.split(/[,\n\r]+/).filter(email => email.trim() && email.includes('@')).length 
                        : 0;
                      const totalRecipients = attendees.length + customEmailCount;
                      
                      if (attendees.length === 0 && customEmailCount === 0) {
                        return 'No recipients yet - add custom emails below';
                      } else if (attendees.length === 0) {
                        return `${customEmailCount} custom recipients`;
                      } else if (customEmailCount === 0) {
                        return `${attendees.length} attendees`;
                      } else {
                        return `${attendees.length} attendees + ${customEmailCount} custom = ${totalRecipients} total`;
                      }
                    })()}
                  </p>
                </div>
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                  disabled={isSendingEmail}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto overflow-auto p-6">
              <div className="space-y-6">
              {/* Email Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email Type</label>
                <select
                  value={emailData.email_type}
                  onChange={(e) => {
                    const newType = e.target.value as 'reminder' | 'thank_you' | 'update' | 'custom';
                    const templates = getEmailTemplates(viewingAttendees);
                    setEmailData(prev => ({ 
                      ...prev, 
                      email_type: newType,
                      subject: templates[newType].subject,
                      message: templates[newType].message
                    }));
                  }}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground bg-muted"
                  disabled={isSendingEmail}
                >
                  <option value="reminder">Reminder</option>
                  <option value="thank_you">Thank You</option>
                  <option value="update">Update</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Subject</label>
                <input
                  type="text"
                  value={emailData.subject}
                  onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground bg-muted"
                  placeholder="Enter email subject"
                  disabled={isSendingEmail}
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Message</label>
                <textarea
                  value={emailData.message}
                  onChange={(e) => setEmailData(prev => ({ ...prev, message: e.target.value }))}
                  rows={8}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground bg-muted"
                  placeholder="Enter your message to attendees"
                  disabled={isSendingEmail}
                />
                <p className="text-xs text-gray-400 mt-2">
                  Event details (date, time, location) will be automatically included in the email template.
                  Use <code className="bg-gray-700 px-1 rounded">{'{name}'}</code> to personalize with recipient names.
                </p>
              </div>

              {/* Custom Email Addresses */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Additional Recipients (Optional)</label>
                <textarea
                  value={emailData.custom_emails}
                  onChange={(e) => setEmailData(prev => ({ ...prev, custom_emails: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground bg-muted"
                  placeholder="Enter additional email addresses separated by commas or new lines&#10;example@psu.edu, another@example.com"
                  disabled={isSendingEmail}
                />
                <p className="text-xs text-gray-400 mt-2">
                  Additional emails will be added to BCC. Separate multiple emails with commas or new lines.
                </p>
              </div>

  

              {error && (
                  <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}
              </div>
            </div>

            {/* Fixed Footer */}
            <div className="flex-shrink-0 p-6 border-t border-border">
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="flex-1 px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors font-medium text-gray-300"
                  disabled={isSendingEmail}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendEmail}
                  disabled={isSendingEmail || !emailData.subject || !emailData.message || (() => {
                    const customEmailCount = emailData.custom_emails 
                      ? emailData.custom_emails.split(/[,\n\r]+/).filter(email => email.trim() && email.includes('@')).length 
                      : 0;
                    return attendees.length === 0 && customEmailCount === 0;
                  })()}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium flex items-center justify-center space-x-2"
                >
                  {isSendingEmail ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Mail size={16} />
                      <span>Send to {(() => {
                        const customEmailCount = emailData.custom_emails 
                          ? emailData.custom_emails.split(/[,\n\r]+/).filter(email => email.trim() && email.includes('@')).length 
                          : 0;
                        const totalRecipients = attendees.length + customEmailCount;
                        
                        if (totalRecipients === 0) {
                          return 'recipients (add emails above)';
                        } else {
                          return totalRecipients === 1 ? '1 recipient' : `${totalRecipients} recipients`;
                        }
                      })()}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
    </AdminPageWrapper>
  );
};

export default AdminEvents;
