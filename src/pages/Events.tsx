import React, { useEffect } from 'react';
import { Filter, Search, Calendar, MapPin } from 'lucide-react';
import EventCard from '@/components/EventCard';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import { useContent } from '@/contexts/ContentContext';

const Events = () => {
  const { events, isLoadingEvents, loadEvents, getPageSection } = useContent();
  const [selectedFilter, setSelectedFilter] = React.useState('All');
  const [selectedLevel, setSelectedLevel] = React.useState('All');
  const [searchTerm, setSearchTerm] = React.useState('');

  // Load events when component mounts - force reload to get accurate attendee counts
  useEffect(() => {
    loadEvents(true); // Force reload to ensure accurate attendee counts
  }, []);

  // Transform events data to match component structure
  const allEvents = events.map(event => {
    const eventDate = new Date(event.date);
    const now = new Date();
    const isUpcoming = eventDate > now;
    
    return {
      eventId: event.id,
      title: event.title,
      date: eventDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: (event as any).time || eventDate.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      }),
      location: event.location,
      room: (event as any).room || '',
      attendees: event.accurate_attendee_count || 0,
      capacity: event.max_participants || undefined,
      description: event.description,
      level: (event as any).level ? 
        (event as any).level === 'beginner' ? 'Beginner' :
        (event as any).level === 'intermediate' ? 'Intermediate' :
        (event as any).level === 'advanced' ? 'Advanced' :
        (event as any).level === 'open_for_all' ? 'Open for All' :
        undefined : undefined,
      type: (event as any).type || (event.is_featured ? 'Featured' : 'Workshop'),
      isUpcoming,
      registrationUrl: event.registration_url,
      googleFormUrl: event.google_form_url,
      registrationType: event.registration_type,
      maxParticipants: event.max_participants,
      registrationEnabled: event.registration_enabled,
      imageUrl: event.image_url,
      // Event detail fields
      prerequisites: (event as any).prerequisites,
      what_youll_learn: (event as any).what_youll_learn,
      what_to_bring: (event as any).what_to_bring,
      schedule: (event as any).schedule,
      additional_info: (event as any).additional_info,
      contact_info: (event as any).contact_info
    };
  });

  const filters = ['All', 'Workshop', 'Featured', 'Talk', 'Networking', 'Study Jam'];
  const levelFilters = ['All', 'Beginner', 'Intermediate', 'Advanced', 'Open for All'];

  const filteredEvents = allEvents.filter(event => {
    const matchesFilter = selectedFilter === 'All' || event.type === selectedFilter;
    const matchesLevel = selectedLevel === 'All' || event.level === selectedLevel;
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesLevel && matchesSearch;
  });

  const upcomingEvents = filteredEvents.filter(event => event.isUpcoming);
  const pastEvents = filteredEvents.filter(event => !event.isUpcoming);

  // Get page content from database
  const pageHeader = getPageSection('events', 'header') || {};

  return (
    <div className="min-h-screen bg-background pt-16">
      {/* Page Header */}
      <section className="py-12 sm:py-16 bg-muted/30">
        <div className="editorial-grid">
          <div className="col-span-12 lg:col-span-8">
            {pageHeader.title && (
              <h1 className="text-display text-responsive-2xl font-semibold mb-4">
                {pageHeader.title}
              </h1>
            )}
            {pageHeader.description && (
              <p className="text-editorial text-responsive-base text-muted-foreground content-measure">
                {pageHeader.description}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Filters and Search */}
      <section className="py-6 sm:py-8 sticky top-16 bg-background/95 backdrop-blur-sm border-b border-border z-40">
        <div className="editorial-grid">
          <div className="col-span-12">
            <div className="flex flex-col lg:flex-row items-start justify-between space-y-4 lg:space-y-0">
              {/* Search */}
              <div className="relative flex-1 max-w-md w-full lg:w-auto">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground sm:w-[18px] sm:h-[18px]" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Filters in Two Rows */}
              <div className="flex flex-col space-y-2 w-full lg:w-auto">
                {/* Type Filters Row */}
                <div className="flex items-center space-x-2 overflow-x-auto pb-2 lg:pb-0">
                  <Filter size={16} className="text-muted-foreground flex-shrink-0 sm:w-[18px] sm:h-[18px]" />
                  <div className="flex space-x-2 min-w-max">
                    {filters.map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setSelectedFilter(filter)}
                        className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-full border transition-colors whitespace-nowrap ${
                          selectedFilter === filter
                            ? 'bg-gdg-blue text-foreground border-gdg-blue'
                            : 'bg-background border-border hover:border-gdg-blue hover:text-gdg-blue'
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Level Filters Row */}
                <div className="flex items-center space-x-2 overflow-x-auto pb-2 lg:pb-0">
                  <div className="w-4 flex-shrink-0"></div> {/* Spacer to align with filter icon above */}
                  <span className="text-xs sm:text-sm text-muted-foreground flex-shrink-0 font-medium">Level:</span>
                  <div className="flex space-x-2 min-w-max">
                    {levelFilters.map((level) => (
                      <button
                        key={level}
                        onClick={() => setSelectedLevel(level)}
                        className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-full border transition-colors whitespace-nowrap ${
                          selectedLevel === level
                            ? level === 'Beginner' ? 'bg-green-600 text-white border-green-600'
                            : level === 'Intermediate' ? 'bg-yellow-500 text-black border-yellow-500'
                            : level === 'Advanced' ? 'bg-red-600 text-white border-red-600'
                            : level === 'Open for All' ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-gdg-blue text-foreground border-gdg-blue'
                            : 'bg-background border-border hover:border-gdg-blue hover:text-gdg-blue'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      {isLoadingEvents ? (
        <section className="py-16">
          <div className="editorial-grid">
            <div className="col-span-12">
              <div className="flex items-center space-x-4 mb-8">
                <div className="flex items-center space-x-2">
                  <Calendar size={20} className="text-gdg-blue" />
                  <h2 className="text-display text-2xl font-semibold">Loading Events...</h2>
                </div>
                <div className="h-px flex-1 bg-border"></div>
              </div>
            </div>

            <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <LoadingSkeleton variant="event" count={6} />
            </div>
          </div>
        </section>
      ) : upcomingEvents.length > 0 && (
        <section className="py-16">
          <div className="editorial-grid">
            <div className="col-span-12">
              <div className="flex items-center space-x-4 mb-8">
                <div className="flex items-center space-x-2">
                  <Calendar size={20} className="text-gdg-blue" />
                  {pageHeader.upcoming_section_title && (
                    <h2 className="text-display text-2xl font-semibold">{pageHeader.upcoming_section_title}</h2>
                  )}
                </div>
                <div className="h-px flex-1 bg-border"></div>
                <span className="text-sm text-muted-foreground">
                  {upcomingEvents.length} event{upcomingEvents.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingEvents.map((event, index) => (
                <EventCard key={`upcoming-${index}`} {...event} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <section className="py-16 bg-muted/20">
          <div className="editorial-grid">
            <div className="col-span-12">
              <div className="flex items-center space-x-4 mb-8">
                <div className="flex items-center space-x-2">
                  <MapPin size={20} className="text-muted-foreground" />
                  {pageHeader.past_section_title && (
                    <h2 className="text-display text-2xl font-semibold">{pageHeader.past_section_title}</h2>
                  )}
                </div>
                <div className="h-px flex-1 bg-border"></div>
                <span className="text-sm text-muted-foreground">
                  {pastEvents.length} event{pastEvents.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastEvents.map((event, index) => (
                <EventCard key={`past-${index}`} {...event} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* No Results */}
      {!isLoadingEvents && filteredEvents.length === 0 && (
        <section className="py-16">
          <div className="editorial-grid">
            <div className="col-span-12 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={24} className="text-muted-foreground" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">No Events Found</h3>
              {pageHeader.no_events_message && (
                <p className="text-muted-foreground">
                  {pageHeader.no_events_message}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Call to Action */}
      <section className="py-16 border-t border-border">
        <div className="editorial-grid">
          <div className="col-span-12 lg:col-span-8 lg:col-start-3 text-center">
            <h3 className="text-display text-2xl font-semibold mb-4">
              Don't Miss Out on Future Events
            </h3>
            <p className="text-muted-foreground content-measure mx-auto mb-6">
              Subscribe to our newsletter to get notified about upcoming workshops, 
              talks, and networking opportunities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button className="btn-editorial px-6 py-3 bg-gdg-blue text-foreground border-gdg-blue hover:bg-gdg-blue/90 whitespace-nowrap">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Events;