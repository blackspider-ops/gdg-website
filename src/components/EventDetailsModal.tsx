import React from 'react';
import { X, Calendar, MapPin, Users, ExternalLink, FileText } from 'lucide-react';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

interface EventDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRegister?: () => void;
    event: {
        id: string;
        title: string;
        description: string;
        date: string;
        time: string;
        location: string;
        attendees?: number;
        capacity?: number;
        level?: string;
        type?: string;
        imageUrl?: string;
        registrationUrl?: string;
        googleFormUrl?: string;
        isUpcoming?: boolean;
        // Event detail fields
        room?: string;
        prerequisites?: string;
        what_youll_learn?: string;
        what_to_bring?: string;
        schedule?: string;
        additional_info?: string;
        contact_info?: string;
    };
}

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
    isOpen,
    onClose,
    onRegister,
    event
}) => {
    // Lock body scroll when modal is open
    useBodyScrollLock(isOpen);

    if (!isOpen) return null;

    const getLevelColor = (level?: string) => {
        switch (level) {
            case 'Beginner': return 'bg-gdg-green/20 text-gdg-green border border-gdg-green/30';
            case 'Intermediate': return 'bg-gdg-yellow/20 text-gdg-yellow border border-gdg-yellow/30';
            case 'Advanced': return 'bg-gdg-red/20 text-gdg-red border border-gdg-red/30';
            default: return 'bg-muted text-muted-foreground border border-border';
        }
    };

    const getTypeColor = (type?: string) => {
        switch (type) {
            case 'Workshop': return 'bg-gdg-blue/20 text-gdg-blue border border-gdg-blue/30';
            case 'Talk': return 'bg-accent/20 text-accent border border-accent/30';
            case 'Networking': return 'bg-gdg-yellow/20 text-gdg-yellow border border-gdg-yellow/30';
            case 'Study Jam': return 'bg-gdg-green/20 text-gdg-green border border-gdg-green/30';
            case 'Featured': return 'bg-gradient-to-r from-primary to-accent text-primary-foreground border-0';
            default: return 'bg-muted text-muted-foreground border border-border';
        }
    };

    const handleExternalLink = (url: string) => {
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
        <div
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm overflow-hidden"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
            onWheel={(e) => e.preventDefault()}
            onTouchMove={(e) => e.preventDefault()}
        >
            <div 
                className="h-full w-full flex items-center justify-center p-4"
                onClick={(e) => {
                    if (e.target === e.currentTarget) {
                        onClose();
                    }
                }}
            >
                <div
                    className="bg-card rounded-xl w-full max-w-2xl max-h-[80vh] shadow-xl overflow-hidden flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                    onWheel={(e) => e.stopPropagation()}
                    onTouchMove={(e) => e.stopPropagation()}
                >
                    {/* Fixed Header */}
                    <div className="flex-shrink-0 bg-card border-b border-border p-6 rounded-t-xl">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-foreground">{event.title}</h2>
                            <button
                                onClick={onClose}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {/* Header Image */}
                        {event.imageUrl && (
                            <div className="relative -mx-6 -mt-6 mb-6">
                                <div className="h-48 bg-muted overflow-hidden">
                                    <img
                                        src={event.imageUrl}
                                        alt={event.title}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                                </div>
                            </div>
                        )}

                        {/* Event Status and Tags */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2 flex-wrap">
                                {event.type && (
                                    <span className={`px-3 py-1.5 text-sm font-medium rounded-full ${getTypeColor(event.type)}`}>
                                        {event.type}
                                    </span>
                                )}
                                {event.level && (
                                    <span className={`px-3 py-1.5 text-sm font-medium rounded-full ${getLevelColor(event.level)}`}>
                                        {event.level}
                                    </span>
                                )}
                            </div>
                            {event.isUpcoming ? (
                                <span className="px-3 py-1.5 text-sm font-medium bg-gdg-green/20 text-green-800 rounded-full border border-green-200">
                                    Upcoming
                                </span>
                            ) : (
                                <span className="px-3 py-1.5 text-sm font-medium bg-muted text-foreground rounded-full border border-border">
                                    Past Event
                                </span>
                            )}
                        </div>

                        {/* Event Details */}
                        <div className="bg-muted/30 rounded-xl p-4 mb-6">
                            <div className="grid gap-3">
                                <div className="flex items-center text-muted-foreground">
                                    <div className="flex items-center justify-center w-10 h-10 bg-primary/20 rounded-lg mr-3">
                                        <Calendar size={20} className="text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground">{event.date}</p>
                                        <p className="text-sm text-muted-foreground">{event.time}</p>
                                    </div>
                                </div>

                                <div className="flex items-center text-muted-foreground">
                                    <div className="flex items-center justify-center w-10 h-10 bg-gdg-green/20 rounded-lg mr-3">
                                        <MapPin size={20} className="text-gdg-green" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground">Location</p>
                                        <p className="text-sm text-muted-foreground">{event.location}</p>
                                    </div>
                                </div>

                                {event.attendees !== undefined && event.capacity && (
                                    <div className="flex items-center text-muted-foreground">
                                        <div className="flex items-center justify-center w-10 h-10 bg-accent/20 rounded-lg mr-3">
                                            <Users size={20} className="text-accent" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-foreground">Attendance</p>
                                            <div className="flex items-center space-x-2">
                                                <span className="text-sm text-muted-foreground">{event.attendees}/{event.capacity} registered</span>
                                                <div className="flex-1 bg-border rounded-full h-2 max-w-24">
                                                    <div
                                                        className="bg-accent h-2 rounded-full transition-all duration-300"
                                                        style={{ width: `${Math.min((event.attendees / event.capacity) * 100, 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Event Description */}
                        <div className="mb-6">
                            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center">
                                <div className="flex items-center justify-center w-8 h-8 bg-primary/20 rounded-lg mr-3">
                                    <FileText size={18} className="text-primary" />
                                </div>
                                About This Event
                            </h3>
                            <div className="bg-card border border-border rounded-xl p-4">
                                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{event.description}</p>

                                {/* Add some extra content to make it scrollable for testing */}
                                {/* Dynamic Event Details */}
                                <div className="mt-6 space-y-4">
                                    {event.room && (
                                        <div>
                                            <h4 className="font-semibold text-foreground mb-2">Room/Venue Details</h4>
                                            <p className="text-muted-foreground">{event.room}</p>
                                        </div>
                                    )}

                                    {event.what_youll_learn && (
                                        <div>
                                            <h4 className="font-semibold text-foreground mb-2">What You'll Learn</h4>
                                            <div className="text-muted-foreground whitespace-pre-wrap">{event.what_youll_learn}</div>
                                        </div>
                                    )}

                                    {event.prerequisites && (
                                        <div>
                                            <h4 className="font-semibold text-foreground mb-2">Prerequisites</h4>
                                            <div className="text-muted-foreground whitespace-pre-wrap">{event.prerequisites}</div>
                                        </div>
                                    )}

                                    {event.what_to_bring && (
                                        <div>
                                            <h4 className="font-semibold text-foreground mb-2">What to Bring</h4>
                                            <div className="text-muted-foreground whitespace-pre-wrap">{event.what_to_bring}</div>
                                        </div>
                                    )}

                                    {event.schedule && (
                                        <div>
                                            <h4 className="font-semibold text-foreground mb-2">Schedule</h4>
                                            <div className="text-muted-foreground whitespace-pre-wrap">{event.schedule}</div>
                                        </div>
                                    )}

                                    {event.additional_info && (
                                        <div>
                                            <h4 className="font-semibold text-foreground mb-2">Additional Information</h4>
                                            <div className="text-muted-foreground whitespace-pre-wrap">{event.additional_info}</div>
                                        </div>
                                    )}

                                    {event.contact_info && (
                                        <div>
                                            <h4 className="font-semibold text-foreground mb-2">Contact Information</h4>
                                            <div className="text-muted-foreground whitespace-pre-wrap">{event.contact_info}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Registration Links - Only show for upcoming events */}
                        {event.isUpcoming && (event.registrationUrl || event.googleFormUrl) && (
                            <div className="mb-6">
                                <div className="space-y-3">

                                    {event.googleFormUrl && (
                                        <button
                                            onClick={() => handleExternalLink(event.googleFormUrl!)}
                                            className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-green-600 text-primary-foreground rounded-xl hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                                        >
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                                            </svg>
                                            <span className="font-medium">Register via Google Form</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Past Event Information */}
                        {!event.isUpcoming && (
                            <div className="mb-6">
                                <h3 className="text-xl font-semibold text-foreground mb-4">Event Summary</h3>
                                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-border">
                                    <div className="flex items-center space-x-3 mb-3">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                        <p className="text-muted-foreground font-medium">
                                            This event has concluded
                                        </p>
                                    </div>
                                    <p className="text-muted-foreground mb-3">
                                        Thank you to everyone who attended! We hope you found it valuable and engaging.
                                    </p>
                                    {event.attendees && (
                                        <div className="bg-card rounded-lg p-3 inline-block">
                                            <p className="text-foreground font-semibold">
                                                <span className="text-2xl text-primary">{event.attendees}</span> attendees
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                    </div>
                    
                    {/* Fixed Footer with Action Buttons */}
                    <div className="flex-shrink-0 p-6 border-t border-border bg-card rounded-b-xl">
                        <div className="flex space-x-3">
                            <button
                                onClick={onClose}
                                className="flex-1 px-6 py-3 border border-border rounded-lg hover:bg-muted/30 transition-colors font-medium text-muted-foreground"
                            >
                                Close
                            </button>

                            {event.isUpcoming ? (
                                // For upcoming events, show register button if registration is available
                                (event.registrationUrl || event.googleFormUrl) && onRegister && (
                                    <button
                                        onClick={() => {
                                            onClose();
                                            onRegister();
                                        }}
                                        className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                                    >
                                        Register Now
                                    </button>
                                )
                            ) : (
                                // For past events, show share button
                                <button
                                    onClick={() => {
                                        // Could implement sharing functionality
                                        if (navigator.share) {
                                            navigator.share({
                                                title: event.title,
                                                text: event.description,
                                                url: window.location.href
                                            });
                                        } else {
                                            // Fallback: copy to clipboard
                                            navigator.clipboard.writeText(
                                                `Check out this past event: ${event.title} - ${event.description}`
                                            );
                                        }
                                    }}
                                    className="flex-1 px-6 py-3 bg-secondary text-primary-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium"
                                >
                                    Share Event
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventDetailsModal;