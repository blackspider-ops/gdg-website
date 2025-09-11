import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Code, Users, BookOpen, Smartphone, Cloud, Brain } from 'lucide-react';
import EventCard from '@/components/EventCard';

const Home = () => {
  // Mock data - will be replaced with real data later
  const upcomingEvents = [
    {
      title: 'Build Your First Android App',
      date: 'March 15, 2024',
      time: '6:00 PM',
      location: 'IST Building',
      room: 'Room 220',
      attendees: 45,
      capacity: 60,
      description: 'Learn the fundamentals of Android development using Kotlin and Android Studio.',
      level: 'Beginner' as const,
      type: 'Workshop' as const,
    },
    {
      title: 'AI & Machine Learning Symposium',
      date: 'March 22, 2024',
      time: '2:00 PM',
      location: 'Forum Building',
      room: 'Auditorium',
      attendees: 120,
      capacity: 200,
      description: 'Industry experts discuss the latest trends in AI and ML development.',
      level: 'Intermediate' as const,
      type: 'Talk' as const,
    },
    {
      title: 'Firebase Study Jam',
      date: 'March 28, 2024',
      time: '7:00 PM',
      location: 'Westgate Building',
      room: 'Lab E262',
      attendees: 25,
      capacity: 30,
      description: 'Hands-on workshop building real-time applications with Firebase.',
      level: 'Intermediate' as const,
      type: 'Study Jam' as const,
    },
  ];

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

  const recentProjects = [
    {
      title: 'Campus Navigation App',
      tech: ['Flutter', 'Firebase', 'Maps API'],
      description: 'AR-powered navigation for PSU campus with real-time crowd data.',
    },
    {
      title: 'Study Group Matcher',
      tech: ['React', 'Node.js', 'PostgreSQL'],
      description: 'ML-based platform connecting students for collaborative learning.',
    },
  ];

  const tracks = [
    {
      title: 'Android',
      icon: Smartphone,
      description: 'Build mobile apps with Kotlin, Jetpack Compose, and Android Studio.',
      color: 'text-gdg-green',
    },
    {
      title: 'Cloud',
      icon: Cloud,
      description: 'Deploy scalable applications using Google Cloud Platform services.',
      color: 'text-gdg-blue',
    },
    {
      title: 'AI & ML',
      icon: Brain,
      description: 'Explore machine learning, TensorFlow, and AI-powered solutions.',
      color: 'text-gdg-red',
    },
  ];

  return (
    <div className="min-h-screen relative z-10">
      {/* Hero Section */}
      <section className="relative py-16 sm:py-20 lg:py-32 min-h-[70vh] sm:min-h-[80vh] flex items-center">
        <div className="editorial-grid relative z-10">
          <div className="col-span-12 text-center">
            <div className="animate-fade-up">
              <div className="flex items-center justify-center space-x-2 mb-6">
                <span className="text-sm font-medium text-primary uppercase tracking-wide">
                  Student Chapter
                </span>
                <div className="w-12 h-px bg-border"></div>
              </div>
              
              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-6 leading-tight">
                Google Developer Groups
                <br />
                <span className="text-primary">at Penn State</span>
              </h1>
              
              <p className="text-lg sm:text-xl text-muted-foreground content-measure mx-auto mb-8">
                Hands-on workshops, study jams, and projects across Android, Cloud, and AI.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Link 
                  to="/events"
                  className="magnetic-button px-8 py-4 bg-primary text-primary-foreground rounded-lg font-medium inline-flex items-center justify-center group focus-ring"
                >
                  Browse Events
                  <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link 
                  to="/contact"
                  className="magnetic-button underline-slide px-8 py-4 text-primary hover:text-primary/80 inline-flex items-center justify-center focus-ring"
                >
                  Join Chapter
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Build Section */}
      <section className="py-24 relative">
        <div className="editorial-grid">
          <div className="col-span-12 text-center mb-16">
            <h2 className="font-display text-4xl lg:text-5xl font-bold mb-4">What We Build</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Explore technology tracks where our community creates innovative solutions
            </p>
          </div>

          <div className="col-span-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
            {tracks.map((track, index) => {
              const Icon = track.icon;
              return (
                <div key={index} className="panel-hover group">
                  <div className="p-8 rounded-xl bg-card border border-border hover:border-primary/20 transition-all">
                    <div className={`w-16 h-16 rounded-lg bg-current/10 flex items-center justify-center mb-6 ${track.color}`}>
                      <Icon size={32} className="text-current" />
                    </div>
                    <h3 className="font-display text-2xl font-semibold mb-4">{track.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{track.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section className="py-24 bg-card/20">
        <div className="editorial-grid">
          <div className="col-span-12 lg:col-span-8">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="font-display text-4xl font-bold mb-4">Upcoming Events</h2>
                <p className="text-xl text-muted-foreground">Join us for workshops, talks, and networking opportunities</p>
              </div>
              <Link 
                to="/events" 
                className="hidden sm:inline-flex items-center text-primary hover:text-primary/80 transition-colors group underline-slide"
              >
                View All Events
                <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          <div className="col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.map((event, index) => (
              <EventCard key={index} {...event} />
            ))}
          </div>

          <div className="col-span-12 text-center mt-8 sm:hidden">
            <Link 
              to="/events"
              className="magnetic-button px-6 py-3 bg-primary text-primary-foreground rounded-lg inline-flex items-center focus-ring"
            >
              View All Events
              <ArrowRight size={18} className="ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Projects Section */}
      <section className="py-24">
        <div className="editorial-grid">
          <div className="col-span-12 text-center mb-16">
            <h2 className="font-display text-4xl lg:text-5xl font-bold mb-4">Student Projects</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our members are building innovative solutions to real campus problems. 
              From mobile apps to AI research, discover what our community creates.
            </p>
          </div>
            
          <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-12">
            {recentProjects.map((project, index) => (
              <div key={index} className="panel-hover group">
                <div className="p-8 bg-card border border-border rounded-xl hover:border-primary/20 transition-all">
                  <h3 className="font-display text-2xl font-semibold mb-4">{project.title}</h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">{project.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {project.tech.map((tech) => (
                      <span key={tech} className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="col-span-12 text-center">
            <Link 
              to="/projects" 
              className="magnetic-button inline-flex items-center text-primary hover:text-primary/80 transition-colors group underline-slide text-lg"
            >
              Explore All Projects
              <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Join Community Section */}
      <section className="py-24 bg-gradient-to-b from-background to-card/20">
        <div className="editorial-grid">
          <div className="col-span-12 lg:col-span-8 lg:col-start-3 text-center">
            <div className="panel-hover">
              <div className="p-12 bg-card border border-border rounded-2xl">
                <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-8">
                  <Users size={40} className="text-primary-foreground" />
                </div>
                
                <h3 className="font-display text-3xl font-bold mb-4">Join Our Community</h3>
                <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Connect with fellow developers, attend exclusive workshops, 
                  and build your portfolio with real projects.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                  <div className="flex flex-col items-center text-center">
                    <Calendar size={24} className="text-primary mb-3" />
                    <span className="font-medium">Weekly workshops and events</span>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <Code size={24} className="text-primary mb-3" />
                    <span className="font-medium">Collaborative coding projects</span>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <BookOpen size={24} className="text-primary mb-3" />
                    <span className="font-medium">Study jams and certifications</span>
                  </div>
                </div>

                <Link 
                  to="/contact"
                  className="magnetic-button px-8 py-4 bg-primary text-primary-foreground rounded-lg font-medium inline-flex items-center focus-ring"
                >
                  Get Started Today
                  <ArrowRight size={18} className="ml-2" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;