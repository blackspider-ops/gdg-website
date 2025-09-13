import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { Navigate } from 'react-router-dom';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { BookOpen, Plus, Edit3, Trash2, ExternalLink, Search, Filter, Save, X, Eye, EyeOff, ArrowUp, ArrowDown } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { ResourcesService, type Resource } from '@/services/resourcesService';

const AdminResources = () => {
  const { isAuthenticated } = useAdmin();
  const [resources, setResources] = useState<Resource[]>([]);
  const [resourceStats, setResourceStats] = useState({
    total: 0,
    active: 0,
    typeDistribution: {} as Record<string, number>
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddResourceModal, setShowAddResourceModal] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [togglingResourceId, setTogglingResourceId] = useState<string | null>(null);

  // Lock body scroll when modal is open
  useBodyScrollLock(showAddResourceModal || !!editingResource);

  

  if (!isAuthenticated) {
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
    } finally {
      setIsLoading(false);
    }
  };

  const loadResourceStats = async () => {
    try {
      const stats = await ResourcesService.getResourceStats();
      setResourceStats(stats);
    } catch (error) {
    }
  };

  // Form state
  const [formData, setFormData] = useState({
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

  // Form helpers
  const [requirementInput, setRequirementInput] = useState('');
  const [materialInput, setMaterialInput] = useState('');
  const [tagInput, setTagInput] = useState('');

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.speaker?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || resource.type === filterType;
    const matchesStatus = filterStatus === 'all' || resource.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const resetForm = () => {
    setFormData({
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
    setRequirementInput('');
    setMaterialInput('');
    setTagInput('');
    setError(null);
    setSuccess(null);
  };

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    
    try {
      const created = await ResourcesService.createResource(formData);
      if (created) {
        await loadResources();
        await loadResourceStats();
        setShowAddResourceModal(false);
        resetForm();
        setSuccess('Resource created successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Failed to create resource. Please try again.');
      }
    } catch (error) {
      setError('An error occurred while creating the resource.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditResource = (resource: Resource) => {
    setFormData({
      title: resource.title,
      description: resource.description,
      type: resource.type,
      category: resource.category || '',
      url: resource.url || '',
      duration: resource.duration || '',
      level: resource.level || 'Beginner',
      status: resource.status,
      provider: resource.provider || '',
      amount: resource.amount || '',
      requirements: resource.requirements || [],
      materials: resource.materials || [],
      tags: resource.tags || [],
      speaker: resource.speaker || '',
      icon: resource.icon || '',
      color: resource.color || '',
      is_active: resource.is_active,
      order_index: resource.order_index
    });
    setEditingResource(resource);
    setError(null);
    setSuccess(null);
  };

  const handleUpdateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResource) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      const updated = await ResourcesService.updateResource(editingResource.id, formData);
      if (updated) {
        await loadResources();
        await loadResourceStats();
        setEditingResource(null);
        resetForm();
        setSuccess('Resource updated successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Failed to update resource. Please try again.');
      }
    } catch (error) {
      setError('An error occurred while updating the resource.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (resource: Resource) => {
    setTogglingResourceId(resource.id);
    
    // Optimistic update - update UI immediately
    const optimisticResources = resources.map(r => 
      r.id === resource.id 
        ? { ...r, is_active: !r.is_active }
        : r
    );
    setResources(optimisticResources);

    try {
      const updated = await ResourcesService.toggleActive(resource.id);
      if (updated) {
        // Update with server response to ensure consistency
        const serverResources = resources.map(r => 
          r.id === resource.id ? updated : r
        );
        setResources(serverResources);
        await loadResourceStats();
        setSuccess(`Resource ${resource.is_active ? 'deactivated' : 'activated'} successfully!`);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        // Revert optimistic update on failure
        setResources(resources);
        setError('Failed to update resource status.');
      }
    } catch (error) {
      // Revert optimistic update on error
      setResources(resources);
      setError('Failed to update resource status.');
    } finally {
      setTogglingResourceId(null);
    }
  };

  const handleMoveResource = async (resource: Resource, direction: 'up' | 'down') => {
    const currentIndex = resources.findIndex(r => r.id === resource.id);
    if (currentIndex === -1) return;
    
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= resources.length) return;
    
    const targetResource = resources[targetIndex];
    
    try {
      await Promise.all([
        ResourcesService.updateResource(resource.id, { order_index: targetResource.order_index }),
        ResourcesService.updateResource(targetResource.id, { order_index: resource.order_index })
      ]);
      
      await loadResources();
      setSuccess('Resource order updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError('Failed to update resource order.');
    }
  };

  const handleDeleteResource = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this resource? This action cannot be undone.')) {
      try {
        const success = await ResourcesService.deleteResource(id);
        if (success) {
          await loadResources();
          await loadResourceStats();
          setSuccess('Resource deleted successfully!');
          setTimeout(() => setSuccess(null), 3000);
        } else {
          setError('Failed to delete resource. Please try again.');
        }
      } catch (error) {
        setError('An error occurred while deleting the resource.');
      }
    }
  };

  // Array management helpers
  const addRequirement = () => {
    if (requirementInput.trim()) {
      setFormData(prev => ({
        ...prev,
        requirements: [...prev.requirements, requirementInput.trim()]
      }));
      setRequirementInput('');
    }
  };

  const removeRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }));
  };

  const addMaterial = () => {
    if (materialInput.trim()) {
      setFormData(prev => ({
        ...prev,
        materials: [...prev.materials, materialInput.trim()]
      }));
      setMaterialInput('');
    }
  };

  const removeMaterial = (index: number) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index)
    }));
  };

  const addTag = () => {
    if (tagInput.trim()) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const resourceStatsDisplay = [
    { label: 'Total Resources', value: resourceStats.total.toString(), color: 'text-blue-500' },
    { label: 'Active Resources', value: resourceStats.active.toString(), color: 'text-green-500' },
    { label: 'Study Jams', value: (resourceStats.typeDistribution.study_jam || 0).toString(), color: 'text-purple-500' },
    { label: 'Cloud Credits', value: (resourceStats.typeDistribution.cloud_credit || 0).toString(), color: 'text-orange-500' },
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
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          <Plus size={16} />
          <span>Add Resource</span>
        </button>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {resourceStatsDisplay.map((stat, index) => (
          <div key={index} className="bg-card rounded-xl p-6 shadow-sm border border-border">
            <div className="flex items-center justify-between mb-4">
              <BookOpen size={24} className={stat.color} />
            </div>
            <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </div>
        ))}
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
                placeholder="Search resources by title, description, category, or speaker..."
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
              <option value="study_jam">Study Jams</option>
              <option value="cloud_credit">Cloud Credits</option>
              <option value="documentation">Documentation</option>
              <option value="recording">Recordings</option>
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground bg-card"
            >
              <option value="all">All Status</option>
              <option value="Available">Available</option>
              <option value="Coming Soon">Coming Soon</option>
              <option value="Archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Resources List */}
      <div className="bg-card rounded-xl shadow-sm border border-border">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Resources ({filteredResources.length})</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {isLoading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading resources...</p>
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="p-6 text-center">
              <BookOpen size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No resources found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filters</p>
            </div>
          ) : (
            filteredResources.map((resource) => (
              <div key={resource.id} className="p-6 hover:bg-muted transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-foreground">{resource.title}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${getTypeColor(resource.type)}`}>
                        {resource.type.replace('_', ' ')}
                      </span>
                      {resource.status !== 'Available' && (
                        <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full font-medium">
                          {resource.status}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-muted-foreground mb-3">{resource.description}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
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
                          <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-muted-foreground rounded-full">
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
                        className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-muted-foreground hover:text-blue-400"
                        title="Open resource"
                      >
                        <ExternalLink size={16} />
                      </a>
                    )}
                    <button 
                      onClick={() => handleToggleActive(resource)}
                      disabled={togglingResourceId === resource.id}
                      className={`p-2 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        resource.is_active ? 'text-green-400 hover:text-green-300' : 'text-muted-foreground hover:text-muted-foreground'
                      }`}
                      title={resource.is_active ? 'Deactivate resource' : 'Activate resource'}
                    >
                      {togglingResourceId === resource.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      ) : resource.is_active ? (
                        <Eye size={16} />
                      ) : (
                        <EyeOff size={16} />
                      )}
                    </button>
                    <button 
                      onClick={() => handleMoveResource(resource, 'up')}
                      disabled={resources.findIndex(r => r.id === resource.id) === 0}
                      className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Move up"
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button 
                      onClick={() => handleMoveResource(resource, 'down')}
                      disabled={resources.findIndex(r => r.id === resource.id) === resources.length - 1}
                      className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Move down"
                    >
                      <ArrowDown size={16} />
                    </button>
                    <button 
                      onClick={() => handleEditResource(resource)}
                      className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-muted-foreground hover:text-blue-400"
                      title="Edit resource"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteResource(resource.id)}
                      className="p-2 hover:bg-red-900/50 rounded-lg transition-colors text-muted-foreground hover:text-red-400"
                      title="Delete resource"
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

      {/* Add/Edit Resource Modal */}
      {(showAddResourceModal || editingResource) && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-card/50"
          style={{ 
            overflow: 'hidden',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}
          onWheel={(e) => e.preventDefault()}
          onTouchMove={(e) => e.preventDefault()}
          onScroll={(e) => e.preventDefault()}
        >
          <div 
            className="bg-card rounded-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto shadow-xl border border-border"
            onClick={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">
                  {editingResource ? 'Edit Resource' : 'Add New Resource'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddResourceModal(false);
                    setEditingResource(null);
                    resetForm();
                  }}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <form onSubmit={editingResource ? handleUpdateResource : handleCreateResource} className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground">Basic Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Title *</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground bg-card"
                      placeholder="Resource title"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Type *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as Resource['type'] }))}
                      className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground bg-card"
                    >
                      <option value="study_jam">Study Jam</option>
                      <option value="cloud_credit">Cloud Credit</option>
                      <option value="documentation">Documentation</option>
                      <option value="recording">Recording</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description *</label>
                  <textarea
                    required
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground bg-card"
                    placeholder="Resource description"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground bg-card"
                      placeholder="e.g., Android, Cloud, ML"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Level</label>
                    <select
                      value={formData.level}
                      onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value as Resource['level'] }))}
                      className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground bg-card"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as Resource['status'] }))}
                      className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground bg-card"
                    >
                      <option value="Available">Available</option>
                      <option value="Coming Soon">Coming Soon</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Links and Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground">Links and Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">URL</label>
                    <input
                      type="url"
                      value={formData.url}
                      onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                      className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground bg-card"
                      placeholder="https://example.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Duration</label>
                    <input
                      type="text"
                      value={formData.duration}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                      className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground bg-card"
                      placeholder="e.g., 8 weeks, 1h 30m"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Provider</label>
                    <input
                      type="text"
                      value={formData.provider}
                      onChange={(e) => setFormData(prev => ({ ...prev, provider: e.target.value }))}
                      className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground bg-card"
                      placeholder="e.g., Google Cloud, Firebase"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Amount/Value</label>
                    <input
                      type="text"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                      className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground bg-card"
                      placeholder="e.g., $300, Free"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Speaker</label>
                    <input
                      type="text"
                      value={formData.speaker}
                      onChange={(e) => setFormData(prev => ({ ...prev, speaker: e.target.value }))}
                      className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground bg-card"
                      placeholder="For recordings"
                    />
                  </div>
                </div>
              </div>

              {/* Arrays */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground">Additional Information</h3>
                
                {/* Requirements */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Requirements</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={requirementInput}
                      onChange={(e) => setRequirementInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                      className="flex-1 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground bg-card"
                      placeholder="Add a requirement"
                    />
                    <button
                      type="button"
                      onClick={addRequirement}
                      className="px-4 py-2 bg-primary text-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.requirements.map((req, index) => (
                      <span key={index} className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm flex items-center gap-2">
                        {req}
                        <button
                          type="button"
                          onClick={() => removeRequirement(index)}
                          className="text-muted-foreground hover:text-red-400"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Materials */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Materials</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={materialInput}
                      onChange={(e) => setMaterialInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMaterial())}
                      className="flex-1 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground bg-card"
                      placeholder="Add a material"
                    />
                    <button
                      type="button"
                      onClick={addMaterial}
                      className="px-4 py-2 bg-primary text-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.materials.map((material, index) => (
                      <span key={index} className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm flex items-center gap-2">
                        {material}
                        <button
                          type="button"
                          onClick={() => removeMaterial(index)}
                          className="text-muted-foreground hover:text-red-400"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      className="flex-1 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground bg-card"
                      placeholder="Add a tag"
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      className="px-4 py-2 bg-primary text-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <span key={index} className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm flex items-center gap-2">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(index)}
                          className="text-muted-foreground hover:text-red-400"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Display Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground">Display Settings</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Icon</label>
                    <input
                      type="text"
                      value={formData.icon}
                      onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                      className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground bg-card"
                      placeholder="e.g., Smartphone, Cloud, Brain"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Color</label>
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground bg-card"
                      placeholder="e.g., text-primary"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Order Index</label>
                    <input
                      type="number"
                      value={formData.order_index}
                      onChange={(e) => setFormData(prev => ({ ...prev, order_index: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground bg-card"
                      placeholder="0"
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="w-4 h-4 text-primary bg-card border-border rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-gray-300">
                    Active (visible on frontend)
                  </label>
                </div>
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
                    setShowAddResourceModal(false);
                    setEditingResource(null);
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
                      {editingResource ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Save size={16} className="mr-2" />
                      {editingResource ? 'Update Resource' : 'Create Resource'}
                    </>
                  )}
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