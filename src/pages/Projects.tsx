import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Github, ExternalLink, Users, Calendar, Star } from 'lucide-react';
import { useContent } from '@/contexts/ContentContext';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import { ProjectStarsService } from '@/services/projectStarsService';

const Projects = () => {
  const { projects, isLoadingProjects, loadProjects, getPageSection } = useContent();
  const [selectedCategory, setSelectedCategory] = React.useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = React.useState('All');
  const [starredProjects, setStarredProjects] = useState<Record<string, boolean>>({});
  const [starringProject, setStarringProject] = useState<string | null>(null);
  const [localProjects, setLocalProjects] = useState(projects);

  // Load projects when component mounts
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Update local projects when projects from context change
  useEffect(() => {
    setLocalProjects(projects);
  }, [projects]);

  // Load user's starred projects when projects are loaded
  useEffect(() => {
    if (projects.length > 0) {
      loadUserStarredProjects(projects);
    }
  }, [projects]);

  const loadUserStarredProjects = async (projectsToCheck = projects) => {
    try {
      const projectIds = projectsToCheck.map(p => p.id);
      const starred = await ProjectStarsService.getUserStarredProjects(projectIds);
      setStarredProjects(starred);
    } catch (error) {
      // Handle error silently
    }
  };

  const handleStarToggle = async (projectId: string, currentStarsCount: number) => {
    if (starringProject) return; // Prevent multiple simultaneous requests
    
    setStarringProject(projectId);
    
    try {
      const result = await ProjectStarsService.toggleProjectStar(projectId);
      
      if (result.success) {
        // Update local starred state
        setStarredProjects(prev => ({
          ...prev,
          [projectId]: result.starred
        }));
        
        // Update the project's star count in the local state immediately
        setLocalProjects(prev => prev.map(project => 
          project.id === projectId 
            ? { ...project, stars_count: result.newCount }
            : project
        ));
      }
    } catch (error) {
      // Handle error silently
    } finally {
      setStarringProject(null);
    }
  };

  // Extract unique categories and difficulties from projects
  const categories = ['All', ...Array.from(new Set(localProjects.map(p => p.category).filter(Boolean)))];
  const difficulties = ['All', ...Array.from(new Set(localProjects.map(p => p.difficulty_level).filter(Boolean)))];

  const filteredProjects = localProjects.filter(project => {
    const matchesCategory = selectedCategory === 'All' || project.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'All' || project.difficulty_level === selectedDifficulty;
    return matchesCategory && matchesDifficulty;
  });

  // Get page content from database
  const pageHeader = getPageSection('projects', 'header') || {};

  return (
    <div className="min-h-screen relative z-10">
      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="editorial-grid">
          <div className="col-span-12 lg:col-span-8 lg:col-start-3 text-center">
            {(pageHeader.title || pageHeader.subtitle) && (
              <h1 className="text-3xl sm:text-4xl lg:text-6xl font-display font-bold mb-6">
                {pageHeader.title}
                {pageHeader.subtitle && (
                  <>
                    <br />
                    <span className="text-primary">{pageHeader.subtitle}</span>
                  </>
                )}
              </h1>
            )}
            
            {pageHeader.description && (
              <p className="text-lg sm:text-xl text-muted-foreground content-measure mx-auto mb-8">
                {pageHeader.description}
              </p>
            )}

            <div className="space-y-4">
              {/* Category Filters */}
              <div className="text-center">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Filter by Category</h3>
                <div className="flex flex-wrap gap-2 justify-center">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors capitalize ${
                        selectedCategory === category
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty Filters */}
              <div className="text-center">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Filter by Difficulty</h3>
                <div className="flex flex-wrap gap-2 justify-center">
                  {difficulties.map((difficulty) => (
                    <button
                      key={difficulty}
                      onClick={() => setSelectedDifficulty(difficulty)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors capitalize ${
                        selectedDifficulty === difficulty
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      }`}
                    >
                      {difficulty}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear Filters & Status */}
              {(selectedCategory !== 'All' || selectedDifficulty !== 'All') && (
                <div className="text-center">
                  <button
                    onClick={() => {
                      setSelectedCategory('All');
                      setSelectedDifficulty('All');
                    }}
                    className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors underline"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="py-20">
        <div className="editorial-grid">
          <div className="col-span-12">
            {/* Filter Status */}
            {(selectedCategory !== 'All' || selectedDifficulty !== 'All') && (
              <div className="mb-8 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-lg text-sm">
                  <span className="text-muted-foreground">Showing:</span>
                  {selectedCategory !== 'All' && (
                    <span className="px-2 py-1 bg-primary/20 text-primary rounded capitalize">
                      {selectedCategory}
                    </span>
                  )}
                  {selectedDifficulty !== 'All' && (
                    <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded capitalize">
                      {selectedDifficulty}
                    </span>
                  )}
                  <span className="text-muted-foreground">projects</span>
                </div>
              </div>
            )}
            {isLoadingProjects ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                <LoadingSkeleton variant="card" count={6} />
                <p className="mt-4 text-muted-foreground">Loading projects...</p>
              </div>
            ) : filteredProjects.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                {filteredProjects.map((project) => (
                <div key={project.id} className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-muted relative">
                    <img 
                      src={project.image_url} 
                      alt={project.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 left-4 flex gap-2">
                      {project.is_featured && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-900/20 text-yellow-400">
                          Featured
                        </span>
                      )}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        project.status === 'active' 
                          ? 'bg-green-900/20 text-green-400' 
                          : project.status === 'completed'
                          ? 'bg-blue-900/20 text-blue-400'
                          : project.status === 'on_hold'
                          ? 'bg-yellow-900/20 text-yellow-400'
                          : 'bg-gray-900/20 text-gray-400'
                      }`}>
                        {project.status === 'active' ? 'Active' : 
                         project.status === 'completed' ? 'Completed' :
                         project.status === 'on_hold' ? 'On Hold' :
                         project.status === 'archived' ? 'Archived' :
                         project.status}
                      </span>
                      {project.difficulty_level && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          project.difficulty_level === 'beginner' 
                            ? 'bg-green-900/20 text-green-400' 
                            : project.difficulty_level === 'intermediate'
                            ? 'bg-yellow-900/20 text-yellow-400'
                            : 'bg-red-900/20 text-red-400'
                        }`}>
                          {project.difficulty_level}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-semibold">{project.title}</h3>
                      <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded capitalize">
                        {project.category}
                      </span>
                    </div>
                    
                    <p className="text-muted-foreground mb-4">
                      {project.short_description || project.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.tech_stack?.map((tech, techIndex) => (
                        <span 
                          key={techIndex}
                          className="px-2 py-1 bg-primary/10 text-primary text-xs rounded"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Users size={14} />
                          <span>{project.team_size}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar size={14} />
                          <span>{new Date(project.created_at).getFullYear()}</span>
                        </div>
                        <button
                          onClick={() => handleStarToggle(project.id, project.stars_count || 0)}
                          disabled={starringProject === project.id}
                          className={`flex items-center space-x-1 px-2 py-1 rounded-md transition-colors ${
                            starredProjects[project.id]
                              ? 'bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30'
                              : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
                          } ${starringProject === project.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={starredProjects[project.id] ? 'Unstar project' : 'Star project'}
                        >
                          <Star 
                            size={14} 
                            className={starredProjects[project.id] ? 'fill-current' : ''} 
                          />
                          <span>{project.stars_count || 0}</span>
                        </button>
                      </div>
                      
                      <div className="flex space-x-2">
                        {project.github_url && (
                          <a 
                            href={project.github_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-secondary rounded-md transition-colors"
                            title="View on GitHub"
                          >
                            <Github size={16} />
                          </a>
                        )}
                        {project.demo_url && (
                          <a 
                            href={project.demo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-secondary rounded-md transition-colors"
                            title="View Live Project"
                          >
                            <ExternalLink size={16} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No projects found for the selected category.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-card/30">
        <div className="editorial-grid">
          <div className="col-span-12 lg:col-span-8 lg:col-start-3 text-center">
            {pageHeader.contribute_cta && (
              <h2 className="text-3xl font-display font-bold mb-4">
                {pageHeader.contribute_cta}
              </h2>
            )}
            <p className="text-lg text-muted-foreground mb-8">
              Join our community and turn your ideas into reality. Get support, find collaborators, 
              and access resources to build something amazing.
            </p>
            <Link 
              to="/contact"
              className="magnetic-button px-8 py-4 bg-primary text-primary-foreground rounded-lg font-medium inline-flex items-center focus-ring"
            >
              {pageHeader.contribute_button}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Projects;