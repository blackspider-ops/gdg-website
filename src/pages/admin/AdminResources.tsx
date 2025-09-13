import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { useDev } from '@/contexts/DevContext';
import { Navigate } from 'react-router-dom';
import { BookOpen, Plus, Edit3, Trash2, ExternalLink, Search, Filter } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { ResourcesService, type Resource } from '@/services/resourcesService';

const AdminResources = () => {
  const { isAuthenticated } = useAdmin();
  const { isDevelopmentMode, allowDirectAdminAccess } = useDev();
  const [resources, setResources] = useState<Resource[]>([]);
  const [resourceStats, setResourceStats] = useState({
    total: 0,
    active: 0,
    typeDistribution: {} as Record<string, number>
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showAddResourceModal, setShowAddResourceModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const canAccess = isAuthenticated || (isDevelopmentMode && allowDirectAdminAccess);

  if (!canAccess) {
    return <Navigate to="/" replace />;
  }

  // Load resources and stats
  useEffect(() => {
    loadResources();
    loadResourceStats();
  }, []);

  const loadResources = async () => {
    setIsLoading(true);
    try {
      const resourcesData = await ResourcesService.getResources();
      setResources(resourcesData);
    } catch (error) {
      console.error('Error loading resources:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadResourceStats = async () => {
    try {
      const stats = await ResourcesService.getResourceStats();
      setResourceStats(stats);
    } catch (error) {
      console.error('Error loading resource stats:', error);
    }
  };

  // Form state
  const [newResource, setNewResource] = useState({
    title: '',
    description: '',
    type: 'study_jam' as Resource['type'],
    category: '',
    url: '',
    duration: '',
    level: 'Beginner' as Resource['level'],
    status: 'Available' as Resource['status'],
    provider: '',
    amount: '',
    requirements: [] as string[],
    materials: [] as string[],
    tags: [] as string[],
    speaker: '',
    icon: '',
    color: '',
    is_active: true,
    order_index: 0
  });

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || resource.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await ResourcesService.createResource(newResource);
      if (created) {
        await loadResources();
        await loadResourceStats();
        setShowAddResourceModal(false);
        setNewResource({
          title: '',
          description: '',
          type: 'study_jam',
          category: '',
          url: '',
          duration: '',
          level: 'Beginner',
          status: 'Available',
          provider: '',
          amount: '',
          requirements: [],
          materials: [],
          tags: [],
          speaker: '',
          icon: '',
          color: '',
          is_active: true,
          order_index: 0
        });
      }
    } catch (error) {
      console.error('Error creating resource:', error);
    }
  };

  const handleDeleteResource = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      try {
        const success = await ResourcesService.deleteResource(id);
        if (success) {
          await loadResources();
          await loadResourceStats();
        }
      } catch (error) {
        console.error('Error deleting resource:', error);
      }
    }
  };

  const resourceStatsDisplay = [
    { label: 'Total Resources', value: resourceStats.total.toString(), color: 'text-blue-500' },
    { label: 'Study Jams', value: (resourceStats.typeDistribution.study_jam || 0).toString(), color: 'text-green-500' },
    { label: 'Documentation', value: (resourceStats.typeDistribution.documentation || 0).toString(), color: 'text-purple-500' },
    { label: 'Recordings', value: (resourceStats.typeDistribution.recording || 0).toString(), color: 'text-orange-500' },
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'study_jam': return 'bg-green-100 text-green-800';
      case 'cloud_credit': return 'bg-blue-100 text-blue-800';
      case 'documentation': return 'bg-purple-100 text-purple-800';
      case 'recording': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AdminLayout
      title="Resource Management"
      subtitle="Manage learning resources, study jams, and documentation"
      icon={BookOpen}
      actions={
        <button 
          onClick={() => setShowAddResourceModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus size={16} />
          <span>Add Resource</span>
        </button>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {resourceStatsDisplay.map((stat, index) => (
          <div key={index} className="bg-black rounded-xl p-6 shadow-sm border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <BookOpen size={24} className={stat.color} />
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
            <div className="text-sm text-gray-400">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-black rounded-xl p-6 shadow-sm border border-gray-800 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search resources..."
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
              <option value="study_jam">Study Jams</option>
              <option value="cloud_credit">Cloud Credits</option>
              <option value="documentation">Documentation</option>
              <option value="recording">Recordings</option>
            </select>
          </div>
        </div>
      </div>

      {/* Resources List */}
      <div className="bg-black rounded-xl shadow-sm border border-gray-800">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-white">Resources ({filteredResources.length})</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {isLoading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading resources...</p>
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="p-6 text-center">
              <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No resources found</h3>
              <p className="text-gray-400">Try adjusting your search or filters</p>
            </div>
          ) : (
            filteredResources.map((resource) => (
              <div key={resource.id} className="p-6 hover:bg-gray-900 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{resource.title}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${getTypeColor(resource.type)}`}>
                        {resource.type.replace('_', ' ')}
                      </span>
                      {resource.status !== 'Available' && (
                        <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full font-medium">
                          {resource.status}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-400 mb-3">{resource.description}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      {resource.duration && (
                        <span>Duration: {resource.duration}</span>
                      )}
                      {resource.level && (
                        <span>Level: {resource.level}</span>
                      )}
                      {resource.provider && (
                        <span>Provider: {resource.provider}</span>
                      )}
                      {resource.speaker && (
                        <span>Speaker: {resource.speaker}</span>
                      )}
                      {resource.views && (
                        <span>Views: {resource.views}</span>
                      )}
                    </div>
                    
                    {(resource.tags && resource.tags.length > 0) && (
                      <div className="flex items-center space-x-2 mt-3">
                        {resource.tags.map((tag, index) => (
                          <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-400 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {resource.url && (
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-blue-600"
                      >
                        <ExternalLink size={16} />
                      </a>
                    )}
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-white">
                      <Edit3 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteResource(resource.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors text-gray-400 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Resource Modal */}
      {showAddResourceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-black rounded-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto shadow-xl border border-gray-800">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-xl font-semibold text-white">Add New Resource</h2>
            </div>
            
            <form onSubmit={handleCreateResource} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                  <input
                    type="text"
                    required
                    value={newResource.title}
                    onChange={(e) => setNewResource(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white bg-black"
                    placeholder="Resource title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                  <select
                    value={newResource.type}
                    onChange={(e) => setNewResource(prev => ({ ...prev, type: e.target.value as Resource['type'] }))}
                    className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white bg-black"
                  >
                    <option value="study_jam">Study Jam</option>
                    <option value="cloud_credit">Cloud Credit</option>
                    <option value="documentation">Documentation</option>
                    <option value="recording">Recording</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  required
                  rows={3}
                  value={newResource.description}
                  onChange={(e) => setNewResource(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white bg-black"
                  placeholder="Resource description"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">URL (optional)</label>
                  <input
                    type="url"
                    value={newResource.url}
                    onChange={(e) => setNewResource(prev => ({ ...prev, url: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white bg-black"
                    placeholder="https://example.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Duration (optional)</label>
                  <input
                    type="text"
                    value={newResource.duration}
                    onChange={(e) => setNewResource(prev => ({ ...prev, duration: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white bg-black"
                    placeholder="e.g., 8 weeks, 1h 30m"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 pt-6">
                <button
                  type="button"
                  onClick={() => setShowAddResourceModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-700 rounded-lg hover:bg-gray-900 transition-colors font-medium text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Add Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminResources;