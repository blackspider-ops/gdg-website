import React from 'react';
import { Link } from 'react-router-dom';
import { Github, ExternalLink, Users, Calendar, Star } from 'lucide-react';

const Projects = () => {
  const projects = [
    {
      title: 'Campus Event Finder',
      description: 'A mobile app that helps Penn State students discover and track campus events, built with Flutter and Firebase.',
      image: '/placeholder.svg',
      technologies: ['Flutter', 'Firebase', 'Google Maps API'],
      githubUrl: '#',
      liveUrl: '#',
      contributors: 4,
      stars: 23,
      status: 'Active',
      category: 'Mobile App'
    },
    {
      title: 'Study Group Matcher',
      description: 'Web platform that connects students for study groups based on courses and learning preferences.',
      image: '/placeholder.svg',
      technologies: ['React', 'Node.js', 'MongoDB'],
      githubUrl: '#',
      liveUrl: '#',
      contributors: 3,
      stars: 15,
      status: 'Active',
      category: 'Web App'
    },
    {
      title: 'Course Review Analytics',
      description: 'Machine learning project analyzing course reviews to provide insights for academic planning.',
      image: '/placeholder.svg',
      technologies: ['Python', 'TensorFlow', 'Google Cloud'],
      githubUrl: '#',
      contributors: 2,
      stars: 8,
      status: 'Completed',
      category: 'ML/AI'
    },
    {
      title: 'GDG Event Manager',
      description: 'Internal tool for managing GDG events, RSVPs, and member communications.',
      image: '/placeholder.svg',
      technologies: ['Next.js', 'Supabase', 'TypeScript'],
      githubUrl: '#',
      liveUrl: '#',
      contributors: 5,
      stars: 12,
      status: 'Active',
      category: 'Web App'
    }
  ];

  const categories = ['All', 'Mobile App', 'Web App', 'ML/AI', 'Cloud'];
  const [selectedCategory, setSelectedCategory] = React.useState('All');

  const filteredProjects = selectedCategory === 'All' 
    ? projects 
    : projects.filter(project => project.category === selectedCategory);

  return (
    <div className="min-h-screen relative z-10">
      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="editorial-grid">
          <div className="col-span-12 lg:col-span-8 lg:col-start-3 text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-display font-bold mb-6">
              Student
              <br />
              <span className="text-primary">Projects</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground content-measure mx-auto mb-8">
              Discover innovative projects built by our community members. From mobile apps to AI research, 
              see what happens when students collaborate and create.
            </p>

            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
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
        </div>
      </section>

      {/* Projects Grid */}
      <section className="py-20">
        <div className="editorial-grid">
          <div className="col-span-12">
            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {filteredProjects.map((project, index) => (
                <div key={index} className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-muted relative">
                    <img 
                      src={project.image} 
                      alt={project.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 left-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        project.status === 'Active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-semibold">{project.title}</h3>
                      <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
                        {project.category}
                      </span>
                    </div>
                    
                    <p className="text-muted-foreground mb-4">
                      {project.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.technologies.map((tech, techIndex) => (
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
                          <span>{project.contributors}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star size={14} />
                          <span>{project.stars}</span>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <a 
                          href={project.githubUrl}
                          className="p-2 hover:bg-secondary rounded-md transition-colors"
                          title="View on GitHub"
                        >
                          <Github size={16} />
                        </a>
                        {project.liveUrl && (
                          <a 
                            href={project.liveUrl}
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
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-card/30">
        <div className="editorial-grid">
          <div className="col-span-12 lg:col-span-8 lg:col-start-3 text-center">
            <h2 className="text-3xl font-display font-bold mb-4">
              Have a Project Idea?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join our community and turn your ideas into reality. Get support, find collaborators, 
              and access resources to build something amazing.
            </p>
            <Link 
              to="/contact"
              className="magnetic-button px-8 py-4 bg-primary text-primary-foreground rounded-lg font-medium inline-flex items-center focus-ring"
            >
              Start Your Project
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Projects;