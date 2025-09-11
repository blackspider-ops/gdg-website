import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Download, Play, BookOpen, Code, Cloud, Smartphone, Brain } from 'lucide-react';

const Resources = () => {
  const studyJams = [
    {
      title: 'Android Development Fundamentals',
      description: 'Complete guide to building Android apps with Kotlin',
      duration: '8 weeks',
      level: 'Beginner',
      status: 'Available',
      materials: ['Slides', 'Code Samples', 'Recordings'],
      icon: Smartphone,
      color: 'text-gdg-green'
    },
    {
      title: 'Google Cloud Platform Essentials',
      description: 'Learn cloud computing with hands-on GCP projects',
      duration: '6 weeks',
      level: 'Intermediate',
      status: 'Available',
      materials: ['Slides', 'Lab Guides', 'Recordings'],
      icon: Cloud,
      color: 'text-gdg-blue'
    },
    {
      title: 'Machine Learning with TensorFlow',
      description: 'Introduction to ML concepts and practical implementation',
      duration: '10 weeks',
      level: 'Intermediate',
      status: 'Coming Soon',
      materials: ['Slides', 'Notebooks', 'Datasets'],
      icon: Brain,
      color: 'text-gdg-red'
    },
    {
      title: 'Web Development with React',
      description: 'Modern web development using React and TypeScript',
      duration: '8 weeks',
      level: 'Beginner',
      status: 'Available',
      materials: ['Slides', 'Code Samples', 'Recordings'],
      icon: Code,
      color: 'text-gdg-yellow'
    }
  ];

  const cloudCredits = [
    {
      title: 'Google Cloud Credits for Students',
      description: '$300 in free credits for new Google Cloud users',
      provider: 'Google Cloud',
      amount: '$300',
      duration: '12 months',
      requirements: ['Valid student email', 'First-time GCP user'],
      link: '#'
    },
    {
      title: 'Firebase Spark Plan',
      description: 'Free tier for Firebase projects with generous limits',
      provider: 'Firebase',
      amount: 'Free',
      duration: 'Ongoing',
      requirements: ['Google account'],
      link: '#'
    },
    {
      title: 'GitHub Student Developer Pack',
      description: 'Free access to developer tools and cloud services',
      provider: 'GitHub',
      amount: 'Various',
      duration: 'While student',
      requirements: ['Valid student status'],
      link: '#'
    }
  ];

  const documentation = [
    {
      title: 'Android Developer Guides',
      description: 'Official Android development documentation',
      type: 'Documentation',
      link: '#',
      tags: ['Android', 'Mobile', 'Kotlin']
    },
    {
      title: 'Google Cloud Documentation',
      description: 'Comprehensive guides for all GCP services',
      type: 'Documentation',
      link: '#',
      tags: ['Cloud', 'Infrastructure', 'APIs']
    },
    {
      title: 'TensorFlow Tutorials',
      description: 'Step-by-step machine learning tutorials',
      type: 'Tutorials',
      link: '#',
      tags: ['ML', 'AI', 'Python']
    },
    {
      title: 'Flutter Documentation',
      description: 'Build beautiful cross-platform apps',
      type: 'Documentation',
      link: '#',
      tags: ['Flutter', 'Mobile', 'Cross-platform']
    }
  ];

  const recordings = [
    {
      title: 'Getting Started with Android Development',
      speaker: 'Alex Chen',
      date: 'March 15, 2025',
      duration: '1h 30m',
      views: 245,
      link: '#'
    },
    {
      title: 'Cloud Architecture Best Practices',
      speaker: 'Sarah Johnson',
      date: 'March 8, 2025',
      duration: '45m',
      views: 189,
      link: '#'
    },
    {
      title: 'Introduction to Machine Learning',
      speaker: 'Dr. Amanda Foster',
      date: 'February 28, 2025',
      duration: '2h 15m',
      views: 312,
      link: '#'
    },
    {
      title: 'Building Responsive Web Apps',
      speaker: 'Michael Rodriguez',
      date: 'February 20, 2025',
      duration: '1h 45m',
      views: 156,
      link: '#'
    }
  ];

  return (
    <div className="min-h-screen relative z-10">
      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="editorial-grid">
          <div className="col-span-12 lg:col-span-8 lg:col-start-3 text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-display font-bold mb-6">
              Learning
              <br />
              <span className="text-primary">Resources</span>
            </h1>
            
            <p className="text-xl text-muted-foreground content-measure mx-auto mb-8">
              Access study materials, cloud credits, documentation, and recorded sessions 
              to accelerate your learning journey.
            </p>
          </div>
        </div>
      </section>

      {/* Study Jams */}
      <section className="py-20">
        <div className="editorial-grid">
          <div className="col-span-12">
            <h2 className="text-3xl font-display font-bold mb-12">Study Jams</h2>
            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {studyJams.map((jam, index) => (
                <div key={index} className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg bg-secondary ${jam.color}`}>
                        <jam.icon size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{jam.title}</h3>
                        <p className="text-sm text-muted-foreground">{jam.duration} • {jam.level}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      jam.status === 'Available' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {jam.status}
                    </span>
                  </div>
                  
                  <p className="text-muted-foreground mb-4">{jam.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {jam.materials.map((material, materialIndex) => (
                      <span 
                        key={materialIndex}
                        className="px-2 py-1 bg-primary/10 text-primary text-xs rounded"
                      >
                        {material}
                      </span>
                    ))}
                  </div>
                  
                  <button 
                    className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
                      jam.status === 'Available'
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'bg-secondary text-secondary-foreground cursor-not-allowed'
                    }`}
                    disabled={jam.status !== 'Available'}
                  >
                    {jam.status === 'Available' ? 'Access Materials' : 'Coming Soon'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Cloud Credits */}
      <section className="py-20 bg-card/30">
        <div className="editorial-grid">
          <div className="col-span-12">
            <h2 className="text-3xl font-display font-bold mb-12">Cloud Credits & Free Tiers</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {cloudCredits.map((credit, index) => (
                <div key={index} className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">{credit.title}</h3>
                    <span className="text-2xl font-bold text-primary">{credit.amount}</span>
                  </div>
                  
                  <p className="text-muted-foreground mb-4">{credit.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Provider:</span>
                      <span>{credit.provider}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Duration:</span>
                      <span>{credit.duration}</span>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2">Requirements:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {credit.requirements.map((req, reqIndex) => (
                        <li key={reqIndex} className="flex items-center">
                          <span className="w-1 h-1 bg-primary rounded-full mr-2"></span>
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <a 
                    href={credit.link}
                    className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors inline-flex items-center justify-center"
                  >
                    Get Credits
                    <ExternalLink size={16} className="ml-2" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Documentation */}
      <section className="py-20">
        <div className="editorial-grid">
          <div className="col-span-12">
            <h2 className="text-3xl font-display font-bold mb-12">Documentation & Tutorials</h2>
            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {documentation.map((doc, index) => (
                <div key={index} className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold mb-1">{doc.title}</h3>
                      <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
                        {doc.type}
                      </span>
                    </div>
                    <ExternalLink size={16} className="text-muted-foreground" />
                  </div>
                  
                  <p className="text-muted-foreground mb-4">{doc.description}</p>
                  
                  <div className="flex flex-wrap gap-2">
                    {doc.tags.map((tag, tagIndex) => (
                      <span 
                        key={tagIndex}
                        className="px-2 py-1 bg-primary/10 text-primary text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Recordings */}
      <section className="py-20 bg-card/30">
        <div className="editorial-grid">
          <div className="col-span-12">
            <h2 className="text-3xl font-display font-bold mb-12">Session Recordings</h2>
            <div className="space-y-4">
              {recordings.map((recording, index) => (
                <div key={index} className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Play size={20} className="text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{recording.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {recording.speaker} • {recording.date} • {recording.duration}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">{recording.views} views</p>
                      <a 
                        href={recording.link}
                        className="text-primary hover:text-primary/80 text-sm font-medium"
                      >
                        Watch Recording
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20">
        <div className="editorial-grid">
          <div className="col-span-12 lg:col-span-8 lg:col-start-3 text-center">
            <h2 className="text-3xl font-display font-bold mb-4">
              Need Help Getting Started?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Our team is here to help you navigate these resources and find the right learning path for your goals.
            </p>
            <Link 
              to="/contact"
              className="magnetic-button px-8 py-4 bg-primary text-primary-foreground rounded-lg font-medium inline-flex items-center focus-ring"
            >
              Get Support
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Resources;