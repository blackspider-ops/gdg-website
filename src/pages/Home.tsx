import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Code, Users, BookOpen, Smartphone, Cloud, Brain } from 'lucide-react';
import EventCard from '@/components/EventCard';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import { useContent } from '@/contexts/ContentContext';

const Home = () => {
  const { 
    getPageSection, 
    events, 
    projects, 
    isLoadingEvents, 
    isLoadingProjects,
    loadEvents, 
    loadProjects 
  } = useContent();

  // Lazy load events and projects when component mounts
  useEffect(() => {
    loadEvents();
    loadProjects();
  }, [loadEvents, loadProjects]);
  
  // Get dynamic content from admin panel
  const heroContent = getPageSection('home', 'hero') || {};
  const tracksContent = getPageSection('home', 'tracks') || {};
  const eventsContent = getPageSection('home', 'events') || {};
  const projectsContent = getPageSection('home', 'projects') || {};
  const communityContent = getPageSection('home', 'community') || {};
  
  // Get upcoming events from the events system
  const getUpcomingEvents = () => {
    if (!events || events.length === 0) return [];
    
    const now = new Date();
    
    // Filter events that are in the future and sort by date
    const futureEvents = events
      .filter(event => {
        if (!event.date) return false;
        const eventDate = new Date(event.date);
        return eventDate > now;
      })
      .sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, 3); // Take only the next 3 events
    
    return futureEvents;
  };
  
  const upcomingEvents = getUpcomingEvents();

  const highlights = [
    {
      metric: '500+',
      label: 'Active Members',
      color: 'text-gdg-blue',
    },
    {
      metric: '50+',
      label: 'Events Hosted',
      color: 'text-gdg-red',
    },
    {
      metric: '15',
      label: 'Industry Partners',
      color: 'text-gdg-yellow',
    },
    {
      metric: '100%',
      label: 'Student-Led',
      color: 'text-gdg-green',
    },
  ];

  // Get recent projects from the projects system
  const getRecentProjects = () => {
    if (!projects || projects.length === 0) return [];
    
    // Sort projects by creation date (newest first) and take only 2
    const sortedProjects = projects
      .filter(project => project.title && project.description) // Only show projects with essential info
      .sort((a, b) => {
        const dateA = new Date(a.created_at || a.date || 0);
        const dateB = new Date(b.created_at || b.date || 0);
        return dateB.getTime() - dateA.getTime(); // Newest first
      })
      .slice(0, 2); // Take only the 2 most recent projects
    
    return sortedProjects;
  };
  
  const recentProjects = getRecentProjects();

  // Get dynamic tracks from admin panel
  const dynamicTracks = tracksContent.items || [];
  
  // Icon mapping for dynamic tracks
  const iconMap: Record<string, any> = {
    Smartphone,
    Cloud,
    Brain,
    Code,
    Users,
    BookOpen
  };
  
  // Map dynamic tracks to include proper icon components
  const tracks = dynamicTracks.map((track: any) => ({
    ...track,
    icon: iconMap[track.icon] || Code // fallback to Code icon
  }));

  return (
    <div className="min-h-screen relative z-10">
      {/* Hero Section */}
      <section className="relative py-12 sm:py-16 md:py-20 lg:py-32 min-h-[60vh] sm:min-h-[70vh] md:min-h-[80vh] flex items-center">
        <div className="editorial-grid relative z-10">
          <div className="col-span-12 text-center">
            <div className="animate-fade-up">
              {heroContent.badge_text && (
                <div className="flex items-center justify-center space-x-2 mb-6">
                  <span className="text-sm font-medium text-primary uppercase tracking-wide">
                    {heroContent.badge_text}
                  </span>
                  <div className="w-12 h-px bg-border"></div>
                </div>
              )}
              
              {heroContent.title && (
                <h1 className="font-display text-responsive-3xl font-bold mb-4 sm:mb-6 leading-tight">
                  {heroContent.title}
                  {heroContent.subtitle && (
                    <>
                      <br />
                      <span className="text-primary">{heroContent.subtitle}</span>
                    </>
                  )}
                </h1>
              )}
              
              {heroContent.description && (
                <p className="text-responsive-base text-muted-foreground content-measure mx-auto mb-6 sm:mb-8 px-4 sm:px-0">
                  {heroContent.description}
                </p>
              )}

              {(heroContent.primary_cta_text || heroContent.secondary_cta_text) && (
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
                  {heroContent.primary_cta_text && heroContent.primary_cta_link && (
                    <Link 
                      to={heroContent.primary_cta_link}
                      className="magnetic-button px-6 sm:px-8 py-3 sm:py-4 bg-primary text-primary-foreground rounded-lg font-medium inline-flex items-center justify-center group focus-ring text-sm sm:text-base"
                    >
                      {heroContent.primary_cta_text}
                      <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform sm:w-[18px] sm:h-[18px]" />
                    </Link>
                  )}
                  {heroContent.secondary_cta_text && heroContent.secondary_cta_link && (
                    <Link 
                      to={heroContent.secondary_cta_link}
                      className="magnetic-button underline-slide px-6 sm:px-8 py-3 sm:py-4 text-primary hover:text-primary/80 inline-flex items-center justify-center focus-ring text-sm sm:text-base"
                    >
                      {heroContent.secondary_cta_text}
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* What We Build Section */}
      {(tracksContent.title || tracks.length > 0) && (
        <section className="py-16 sm:py-20 lg:py-24 relative">
          <div className="editorial-grid">
            {tracksContent.title && (
              <div className="col-span-12 text-center mb-12 sm:mb-16">
                <h2 className="font-display text-responsive-2xl font-bold mb-4">
                  {tracksContent.title}
                </h2>
                {tracksContent.description && (
                  <p className="text-responsive-base text-muted-foreground max-w-2xl mx-auto px-4 sm:px-0">
                    {tracksContent.description}
                  </p>
                )}
              </div>
            )}

            {tracks.length > 0 && (
              <div className="col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                {tracks.map((track, index) => {
                  const Icon = track.icon;
                  return (
                    <div key={track.id || index} className="panel-hover group">
                      <div className="p-6 sm:p-8 rounded-xl bg-card border border-border hover:border-primary/20 transition-all">
                        <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-current/10 flex items-center justify-center mb-4 sm:mb-6 ${track.color}`}>
                          <Icon size={24} className="text-current sm:w-8 sm:h-8" />
                        </div>
                        <h3 className="font-display text-lg sm:text-xl lg:text-2xl font-semibold mb-3 sm:mb-4">{track.title}</h3>
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{track.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Upcoming Events Section */}
      {(eventsContent.title || upcomingEvents.length > 0) && (
        <section className="py-24 bg-card/20">
          <div className="editorial-grid">
            <div className="col-span-12 lg:col-span-8">
              {eventsContent.title && (
                <div className="flex items-center justify-between mb-12">
                  <div>
                    <h2 className="font-display text-4xl font-bold mb-4">
                      {eventsContent.title}
                    </h2>
                    {eventsContent.description && (
                      <p className="text-xl text-muted-foreground">
                        {eventsContent.description}
                      </p>
                    )}
                  </div>
                  {eventsContent.cta_text && eventsContent.cta_link && (
                    <Link 
                      to={eventsContent.cta_link} 
                      className="hidden sm:inline-flex items-center text-primary hover:text-primary/80 transition-colors group underline-slide"
                    >
                      {eventsContent.cta_text}
                      <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  )}
                </div>
              )}
            </div>

            {isLoadingEvents ? (
              <div className="col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <LoadingSkeleton variant="event" count={3} />
              </div>
            ) : upcomingEvents.length > 0 ? (
              <>
                <div className="col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcomingEvents.map((event, index) => (
                    <EventCard key={event.id || index} {...event} />
                  ))}
                </div>

                {eventsContent.cta_text && eventsContent.cta_link && (
                  <div className="col-span-12 text-center mt-8 sm:hidden">
                    <Link 
                      to={eventsContent.cta_link}
                      className="magnetic-button px-6 py-3 bg-primary text-primary-foreground rounded-lg inline-flex items-center focus-ring"
                    >
                      {eventsContent.cta_text}
                      <ArrowRight size={18} className="ml-2" />
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <div className="col-span-12 text-center py-12">
                <div className="max-w-md mx-auto">
                  <Calendar size={48} className="text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Upcoming Events</h3>
                  <p className="text-muted-foreground mb-6">
                    We're planning exciting events for our community. Check back soon or follow us for updates!
                  </p>
                  {eventsContent.cta_text && eventsContent.cta_link && (
                    <Link 
                      to={eventsContent.cta_link}
                      className="magnetic-button px-6 py-3 bg-primary text-primary-foreground rounded-lg inline-flex items-center focus-ring"
                    >
                      {eventsContent.cta_text}
                      <ArrowRight size={18} className="ml-2" />
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Featured Projects Section */}
      {(projectsContent.title || recentProjects.length > 0) && (
        <section className="py-24">
          <div className="editorial-grid">
            {projectsContent.title && (
              <div className="col-span-12 text-center mb-16">
                <h2 className="font-display text-4xl lg:text-5xl font-bold mb-4">
                  {projectsContent.title}
                </h2>
                {projectsContent.description && (
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    {projectsContent.description}
                  </p>
                )}
              </div>
            )}
              
            {isLoadingProjects ? (
              <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-12">
                <LoadingSkeleton variant="card" count={2} />
              </div>
            ) : recentProjects.length > 0 ? (
              <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-12">
                {recentProjects.map((project, index) => (
                  <div key={project.id || index} className="panel-hover group">
                    <div className="p-8 bg-card border border-border rounded-xl hover:border-primary/20 transition-all">
                      <h3 className="font-display text-2xl font-semibold mb-4">{project.title}</h3>
                      <p className="text-muted-foreground mb-6 leading-relaxed">{project.description}</p>
                      {project.technologies && project.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {project.technologies.map((tech: string, techIndex: number) => (
                            <span key={techIndex} className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                      {project.tech && project.tech.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {project.tech.map((tech: string, techIndex: number) => (
                            <span key={techIndex} className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="col-span-12 text-center py-12 mb-12">
                <div className="max-w-md mx-auto">
                  <Code size={48} className="text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Projects Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Our community is working on exciting projects. Check back soon to see what we're building!
                  </p>
                </div>
              </div>
            )}

            {projectsContent.cta_text && projectsContent.cta_link && (
              <div className="col-span-12 text-center">
                <Link 
                  to={projectsContent.cta_link} 
                  className="magnetic-button inline-flex items-center text-primary hover:text-primary/80 transition-colors group underline-slide text-lg"
                >
                  {projectsContent.cta_text}
                  <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Join Community Section */}
      <section className="py-24 bg-gradient-to-b from-background to-card/20">
        <div className="editorial-grid">
          <div className="col-span-12 lg:col-span-8 lg:col-start-3 text-center">
            <div className="panel-hover">
              <div className="p-12 bg-card border border-border rounded-2xl">
                <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-8">
                  <Users size={40} className="text-primary-foreground" />
                </div>
                
                {communityContent.title && (
                  <h3 className="font-display text-3xl font-bold mb-4">
                    {communityContent.title}
                  </h3>
                )}
                {communityContent.description && (
                  <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                    {communityContent.description}
                  </p>
                )}

                {(communityContent.feature_1 || communityContent.feature_2 || communityContent.feature_3) && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                    {communityContent.feature_1 && (
                      <div className="flex flex-col items-center text-center">
                        <Calendar size={24} className="text-primary mb-3" />
                        <span className="font-medium">
                          {communityContent.feature_1}
                        </span>
                      </div>
                    )}
                    {communityContent.feature_2 && (
                      <div className="flex flex-col items-center text-center">
                        <Code size={24} className="text-primary mb-3" />
                        <span className="font-medium">
                          {communityContent.feature_2}
                        </span>
                      </div>
                    )}
                    {communityContent.feature_3 && (
                      <div className="flex flex-col items-center text-center">
                        <BookOpen size={24} className="text-primary mb-3" />
                        <span className="font-medium">
                          {communityContent.feature_3}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {communityContent.cta_text && communityContent.cta_link && (
                  <Link 
                    to={communityContent.cta_link}
                    className="magnetic-button px-8 py-4 bg-primary text-primary-foreground rounded-lg font-medium inline-flex items-center focus-ring"
                  >
                    {communityContent.cta_text}
                    <ArrowRight size={18} className="ml-2" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;