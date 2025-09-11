import React from 'react';
import { Filter, Search, Calendar, MapPin } from 'lucide-react';
import EventCard from '@/components/EventCard';

const Events = () => {
  const [selectedFilter, setSelectedFilter] = React.useState('All');
  const [searchTerm, setSearchTerm] = React.useState('');

  const filters = ['All', 'Workshop', 'Talk', 'Networking', 'Study Jam'];

  // Mock events data
  const allEvents = [
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
      isUpcoming: true,
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
      isUpcoming: true,
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
      isUpcoming: true,
    },
    {
      title: 'Cloud Computing Deep Dive',
      date: 'April 5, 2024',
      time: '5:00 PM',
      location: 'Business Building',
      room: 'Conference Room A',
      attendees: 65,
      capacity: 80,
      description: 'Explore Google Cloud Platform and serverless architecture patterns.',
      level: 'Advanced' as const,
      type: 'Workshop' as const,
      isUpcoming: true,
    },
    {
      title: 'GDG Spring Mixer',
      date: 'April 12, 2024',
      time: '6:30 PM',
      location: 'HUB Lawn',
      attendees: 150,
      capacity: 200,
      description: 'Network with fellow developers, enjoy food, and participate in tech trivia.',
      type: 'Networking' as const,
      isUpcoming: true,
    },
    {
      title: 'Introduction to Flutter',
      date: 'February 28, 2024',
      time: '6:00 PM',
      location: 'IST Building',
      room: 'Room 220',
      attendees: 55,
      capacity: 60,
      description: 'Build beautiful mobile apps for iOS and Android with a single codebase.',
      level: 'Beginner' as const,
      type: 'Workshop' as const,
      isUpcoming: false,
    },
  ];

  const filteredEvents = allEvents.filter(event => {
    const matchesFilter = selectedFilter === 'All' || event.type === selectedFilter;
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const upcomingEvents = filteredEvents.filter(event => event.isUpcoming);
  const pastEvents = filteredEvents.filter(event => !event.isUpcoming);

  return (
    <div className="min-h-screen bg-background pt-16">
      {/* Page Header */}
      <section className="py-16 bg-muted/30">
        <div className="editorial-grid">
          <div className="col-span-12 lg:col-span-8">
            <h1 className="text-display text-3xl sm:text-4xl lg:text-5xl font-semibold mb-4">
              Events & Workshops
            </h1>
            <p className="text-editorial text-lg text-muted-foreground content-measure">
              Join our community for hands-on workshops, inspiring talks, and networking 
              opportunities. From beginner-friendly introductions to advanced deep dives, 
              there's something for every developer.
            </p>
          </div>
        </div>
      </section>

      {/* Filters and Search */}
      <section className="py-8 sticky top-16 bg-background/95 backdrop-blur-sm border-b border-border z-40">
        <div className="editorial-grid">
          <div className="col-span-12">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-4 lg:space-y-0">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gdg-blue"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center space-x-2">
                <Filter size={18} className="text-muted-foreground" />
                {filters.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSelectedFilter(filter)}
                    className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                      selectedFilter === filter
                        ? 'bg-gdg-blue text-white border-gdg-blue'
                        : 'bg-background border-border hover:border-gdg-blue hover:text-gdg-blue'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <section className="py-16">
          <div className="editorial-grid">
            <div className="col-span-12">
              <div className="flex items-center space-x-4 mb-8">
                <div className="flex items-center space-x-2">
                  <Calendar size={20} className="text-gdg-blue" />
                  <h2 className="text-display text-2xl font-semibold">Upcoming Events</h2>
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
                  <h2 className="text-display text-2xl font-semibold">Past Events</h2>
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
      {filteredEvents.length === 0 && (
        <section className="py-16">
          <div className="editorial-grid">
            <div className="col-span-12 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={24} className="text-muted-foreground" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">No Events Found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search terms or filters to find what you're looking for.
              </p>
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
                className="flex-1 px-4 py-3 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gdg-blue"
              />
              <button className="btn-editorial px-6 py-3 bg-gdg-blue text-white border-gdg-blue hover:bg-gdg-blue/90 whitespace-nowrap">
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