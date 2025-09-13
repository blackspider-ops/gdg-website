import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { useDev } from '@/contexts/DevContext';
import { useContent } from '@/contexts/ContentContext';
import { Navigate } from 'react-router-dom';
import { Calendar, Plus, Edit, Trash2, Users, MapPin, ExternalLink } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { EventsService, type Event } from '@/services/eventsService';

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
  const [isLoading, setIsLoading] = useState(true);

  const canAccess = isAuthenticated || (isDevelopmentMode && allowDirectAdminAccess);

  if (!canAccess) {
    return <Navigate to="/" replace />;
  }

  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    image_url: '',
    registration_url: '',
    is_featured: false
  });

  // Load events and stats
  useEffect(() => {
    loadEvents();
    loadEventStats();
  }, []);

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

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await EventsService.createEvent(newEvent);
      if (created) {
        await loadEvents();
        await loadEventStats();
        await refreshContent(); // Refresh the global content context
        setShowCreateForm(false);
        setNewEvent({
          title: '',
          description: '',
          date: '',
          location: '',
          image_url: '',
          registration_url: '',
          is_featured: false
        });
      }
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        const success = await EventsService.deleteEvent(id);
        if (success) {
          await loadEvents();
          await loadEventStats();
          await refreshContent();
        }
      } catch (error) {
        console.error('Error deleting event:', error);
      }
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

      {/* Events List */}
      <div className="bg-black rounded-xl shadow-sm border border-gray-800">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-white">All Events</h2>
        </div>
            
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading events...</p>
            </div>
          ) : events.length === 0 ? (
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
              {events.map((event) => (
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
                        {event.registration_url && (
                          <div className="flex items-center space-x-2">
                            <ExternalLink size={16} />
                            <a href={event.registration_url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
                              Register
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-white">
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteEvent(event.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors text-gray-400 hover:text-red-600"
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
          <div className="bg-black rounded-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto shadow-xl border border-gray-800">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-xl font-semibold text-white">Create New Event</h2>
            </div>
              
            <form onSubmit={handleCreateEvent} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Event Title</label>
                <input
                  type="text"
                  required
                  value={newEvent.title}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white"
                  placeholder="Enter event title"
                />
              </div>
                
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  required
                  rows={4}
                  value={newEvent.description}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white"
                  placeholder="Enter event description"
                />
              </div>
                
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={newEvent.date}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
                  <input
                    type="text"
                    required
                    value={newEvent.location}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white"
                    placeholder="Event location"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Image URL (optional)</label>
                  <input
                    type="url"
                    value={newEvent.image_url}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, image_url: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Registration URL (optional)</label>
                  <input
                    type="url"
                    value={newEvent.registration_url}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, registration_url: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white"
                    placeholder="https://example.com/register"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="featured"
                  checked={newEvent.is_featured}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, is_featured: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 bg-black border border-gray-700 rounded focus:ring-blue-400 focus:ring-2"
                />
                <label htmlFor="featured" className="text-sm font-medium text-gray-300">Featured Event</label>
              </div>
                
              <div className="flex space-x-3 pt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-6 py-3 border border-gray-700 rounded-lg hover:bg-gray-900 transition-colors font-medium text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminEvents;