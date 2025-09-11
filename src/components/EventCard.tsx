import React from 'react';
import { Calendar, MapPin, Users, ExternalLink } from 'lucide-react';

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
  type?: 'Workshop' | 'Talk' | 'Networking' | 'Study Jam';
  isUpcoming?: boolean;
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
  isUpcoming = true
}) => {
  const getLevelColor = (level?: string) => {
    switch (level) {
      case 'Beginner': return 'bg-gdg-green text-white';
      case 'Intermediate': return 'bg-gdg-yellow text-primary';
      case 'Advanced': return 'bg-gdg-red text-white';
      default: return 'bg-secondary text-foreground';
    }
  };

  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'Workshop': return 'bg-gdg-blue text-white';
      case 'Talk': return 'bg-gdg-red text-white';
      case 'Networking': return 'bg-gdg-yellow text-primary';
      case 'Study Jam': return 'bg-gdg-green text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <article className="group bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300">
      {image && (
        <div className="aspect-video bg-muted overflow-hidden">
          <img 
            src={image} 
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
          {isUpcoming && (
            <span className="text-xs text-gdg-blue font-medium uppercase tracking-wide">
              Upcoming
            </span>
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
          
          {attendees !== undefined && capacity && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Users size={16} className="mr-2" />
              <span>{attendees}/{capacity} registered</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <button className="btn-editorial px-4 py-2 bg-gdg-blue text-white border-gdg-blue hover:bg-gdg-blue/90">
            {isUpcoming ? 'Register' : 'View Details'}
          </button>
          <button className="p-2 hover:bg-secondary rounded-md transition-colors">
            <ExternalLink size={16} className="text-muted-foreground" />
          </button>
        </div>
      </div>
    </article>
  );
};

export default EventCard;