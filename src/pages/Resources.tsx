import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Download, Play, BookOpen, Code, Cloud, Smartphone, Brain } from 'lucide-react';
import { useContent } from '@/contexts/ContentContext';
import { ResourcesService } from '@/services/resourcesService';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';

const Resources = () => {
  const { resources, isLoadingResources, loadResources, getPageSection, lastUpdated } = useContent();

  // Load resources when component mounts
  useEffect(() => {
    loadResources();
  }, [loadResources, lastUpdated]);

  const handleResourceClick = async (resourceId: string, url?: string) => {
    // Increment view count
    await ResourcesService.incrementViews(resourceId);
    
    // Open URL if provided
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // Icon mapping
  const iconMap: Record<string, any> = {
    Smartphone,
    Cloud,
    Brain,
    Code,
    BookOpen,
    Play,
    Download
  };

  // Filter resources by type
  const studyJams = resources.filter(r => r.type === 'study_jam').map(jam => ({
    ...jam,
    icon: iconMap[jam.icon] || Code,
    materials: jam.materials || []
  }));

  const cloudCredits = resources.filter(r => r.type === 'cloud_credit').map(credit => ({
    ...credit,
    requirements: credit.requirements || [],
    link: credit.url
  }));

  const documentation = resources.filter(r => r.type === 'documentation').map(doc => ({
    ...doc,
    type: 'Documentation',
    link: doc.url,
    tags: doc.tags
  }));

  const recordings = resources.filter(r => r.type === 'recording').map(recording => ({
    ...recording,
    date: recording.metadata?.date ? new Date(recording.metadata.date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }) : 'Unknown date',
    link: recording.url,
    views: recording.views
  }));

  // Get page content from database
  const pageHeader = getPageSection('resources', 'header') || {};

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
              <p className="text-xl text-muted-foreground content-measure mx-auto mb-8">
                {pageHeader.description}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Study Jams - Only show if there are study jams or if loading */}
      {(isLoadingResources || studyJams.length > 0) && (
        <section className="py-20">
          <div className="editorial-grid">
            <div className="col-span-12">
              {pageHeader.study_materials_title && (
                <h2 className="text-3xl font-display font-bold mb-12">{pageHeader.study_materials_title}</h2>
              )}
              {isLoadingResources ? (
                <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  <LoadingSkeleton variant="card" count={4} />
                </div>
              ) : (
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
                          ? 'bg-success/20 text-success' 
                          : 'bg-accent/20 text-accent'
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
                      onClick={() => handleResourceClick(jam.id, jam.url)}
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
              )}
            </div>
          </div>
        </section>
      )}

      {/* Cloud Credits - Only show if there are cloud credits */}
      {cloudCredits.length > 0 && (
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
                  
                  <button 
                    onClick={() => handleResourceClick(credit.id, credit.link)}
                    className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors inline-flex items-center justify-center"
                  >
                    Get Credits
                    <ExternalLink size={16} className="ml-2" />
                  </button>
                </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Documentation - Only show if there is documentation */}
      {documentation.length > 0 && (
        <section className="py-20">
          <div className="editorial-grid">
            <div className="col-span-12">
              <h2 className="text-3xl font-display font-bold mb-12">Documentation & Tutorials</h2>
              <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {documentation.map((doc, index) => (
                <div 
                  key={index} 
                  onClick={() => handleResourceClick(doc.id, doc.link)}
                  className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
                >
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
      )}

      {/* Recordings - Only show if there are recordings */}
      {recordings.length > 0 && (
        <section className="py-20 bg-card/30">
          <div className="editorial-grid">
            <div className="col-span-12">
              <h2 className="text-3xl font-display font-bold mb-12">Session Recordings</h2>
              <div className="space-y-4">
                {recordings.map((recording, index) => (
                <div 
                  key={index} 
                  onClick={() => handleResourceClick(recording.id, recording.link)}
                  className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
                >
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
                      <span className="text-primary hover:text-primary/80 text-sm font-medium">
                        Watch Recording
                      </span>
                    </div>
                  </div>
                </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* No Resources Fallback */}
      {!isLoadingResources && studyJams.length === 0 && cloudCredits.length === 0 && documentation.length === 0 && recordings.length === 0 && (
        <section className="py-20">
          <div className="editorial-grid">
            <div className="col-span-12 lg:col-span-8 lg:col-start-3 text-center">
              <BookOpen size={64} className="mx-auto text-muted-foreground mb-6" />
              <h2 className="text-3xl font-display font-bold mb-4">
                Resources Coming Soon
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                We're working on curating amazing learning resources for our community. 
                Check back soon for study materials, cloud credits, documentation, and session recordings.
              </p>
              <Link 
                to="/contact"
                className="magnetic-button px-8 py-4 bg-primary text-primary-foreground rounded-lg font-medium inline-flex items-center focus-ring"
              >
                Get Notified
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Call to Action */}
      {(studyJams.length > 0 || cloudCredits.length > 0 || documentation.length > 0 || recordings.length > 0) && (
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
      )}
    </div>
  );
};

export default Resources;