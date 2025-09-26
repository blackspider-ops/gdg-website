import React, { useState } from 'react';
import { Calendar, MapPin, Users, ExternalLink, Share2 } from 'lucide-react';
import EventRegistrationModal from './EventRegistrationModal';
import EventDetailsModal from './EventDetailsModal';


interface EventCardProps {
  title: string;
  date: string;
  time: string;
  location: string;
  room?: string;
  attendees?: number;
  capacity?: number;
  image?: string;
  description: string;
  level?: 'Beginner' | 'Intermediate' | 'Advanced';
  type?: 'Workshop' | 'Talk' | 'Networking' | 'Study Jam' | 'Featured';
  isUpcoming?: boolean;
  registrationUrl?: string;
  googleFormUrl?: string;
  registrationType?: 'external' | 'internal' | 'both';
  maxParticipants?: number;
  registrationEnabled?: boolean;
  imageUrl?: string;
  eventId?: string;
  // Event detail fields
  prerequisites?: string;
  what_youll_learn?: string;
  what_to_bring?: string;
  schedule?: string;
  additional_info?: string;
  contact_info?: string;
}

const EventCard: React.FC<EventCardProps> = ({
  title,
  date,
  time,
  location,
  room,
  attendees,
  capacity,
  image,
  description,
  level,
  type,
  isUpcoming = true,
  registrationUrl,
  googleFormUrl,
  registrationType,
  maxParticipants,
  registrationEnabled,
  imageUrl,
  eventId,
  // Event detail fields
  prerequisites,
  what_youll_learn,
  what_to_bring,
  schedule,
  additional_info,
  contact_info
}) => {
  const getLevelColor = (level?: string) => {
    switch (level) {
      case 'Beginner': return 'bg-gdg-green text-primary-foreground';
      case 'Intermediate': return 'bg-gdg-yellow text-primary';
      case 'Advanced': return 'bg-gdg-red text-primary-foreground';
      default: return 'bg-secondary text-foreground';
    }
  };

  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'Workshop': return 'bg-gdg-blue text-primary-foreground';
      case 'Talk': return 'bg-gdg-red text-primary-foreground';
      case 'Networking': return 'bg-gdg-yellow text-primary';
      case 'Study Jam': return 'bg-gdg-green text-primary-foreground';
      case 'Featured': return 'bg-gradient-to-r from-gdg-blue to-gdg-red text-primary-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const handleRegister = () => {
    if (registrationEnabled === false) {
      return;
    }
    if (eventId) {
      setShowRegistrationModal(true);
            return;
    }
    
    // If we have external registration URLs, handle them
    if (registrationUrl) {
      window.open(registrationUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    
    if (googleFormUrl) {
      window.open(googleFormUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    
    // Fallback: show registration modal even without eventId
    setShowRegistrationModal(true);
  };

  const handleViewDetails = () => {
    setShowDetailsModal(true);
  };

  return (
    <article className="group bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300">
      {(image || imageUrl) && (
        <div className="aspect-video bg-muted overflow-hidden">
          <img 
            src={image || imageUrl} 
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            {type && (
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(type)}`}>
                {type}
              </span>
            )}
            {level && (
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLevelColor(level)}`}>
                {level}
              </span>
            )}
          </div>
          {isUpcoming ? (
            <span className="text-xs text-gdg-blue font-medium uppercase tracking-wide">
              Upcoming
            </span>
          ) : (
            <div className="flex items-center space-x-2">
              {attendees !== undefined && (
                <span className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                  <Users size={12} />
                  <span>{attendees} attended</span>
                </span>
              )}
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Past Event
              </span>
            </div>
          )}
        </div>

        <h3 className="font-display font-semibold text-lg mb-2 group-hover:text-gdg-blue transition-colors">
          {title}
        </h3>
        
        <p className="text-muted-foreground text-sm mb-4 content-measure">
          {description}
        </p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar size={16} className="mr-2" />
            <span>{date} at {time}</span>
          </div>
          
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin size={16} className="mr-2" />
            <span>{location}{room && `, ${room}`}</span>
          </div>
          
          {attendees !== undefined && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Users size={16} className="mr-2" />
              {isUpcoming ? (
                <span>
                  {attendees} {(maxParticipants || capacity) ? `/ ${maxParticipants || capacity}` : ''} registered
                </span>
              ) : (
                <span className="font-medium text-primary">
                  {attendees} attended
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex space-x-2">
            {isUpcoming && (
              <button 
                onClick={handleRegister}
                disabled={registrationEnabled === false}
                className={`btn-editorial px-4 py-2 transition-colors ${
                  registrationEnabled === false
                    ? 'bg-muted text-muted-foreground border-border cursor-not-allowed'
                    : 'bg-primary text-primary-foreground border-primary hover:bg-primary/90'
                }`}
              >
                {registrationEnabled === false ? 'Registration Closed' : 'Register'}
              </button>
            )}
            <button 
              onClick={handleViewDetails}
              className="btn-editorial px-4 py-2 bg-secondary text-secondary-foreground border-border hover:bg-secondary/80 transition-colors"
            >
              View Details
            </button>
          </div>
          <button 
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: title,
                  text: `Check out this event: ${title} - ${description}`,
                  url: window.location.href
                });
              } else {
                // Fallback: copy to clipboard
                const shareText = `Check out this event: ${title}\n${description}\n\nDate: ${date} at ${time}\nLocation: ${location}`;
                navigator.clipboard.writeText(shareText).then(() => {
                }).catch(() => {
                });
              }
            }}
            className="p-2 hover:bg-secondary rounded-md transition-colors"
            title="Share event"
          >
            <Share2 size={16} className="text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Registration Modal */}
      {showRegistrationModal && (
        <EventRegistrationModal
          isOpen={showRegistrationModal}
          onClose={() => setShowRegistrationModal(false)}
          event={{
            id: eventId || `temp-${title.replace(/\s+/g, '-').toLowerCase()}`,
            title,
            date,
            time,
            location,
            registrationUrl,
            googleFormUrl,
            registrationType,
            maxParticipants,
            registrationEnabled
          }}
        />
      )}

      {/* Event Details Modal */}
      {showDetailsModal && (
        <EventDetailsModal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          onRegister={isUpcoming ? () => {
            setShowDetailsModal(false);
            handleRegister();
          } : undefined}
          event={{
            id: eventId || '',
            title,
            description,
            date,
            time,
            location,
            attendees,
            capacity,
            level,
            type,
            imageUrl: image || imageUrl,
            registrationUrl,
            googleFormUrl,
            isUpcoming,
            // Event detail fields
            room,
            prerequisites,
            what_youll_learn,
            what_to_bring,
            schedule,
            additional_info,
            contact_info
          }}
        />
      )}

    </article>
  );
};

export default EventCard;