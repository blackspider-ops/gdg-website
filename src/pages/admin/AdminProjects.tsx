import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { Navigate } from 'react-router-dom';
import { 
  Folder, 
  Search, 
  Filter, 
  Plus, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  Github, 
  Star, 
  Calendar,
  Users,
  Code,
  Tag,
  Eye,
  Settings
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { ProjectsService, type Project, type ProjectStats } from '@/services/projectsService';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { supabase } from '@/lib/supabase';
import { OptimizedContentService } from '@/services/optimizedContentService';

const AdminProjects = () => {
  const { isAuthenticated } = useAdmin();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectStats, setProjectStats] = useState<ProjectStats>({
    total: 0,
    active: 0,
    completed: 0,
    featured: 0,
    categoryDistribution: {},
    statusDistribution: {},
    techStackUsage: {}
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Lock body scroll when modal is open
  useBodyScrollLock(showAddProjectModal || !!editingProject);

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Load projects and stats
  useEffect(() => {
    loadProjects();
    loadProjectStats();
  }, []);

  const loadProjects = async (bypassCache = false) => {
    setIsLoading(true);
    try {
      const projectsData = await ProjectsService.getAllProjects();
      setProjects(projectsData);
    } catch (error) {
      console.error('Failed to load projects:', error);
      setError('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  const loadProjectStats = async () => {
    try {
      const stats = await ProjectsService.getProjectStats();
      setProjectStats(stats);
    } catch (error) {
      console.error('Failed to load project stats:', error);
    }
  };

  // Form state
  const [projectForm, setProjectForm] = useState({
    title: '',
    description: '',
    short_description: '',
    image_url: '',
    github_url: '',
    demo_url: '',
    tech_stack: [] as string[],
    category: 'web',
    status: 'active',
    difficulty_level: 'intermediate',
    team_size: 1,
    start_date: '',
    end_date: '',
    is_featured: false,
    is_open_source: true,
    tags: [] as string[]
  });

  // Common categories and tech stack options
  const commonCategories = ['web', 'mobile', 'ai', 'data', 'backend', 'devops', 'design', 'other'];
  const existingCategories = Array.from(new Set(projects.map(p => p.category).filter(Boolean)));
  const allCategories = Array.from(new Set([...commonCategories, ...existingCategories]));
  const statuses = ['active', 'completed', 'on_hold', 'archived'];
  const difficultyLevels = ['beginner', 'intermediate', 'advanced'];
  const commonTechStack = [
    'React', 'TypeScript', 'JavaScript', 'Python', 'Java', 'Flutter', 'Dart',
    'Node.js', 'Express', 'MongoDB', 'PostgreSQL', 'Firebase', 'Supabase',
    'TensorFlow', 'PyTorch', 'Docker', 'Kubernetes', 'AWS', 'GCP',
    'Tailwind CSS', 'Material-UI', 'Bootstrap', 'Figma', 'Adobe XD'
  ];

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.tech_stack.some(tech => tech.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || project.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || project.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    
    try {
      const created = await ProjectsService.createProject(projectForm);
      if (created) {
        // Clear projects cache so public page gets fresh data
        OptimizedContentService.invalidateCache('projects');
        OptimizedContentService.clearProjectsCache();
        
        await loadProjects();
        await loadProjectStats();
        setShowAddProjectModal(false);
        resetForm();
        setSuccess('Project created successfully!');
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError('Failed to create project. Please try again.');
      }
    } catch (error) {
      setError('An error occurred while creating the project.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      const updated = await ProjectsService.updateProject(editingProject.id, projectForm);
      
      if (updated) {
        // Clear projects cache so public page gets fresh data
        OptimizedContentService.invalidateCache('projects');
        OptimizedContentService.clearProjectsCache();
        
        // Immediately update UI with the updated project
        setProjects(prev => prev.map(p => p.id === editingProject.id ? updated : p));
        
        // Then reload to ensure consistency
        await loadProjects(true);
        await loadProjectStats();
        setEditingProject(null);
        resetForm();
        setSuccess('Project updated successfully!');
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError('Failed to update project. Please try again.');
      }
    } catch (error) {
      console.error('Update error:', error);
      setError(`An error occurred while updating the project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        const success = await ProjectsService.deleteProject(id);
        
        if (success) {
          // Clear projects cache so public page gets fresh data
          OptimizedContentService.invalidateCache('projects');
          OptimizedContentService.clearProjectsCache();
          
          // Immediately update UI by removing the project
          setProjects(prev => prev.filter(p => p.id !== id));
          
          // Then reload to ensure consistency
          await loadProjects(true);
          await loadProjectStats();
          setSuccess('Project deleted successfully!');
          setTimeout(() => setSuccess(null), 5000);
        } else {
          setError('Failed to delete project. Please try again.');
        }
      } catch (error) {
        console.error('Delete error:', error);
        setError(`An error occurred while deleting the project: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setProjectForm({
      title: project.title,
      description: project.description || '',
      short_description: project.short_description || '',
      image_url: project.image_url || '',
      github_url: project.github_url || '',
      demo_url: project.demo_url || '',
      tech_stack: project.tech_stack,
      category: project.category,
      status: project.status,
      difficulty_level: project.difficulty_level,
      team_size: project.team_size,
      start_date: project.start_date || '',
      end_date: project.end_date || '',
      is_featured: project.is_featured,
      is_open_source: project.is_open_source,
      tags: project.tags
    });
  };

  const resetForm = () => {
    setProjectForm({
      title: '',
      description: '',
      short_description: '',
      image_url: '',
      github_url: '',
      demo_url: '',
      tech_stack: [],
      category: 'web',
      status: 'active',
      difficulty_level: 'intermediate',
      team_size: 1,
      start_date: '',
      end_date: '',
      is_featured: false,
      is_open_source: true,
      tags: []
    });
    setError(null);
    setSuccess(null);
  };

  const handleTechStackChange = (tech: string) => {
    setProjectForm(prev => ({
      ...prev,
      tech_stack: prev.tech_stack.includes(tech)
        ? prev.tech_stack.filter(t => t !== tech)
        : [...prev.tech_stack, tech]
    }));
  };

  const handleTagsChange = (tag: string) => {
    setProjectForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-900/20 text-green-400';
      case 'completed': return 'bg-blue-900/20 text-blue-400';
      case 'on_hold': return 'bg-yellow-900/20 text-yellow-400';
      case 'archived': return 'bg-gray-900/20 text-gray-400';
      default: return 'bg-gray-900/20 text-gray-400';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-900/20 text-green-400';
      case 'intermediate': return 'bg-yellow-900/20 text-yellow-400';
      case 'advanced': return 'bg-red-900/20 text-red-400';
      default: return 'bg-gray-900/20 text-gray-400';
    }
  };

  const projectStatsDisplay = [
    { label: 'Total Projects', value: projectStats.total.toString(), color: 'text-blue-500' },
    { label: 'Active Projects', value: projectStats.active.toString(), color: 'text-green-500' },
    { label: 'Completed Projects', value: projectStats.completed.toString(), color: 'text-purple-500' },
    { label: 'Featured Projects', value: projectStats.featured.toString(), color: 'text-orange-500' },
  ];

  return (
    <AdminLayout
      title="Projects Management"
      subtitle="Manage GDG projects, tech stacks, and team assignments"
      icon={Folder}
      actions={
        <button 
          onClick={() => {
            resetForm();
            setShowAddProjectModal(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          <Plus size={16} />
          <span>Add Project</span>
        </button>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {projectStatsDisplay.map((stat, index) => (
          <div key={index} className="bg-card rounded-xl p-6 shadow-sm border border-border">
            <div className="flex items-center justify-between mb-4">
              <Folder size={24} className={stat.color} />
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

      {/* Category Distribution */}
      <div className="bg-card rounded-xl p-6 shadow-sm border border-border mb-8">
        <h3 className="text-lg font-semibold text-foreground mb-4">Category Distribution</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(projectStats.categoryDistribution).map(([category, count]) => (
            <div key={category} className="border border-border rounded-lg p-4 hover:bg-muted transition-colors">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-foreground capitalize">{category}</h4>
                <span className="text-sm font-medium text-primary">{count} project{count !== 1 ? 's' : ''}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl p-6 shadow-sm border border-border mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground bg-card"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Filter size={16} className="text-muted-foreground" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground bg-card"
            >
              <option value="all">All Categories</option>
              {allCategories.map(category => (
                <option key={category} value={category} className="capitalize">{category}</option>
              ))}
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground bg-card"
            >
              <option value="all">All Statuses</option>
              {statuses.map(status => (
                <option key={status} value={status} className="capitalize">{status.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Projects List */}
      <div className="bg-card rounded-xl shadow-sm border border-border">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Projects ({filteredProjects.length})</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {isLoading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading projects...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="p-6 text-center">
              <Folder size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No projects found</h3>
              <p className="text-muted-foreground">Try adjusting your search or add your first project</p>
            </div>
          ) : (
            filteredProjects.map((project) => (
              <div key={project.id} className="p-6 hover:bg-muted transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-foreground">{project.title}</h3>
                      {project.is_featured && (
                        <Star size={16} className="text-yellow-400 fill-current" />
                      )}
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(project.status)}`}>
                        {project.status.replace('_', ' ')}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${getDifficultyColor(project.difficulty_level)}`}>
                        {project.difficulty_level}
                      </span>
                      <span className="px-2 py-1 text-xs bg-blue-900/20 text-blue-400 rounded-full font-medium capitalize">
                        {project.category}
                      </span>
                    </div>
                    
                    {project.short_description && (
                      <p className="text-muted-foreground mb-3 line-clamp-2">{project.short_description}</p>
                    )}
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      {project.tech_stack.slice(0, 5).map((tech, index) => (
                        <span key={index} className="px-2 py-1 text-xs bg-gray-800 text-gray-300 rounded font-mono">
                          {tech}
                        </span>
                      ))}
                      {project.tech_stack.length > 5 && (
                        <span className="px-2 py-1 text-xs bg-gray-800 text-gray-300 rounded">
                          +{project.tech_stack.length - 5} more
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Users size={14} />
                        <span>Team: {project.team_size}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar size={14} />
                        <span>Created: {new Date(project.created_at).toLocaleDateString()}</span>
                      </div>
                      {(project.github_url || project.demo_url) && (
                        <div className="flex items-center space-x-2">
                          {project.github_url && (
                            <a href={project.github_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-blue-800">
                              <Github size={16} />
                            </a>
                          )}
                          {project.demo_url && (
                            <a href={project.demo_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-blue-800">
                              <ExternalLink size={16} />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button 
                      onClick={() => handleEditProject(project)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteProject(project.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors text-muted-foreground hover:text-red-600"
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
    
  {/* Add/Edit Project Modal */}
      {(showAddProjectModal || editingProject) && (
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
              setShowAddProjectModal(false);
              setEditingProject(null);
            }
          }}
          onWheel={(e) => e.preventDefault()}
          onTouchMove={(e) => e.preventDefault()}
          onScroll={(e) => e.preventDefault()}
        >
          <div 
            className="bg-card rounded-xl shadow-xl border border-border w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            {/* Fixed Header */}
            <div className="flex-shrink-0 p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">
                {editingProject ? 'Edit Project' : 'Add New Project'}
              </h2>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <form onSubmit={editingProject ? handleUpdateProject : handleCreateProject} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-foreground">Basic Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Project Title *</label>
                      <input
                        type="text"
                        required
                        value={projectForm.title}
                        onChange={(e) => setProjectForm(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground bg-card"
                        placeholder="Amazing Project Name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Category *
                        <span className="text-xs text-muted-foreground ml-2">(Select existing or type custom)</span>
                      </label>
                      <input
                        type="text"
                        required
                        list="categories"
                        value={projectForm.category}
                        onChange={(e) => setProjectForm(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground bg-card"
                        placeholder="Select from dropdown or type custom category"
                      />
                      <datalist id="categories">
                        {allCategories.map(category => (
                          <option key={category} value={category} />
                        ))}
                      </datalist>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Short Description</label>
                    <input
                      type="text"
                      value={projectForm.short_description}
                      onChange={(e) => setProjectForm(prev => ({ ...prev, short_description: e.target.value }))}
                      className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground bg-card"
                      placeholder="Brief one-line description for cards and previews"
                      maxLength={500}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Full Description</label>
                    <textarea
                      rows={4}
                      value={projectForm.description}
                      onChange={(e) => setProjectForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground bg-card"
                      placeholder="Detailed description of the project, its goals, and features..."
                    />
                  </div>
                </div>

                {/* Project Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-foreground">Project Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Status *</label>
                      <select
                        required
                        value={projectForm.status}
                        onChange={(e) => setProjectForm(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground bg-card"
                      >
                        {statuses.map(status => (
                          <option key={status} value={status} className="capitalize">{status.replace('_', ' ')}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty Level *</label>
                      <select
                        required
                        value={projectForm.difficulty_level}
                        onChange={(e) => setProjectForm(prev => ({ ...prev, difficulty_level: e.target.value }))}
                        className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground bg-card"
                      >
                        {difficultyLevels.map(level => (
                          <option key={level} value={level} className="capitalize">{level}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Team Size</label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={projectForm.team_size}
                        onChange={(e) => setProjectForm(prev => ({ ...prev, team_size: parseInt(e.target.value) || 1 }))}
                        className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground bg-card"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
                      <input
                        type="date"
                        value={projectForm.start_date}
                        onChange={(e) => setProjectForm(prev => ({ ...prev, start_date: e.target.value }))}
                        className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground bg-card"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">End Date</label>
                      <input
                        type="date"
                        value={projectForm.end_date}
                        onChange={(e) => setProjectForm(prev => ({ ...prev, end_date: e.target.value }))}
                        className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground bg-card"
                      />
                    </div>
                  </div>
                </div>

                {/* Links */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-foreground">Links & Resources</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">GitHub URL</label>
                      <input
                        type="url"
                        value={projectForm.github_url}
                        onChange={(e) => setProjectForm(prev => ({ ...prev, github_url: e.target.value }))}
                        className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground bg-card"
                        placeholder="https://github.com/username/repo"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Demo URL</label>
                      <input
                        type="url"
                        value={projectForm.demo_url}
                        onChange={(e) => setProjectForm(prev => ({ ...prev, demo_url: e.target.value }))}
                        className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground bg-card"
                        placeholder="https://demo.example.com"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Project Image URL</label>
                    <input
                      type="url"
                      value={projectForm.image_url}
                      onChange={(e) => setProjectForm(prev => ({ ...prev, image_url: e.target.value }))}
                      className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground bg-card"
                      placeholder="https://example.com/project-screenshot.jpg"
                    />
                  </div>
                </div>

                {/* Tech Stack */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-foreground">Tech Stack</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {commonTechStack.map(tech => (
                      <label key={tech} className="flex items-center space-x-2 p-2 border border-border rounded-lg hover:bg-muted transition-colors cursor-pointer">
                        <input
                          type="checkbox"
                          checked={projectForm.tech_stack.includes(tech)}
                          onChange={() => handleTechStackChange(tech)}
                          className="w-4 h-4 text-primary bg-card border border-border rounded focus:ring-blue-400 focus:ring-2"
                        />
                        <span className="text-sm text-foreground">{tech}</span>
                      </label>
                    ))}
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Add custom technology (press Enter)"
                      className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground bg-card"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const value = (e.target as HTMLInputElement).value.trim();
                          if (value && !projectForm.tech_stack.includes(value)) {
                            setProjectForm(prev => ({ ...prev, tech_stack: [...prev.tech_stack, value] }));
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                    />
                  </div>
                  {projectForm.tech_stack.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {projectForm.tech_stack.map(tech => (
                        <span key={tech} className="px-3 py-1 bg-primary text-foreground rounded-full text-sm flex items-center space-x-2">
                          <span>{tech}</span>
                          <button
                            type="button"
                            onClick={() => handleTechStackChange(tech)}
                            className="text-foreground hover:text-red-300"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-foreground">Tags</h3>
                  <div>
                    <input
                      type="text"
                      placeholder="Add tags (press Enter to add)"
                      className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-foreground bg-card"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const value = (e.target as HTMLInputElement).value.trim().toLowerCase();
                          if (value && !projectForm.tags.includes(value)) {
                            setProjectForm(prev => ({ ...prev, tags: [...prev.tags, value] }));
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                    />
                  </div>
                  {projectForm.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {projectForm.tags.map(tag => (
                        <span key={tag} className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm flex items-center space-x-2">
                          <span>{tag}</span>
                          <button
                            type="button"
                            onClick={() => handleTagsChange(tag)}
                            className="text-gray-300 hover:text-red-300"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Options */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-foreground">Options</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="is_featured"
                        checked={projectForm.is_featured}
                        onChange={(e) => setProjectForm(prev => ({ ...prev, is_featured: e.target.checked }))}
                        className="w-4 h-4 text-primary bg-card border border-border rounded focus:ring-blue-400 focus:ring-2"
                      />
                      <label htmlFor="is_featured" className="text-sm font-medium text-gray-300">Featured Project</label>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="is_open_source"
                        checked={projectForm.is_open_source}
                        onChange={(e) => setProjectForm(prev => ({ ...prev, is_open_source: e.target.checked }))}
                        className="w-4 h-4 text-primary bg-card border border-border rounded focus:ring-blue-400 focus:ring-2"
                      />
                      <label htmlFor="is_open_source" className="text-sm font-medium text-gray-300">Open Source</label>
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex space-x-3 pt-6 border-t border-border">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddProjectModal(false);
                      setEditingProject(null);
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
                        {editingProject ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      editingProject ? 'Update Project' : 'Create Project'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminProjects;