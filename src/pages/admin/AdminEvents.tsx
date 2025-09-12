import React, { useState } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { useDev } from '@/contexts/DevContext';
import { useContent } from '@/contexts/ContentContext';
import { Navigate } from 'react-router-dom';
import { Calendar, Plus, Edit, Trash2, Users, MapPin, ExternalLink } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';

const AdminEvents = () => {
  const { isAuthenticated } = useAdmin();
  const { isDevelopmentMode, allowDirectAdminAccess } = useDev();
  const { events, refreshContent } = useContent();
  const [showCreateForm, setShowCreateForm] = useState(false);

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

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement event creation
    console.log('Creating event:', newEvent);
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
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <Calendar size={24} className="text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{events.length}</div>
          <div className="text-sm text-gray-600">Total Events</div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <Users size={24} className="text-green-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">247</div>
          <div className="text-sm text-gray-600">Total Attendees</div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <Calendar size={24} className="text-purple-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">3</div>
          <div className="text-sm text-gray-600">Upcoming Events</div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <Calendar size={24} className="text-orange-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">12</div>
          <div className="text-sm text-gray-600">Past Events</div>
        </div>
      </div>

      {/* Events List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">All Events</h2>
        </div>
            
        <div className="p-6">
          {events.length === 0 ? (
            <div className="text-center py-12">
              <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No events yet</h3>
              <p className="text-gray-600 mb-6">Create your first event to get started</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Create Event
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{event.title}</h3>
                      <p className="text-gray-600 mb-4">{event.description}</p>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Calendar size={16} />
                          <span>{new Date(event.date).toLocaleDateString()}</span>
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
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-900">
                        <Edit size={18} />
                      </button>
                      <button className="p-2 hover:bg-red-50 rounded-lg transition-colors text-gray-600 hover:text-red-600">
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
          <div className="bg-white rounded-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Create New Event</h2>
            </div>
              
            <form onSubmit={handleCreateEvent} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event Title</label>
                <input
                  type="text"
                  required
                  value={newEvent.title}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Enter event title"
                />
              </div>
                
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  required
                  rows={4}
                  value={newEvent.description}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Enter event description"
                />
              </div>
                
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={newEvent.date}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    required
                    value={newEvent.location}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="Event location"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Image URL (optional)</label>
                  <input
                    type="url"
                    value={newEvent.image_url}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, image_url: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Registration URL (optional)</label>
                  <input
                    type="url"
                    value={newEvent.registration_url}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, registration_url: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
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
                  className="w-4 h-4 text-blue-600 bg-white border border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <label htmlFor="featured" className="text-sm font-medium text-gray-700">Featured Event</label>
              </div>
                
              <div className="flex space-x-3 pt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
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