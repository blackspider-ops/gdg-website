import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { useDev } from '@/contexts/DevContext';
import { useContent } from '@/contexts/ContentContext';
import { Navigate } from 'react-router-dom';
import { Calendar, Plus, Edit, Trash2, Users, MapPin, ExternalLink, UserCheck, X, Save, Search, Filter, Eye, EyeOff, ArrowUp, ArrowDown } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { EventsService, type Event } from '@/services/eventsService';
import { AttendanceService, type Attendee } from '@/services/attendanceService';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

const AdminEvents = () => {
  const { isAuthenticated } = useAdmin();
  const { isDevelopmentMode, allowDirectAdminAccess } = useDev();
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
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedEventForAttendance, setSelectedEventForAttendance] = useState<Event | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Lock body scroll when any modal is open
  useBodyScrollLock(showCreateForm || !!editingEvent || showAttendanceModal);

  const canAccess = isAuthenticated || (isDevelopmentMode && allowDirectAdminAccess);

  if (!canAccess) {
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
    registration_enabled: true,
    is_featured: false,
    // Event Details fields
    level: '' as 'Beginner' | 'Intermediate' | 'Advanced' | '',
    type: '' as 'Workshop' | 'Talk' | 'Networking' | 'Study Jam' | 'Featured' | '',
    time: '',
    room: '',
    prerequisites: '',
    what_youll_learn: '',
    what_to_bring: '',
    schedule: '',
    additional_info: '',
    contact_info: '',
    attendees_count: ''
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
      console.error('Error loading events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadEventStats = async () => {
    try {
      const stats = await EventsService.getEventStats();
      setEventStats(stats);
    } catch (error) {
      console.error('Error loading event stats:', error);
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
      registration_enabled: true,
      is_featured: false,
      level: '',
      type: '',
      time: '',
      room: '',
      prerequisites: '',
      what_youll_learn: '',
      what_to_bring: '',
      schedule: '',
      additional_info: '',
      contact_info: '',
      attendees_count: ''
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
        registration_enabled: formData.registration_enabled,
        is_featured: formData.is_featured,
        level: formData.level,
        type: formData.type,
        time: formData.time,
        room: formData.room,
        prerequisites: formData.prerequisites,
        what_youll_learn: formData.what_youll_learn,
        what_to_bring: formData.what_to_bring,
        schedule: formData.schedule,
        additional_info: formData.additional_info,
        contact_info: formData.contact_info,
        attendees_count: formData.attendees_count ? parseInt(formData.attendees_count) : 0
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
      console.error('Error creating event:', error);
      setError('An error occurred while creating the event.');
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
        console.error('Error deleting event:', error);
        setError('An error occurred while deleting the event.');
      }
    }
  };

  const handleToggleFeatured = async (event: Event) => {
    try {
      const updated = await EventsService.updateEvent(event.id, {
        is_featured: !event.is_featured
      });
      if (updated) {
        await loadEvents();
        await loadEventStats();
        await refreshContent();
        setSuccess(`Event ${event.is_featured ? 'unfeatured' : 'featured'} successfully!`);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (error) {
      console.error('Error toggling featured status:', error);
      setError('Failed to update event status.');
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
      console.error('Error toggling registration:', error);
      setError('Failed to update registration status.');
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
      max_participants: event.max_parameters?.toString() || '',
      registration_enabled: event.registration_enabled !== false,
      is_featured: event.is_featured,
      level: (event as any).level || '',
      type: (event as any).type || '',
      time: (event as any).time || '',
      room: (event as any).room || '',
      prerequisites: (event as any).prerequisites || '',
      what_youll_learn: (event as any).what_youll_learn || '',
      what_to_bring: (event as any).what_to_bring || '',
      schedule: (event as any).schedule || '',
      additional_info: (event as any).additional_info || '',
      contact_info: (event as any).contact_info || '',
      attendees_count: (event as any).attendees_count?.toString() || ''
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
        registration_enabled: formData.registration_enabled,
        is_featured: formData.is_featured,
        level: formData.level,
        type: formData.type,
        time: formData.time,
        room: formData.room,
        prerequisites: formData.prerequisites,
        what_youll_learn: formData.what_youll_learn,
        what_to_bring: formData.what_to_bring,
        schedule: formData.schedule,
        additional_info: formData.additional_info,
        contact_info: formData.contact_info,
        attendees_count: formData.attendees_count ? parseInt(formData.attendees_count) : 0
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
      console.error('Error updating event:', error);
      setError('An error occurred while updating the event.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewAttendance = async (event: Event) => {
    setSelectedEventForAttendance(event);
    setIsLoadingAttendance(true);
    setShowAttendanceModal(true);
    
    try {
      const attendeeData = await AttendanceService.getEventAttendees(event.id);
      setAttendees(attendeeData);
    } catch (error) {
      console.error('Error loading attendance:', error);
    } finally {
      setIsLoadingAttendance(false);
    }
  };

  const handleMarkAttendance = async (attendeeId: string, attended: boolean) => {
    try {
      const success = await AttendanceService.markAttendance(attendeeId, attended);
      if (success && selectedEventForAttendance) {
        // Refresh attendees list
        const updatedAttendees = await AttendanceService.getEventAttendees(selectedEventForAttendance.id);
        setAttendees(updatedAttendees);
        // Refresh event stats
        await loadEventStats();
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
    }
  };

  return (
    <AdminLayout
      title="Event Management"
      subtitle="Create and manage GDG events"
      icon={Calendar}
      actions={
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus size={16} />
          <span>Create Event</span>
        </button>
      }
    >

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-black rounded-xl p-6 shadow-sm border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <Calendar size={24} className="text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">{eventStats.total}</div>
          <div className="text-sm text-gray-400">Total Events</div>
        </div>
        
        <div className="bg-black rounded-xl p-6 shadow-sm border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <Users size={24} className="text-green-500" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">{eventStats.totalAttendees}</div>
          <div className="text-sm text-gray-400">Total Attendees</div>
        </div>
        
        <div className="bg-black rounded-xl p-6 shadow-sm border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <Calendar size={24} className="text-purple-500" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">{eventStats.upcoming}</div>
          <div className="text-sm text-gray-400">Upcoming Events</div>
        </div>
        
        <div className="bg-black rounded-xl p-6 shadow-sm border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <Calendar size={24} className="text-orange-500" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">{eventStats.past}</div>
          <div className="text-sm text-gray-400">Past Events</div>
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
      <div className="bg-black rounded-xl p-6 shadow-sm border border-gray-800 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search events by title, description, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white bg-black"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Filter size={16} className="text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white bg-black"
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
              className="px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white bg-black"
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
      <div className="bg-black rounded-xl shadow-sm border border-gray-800">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-white">Events ({filteredEvents.length})</h2>
        </div>
            
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading events...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No events yet</h3>
              <p className="text-gray-400 mb-6">Create your first event to get started</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Create Event
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map((event) => (
                <div key={event.id} className="border border-gray-800 rounded-lg p-6 hover:bg-gray-900 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold text-white">{event.title}</h3>
                        {event.is_featured && (
                          <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full font-medium">
                            Featured
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 mb-4">{event.description}</p>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-400">
                        <div className="flex items-center space-x-2">
                          <Calendar size={16} />
                          <span>{new Date(event.date).toLocaleDateString()} at {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin size={16} />
                          <span>{event.location}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          {event.registration_url && (
                            <div className="flex items-center space-x-2">
                              <ExternalLink size={16} />
                              <a href={event.registration_url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
                                External Registration
                              </a>
                            </div>
                          )}
                          {(event as any).google_form_url && (
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                              </svg>
                              <a href={(event as any).google_form_url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
                                Google Form
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleViewAttendance(event)}
                        className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-blue-400"
                        title="Manage Attendance"
                      >
                        <UserCheck size={18} />
                      </button>
                      <button 
                        onClick={() => handleToggleRegistration(event)}
                        className={`p-2 hover:bg-gray-800 rounded-lg transition-colors ${
                          event.registration_enabled ? 'text-green-400 hover:text-green-300' : 'text-gray-500 hover:text-gray-400'
                        }`}
                        title={event.registration_enabled ? 'Disable registration' : 'Enable registration'}
                      >
                        {event.registration_enabled ? <Eye size={18} /> : <EyeOff size={18} />}
                      </button>
                      <button 
                        onClick={() => handleToggleFeatured(event)}
                        className={`p-2 hover:bg-gray-800 rounded-lg transition-colors ${
                          event.is_featured ? 'text-yellow-400 hover:text-yellow-300' : 'text-gray-500 hover:text-gray-400'
                        }`}
                        title={event.is_featured ? 'Remove from featured' : 'Mark as featured'}
                      >
                        ⭐
                      </button>
                      <button 
                        onClick={() => handleEditEvent(event)}
                        className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-blue-400"
                        title="Edit Event"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteEvent(event.id)}
                        className="p-2 hover:bg-red-900/50 rounded-lg transition-colors text-gray-400 hover:text-red-400"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-black rounded-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto shadow-xl border border-gray-800">
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Create New Event</h2>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    resetForm();
                  }}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
              
            <form onSubmit={handleCreateEvent} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Event Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white bg-gray-900"
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
                  className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white bg-gray-900"
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
                    className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white bg-gray-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white bg-gray-900"
                    placeholder="Event location"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Image URL (optional)</label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white bg-gray-900"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Registration URL (optional)</label>
                  <input
                    type="url"
                    value={formData.registration_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, registration_url: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white bg-gray-900"
                    placeholder="https://eventbrite.com/event/..."
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Google Form URL (optional)</label>
                <input
                  type="url"
                  value={formData.google_form_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, google_form_url: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white bg-gray-900"
                  placeholder="https://forms.gle/... or https://docs.google.com/forms/..."
                />
                <p className="text-xs text-gray-400 mt-1">
                  Add a Google Form link for event registration. This will be used as an alternative registration method.
                </p>
              </div>

              {/* Registration Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Registration Type</label>
                  <select
                    value={formData.registration_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, registration_type: e.target.value as 'external' | 'internal' | 'both' }))}
                    className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white bg-gray-900"
                  >
                    <option value="both">Both External & Internal</option>
                    <option value="external">External Only</option>
                    <option value="internal">Internal Only</option>
                  </select>
                  <p className="text-xs text-gray-400 mt-1">
                    Choose which registration methods are available for this event.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Max Participants (optional)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.max_participants}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_participants: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white bg-gray-900"
                    placeholder="e.g., 50"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Set a maximum number of participants for this event.
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="registrationEnabled"
                    checked={formData.registration_enabled}
                    onChange={(e) => setFormData(prev => ({ ...prev, registration_enabled: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 bg-black border border-gray-700 rounded focus:ring-blue-400 focus:ring-2"
                  />
                  <label htmlFor="registrationEnabled" className="text-sm font-medium text-gray-300">Enable Registration</label>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 bg-black border border-gray-700 rounded focus:ring-blue-400 focus:ring-2"
                  />
                  <label htmlFor="featured" className="text-sm font-medium text-gray-300">Featured Event</label>
                </div>
              </div>
                
              <div className="flex space-x-3 pt-6">
              {error && (
                <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}
              
              <div className="flex space-x-3 pt-6 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    resetForm();
                  }}
                  className="flex-1 px-6 py-3 border border-gray-700 rounded-lg hover:bg-gray-900 transition-colors font-medium text-gray-300"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
      )}

      {/* Edit Event Modal */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-black rounded-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto shadow-xl border border-gray-800">
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Edit Event</h2>
                <button
                  onClick={() => {
                    setEditingEvent(null);
                    resetForm();
                  }}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleUpdateEvent} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Event Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white bg-gray-900"
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
                    className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white bg-gray-900"
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
                      className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white bg-gray-900"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
                    <input
                      type="text"
                      required
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white bg-gray-900"
                      placeholder="Event location"
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}
                
                <div className="flex space-x-3 pt-6 border-t border-gray-800">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingEvent(null);
                      resetForm();
                    }}
                    className="flex-1 px-6 py-3 border border-gray-700 rounded-lg hover:bg-gray-900 transition-colors font-medium text-gray-300"
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
      {/* Attendance Management Modal */}
      {showAttendanceModal && selectedEventForAttendance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-black rounded-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto shadow-xl border border-gray-800">
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">Attendance Management</h2>
                  <p className="text-gray-400 mt-1">{selectedEventForAttendance.title}</p>
                </div>
                <button
                  onClick={() => {
                    setShowAttendanceModal(false);
                    setSelectedEventForAttendance(null);
                    setAttendees([]);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>
              
            <div className="p-6">
              {isLoadingAttendance ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading attendance data...</p>
                </div>
              ) : attendees.length === 0 ? (
                <div className="text-center py-12">
                  <UserCheck size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No registrations yet</h3>
                  <p className="text-gray-400">Attendees will appear here once they register for the event.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-6">
                    <div className="text-sm text-gray-400">
                      Total Registrations: <span className="text-white font-medium">{attendees.length}</span>
                    </div>
                    <div className="text-sm text-gray-400">
                      Attended: <span className="text-green-400 font-medium">{attendees.filter(a => a.attended).length}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {attendees.map((attendee) => (
                      <div key={attendee.id} className="border border-gray-800 rounded-lg p-4 hover:bg-gray-900 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <h4 className="font-medium text-white">{attendee.attendee_name}</h4>
                              {attendee.attended && (
                                <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full font-medium">
                                  Attended
                                </span>
                              )}
                            </div>
                            <p className="text-gray-400 text-sm mt-1">{attendee.attendee_email}</p>
                            <p className="text-gray-500 text-xs mt-1">
                              Registered: {new Date(attendee.registration_date).toLocaleDateString()}
                              {attendee.check_in_time && (
                                <span className="ml-2">
                                  • Checked in: {new Date(attendee.check_in_time).toLocaleString()}
                                </span>
                              )}
                            </p>
                            {attendee.notes && (
                              <p className="text-gray-400 text-sm mt-2 italic">{attendee.notes}</p>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleMarkAttendance(attendee.id, !attendee.attended)}
                              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                attendee.attended
                                  ? 'bg-red-600 hover:bg-red-700 text-white'
                                  : 'bg-green-600 hover:bg-green-700 text-white'
                              }`}
                            >
                              {attendee.attended ? 'Mark Absent' : 'Mark Present'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminEvents;