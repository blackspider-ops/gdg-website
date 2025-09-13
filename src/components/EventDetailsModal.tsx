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
            case 'Beginner': return 'bg-green-100 text-green-800 border border-green-200';
            case 'Intermediate': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
            case 'Advanced': return 'bg-red-100 text-red-800 border border-red-200';
            default: return 'bg-gray-100 text-gray-800 border border-gray-200';
        }
    };

    const getTypeColor = (type?: string) => {
        switch (type) {
            case 'Workshop': return 'bg-blue-100 text-blue-800 border border-blue-200';
            case 'Talk': return 'bg-purple-100 text-purple-800 border border-purple-200';
            case 'Networking': return 'bg-orange-100 text-orange-800 border border-orange-200';
            case 'Study Jam': return 'bg-green-100 text-green-800 border border-green-200';
            case 'Featured': return 'bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0';
            default: return 'bg-gray-100 text-gray-800 border border-gray-200';
        }
    };

    const handleExternalLink = (url: string) => {
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
        <div
            className="fixed inset-0 z-50 bg-black/50 overflow-hidden"
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
                    className="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] shadow-xl overflow-hidden flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                    onWheel={(e) => e.stopPropagation()}
                    onTouchMove={(e) => e.stopPropagation()}
                >
                    {/* Fixed Header */}
                    <div className="flex-shrink-0 bg-white border-b border-gray-200 p-6 rounded-t-xl">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-gray-900">{event.title}</h2>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600"
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
                                <div className="h-48 bg-gray-100 overflow-hidden">
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
                                <span className="px-3 py-1.5 text-sm font-medium bg-green-100 text-green-800 rounded-full border border-green-200">
                                    Upcoming
                                </span>
                            ) : (
                                <span className="px-3 py-1.5 text-sm font-medium bg-gray-100 text-gray-800 rounded-full border border-gray-200">
                                    Past Event
                                </span>
                            )}
                        </div>

                        {/* Event Details */}
                        <div className="bg-gray-50 rounded-xl p-4 mb-6">
                            <div className="grid gap-3">
                                <div className="flex items-center text-gray-700">
                                    <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg mr-3">
                                        <Calendar size={20} className="text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{event.date}</p>
                                        <p className="text-sm text-gray-600">{event.time}</p>
                                    </div>
                                </div>

                                <div className="flex items-center text-gray-700">
                                    <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg mr-3">
                                        <MapPin size={20} className="text-green-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Location</p>
                                        <p className="text-sm text-gray-600">{event.location}</p>
                                    </div>
                                </div>

                                {event.attendees !== undefined && event.capacity && (
                                    <div className="flex items-center text-gray-700">
                                        <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg mr-3">
                                            <Users size={20} className="text-purple-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">Attendance</p>
                                            <div className="flex items-center space-x-2">
                                                <span className="text-sm text-gray-600">{event.attendees}/{event.capacity} registered</span>
                                                <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-24">
                                                    <div
                                                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
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
                            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg mr-3">
                                    <FileText size={18} className="text-blue-600" />
                                </div>
                                About This Event
                            </h3>
                            <div className="bg-white border border-gray-200 rounded-xl p-4">
                                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{event.description}</p>

                                {/* Add some extra content to make it scrollable for testing */}
                                {/* Dynamic Event Details */}
                                <div className="mt-6 space-y-4">
                                    {event.room && (
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-2">Room/Venue Details</h4>
                                            <p className="text-gray-700">{event.room}</p>
                                        </div>
                                    )}

                                    {event.what_youll_learn && (
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-2">What You'll Learn</h4>
                                            <div className="text-gray-700 whitespace-pre-wrap">{event.what_youll_learn}</div>
                                        </div>
                                    )}

                                    {event.prerequisites && (
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-2">Prerequisites</h4>
                                            <div className="text-gray-700 whitespace-pre-wrap">{event.prerequisites}</div>
                                        </div>
                                    )}

                                    {event.what_to_bring && (
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-2">What to Bring</h4>
                                            <div className="text-gray-700 whitespace-pre-wrap">{event.what_to_bring}</div>
                                        </div>
                                    )}

                                    {event.schedule && (
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-2">Schedule</h4>
                                            <div className="text-gray-700 whitespace-pre-wrap">{event.schedule}</div>
                                        </div>
                                    )}

                                    {event.additional_info && (
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-2">Additional Information</h4>
                                            <div className="text-gray-700 whitespace-pre-wrap">{event.additional_info}</div>
                                        </div>
                                    )}

                                    {event.contact_info && (
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-2">Contact Information</h4>
                                            <div className="text-gray-700 whitespace-pre-wrap">{event.contact_info}</div>
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
                                            className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl"
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
                                <h3 className="text-xl font-semibold text-gray-900 mb-4">Event Summary</h3>
                                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                                    <div className="flex items-center space-x-3 mb-3">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                        <p className="text-gray-700 font-medium">
                                            This event has concluded
                                        </p>
                                    </div>
                                    <p className="text-gray-600 mb-3">
                                        Thank you to everyone who attended! We hope you found it valuable and engaging.
                                    </p>
                                    {event.attendees && (
                                        <div className="bg-white rounded-lg p-3 inline-block">
                                            <p className="text-gray-900 font-semibold">
                                                <span className="text-2xl text-blue-600">{event.attendees}</span> attendees
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                    </div>
                    
                    {/* Fixed Footer with Action Buttons */}
                    <div className="flex-shrink-0 p-6 border-t border-gray-200 bg-white rounded-b-xl">
                        <div className="flex space-x-3">
                            <button
                                onClick={onClose}
                                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
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
                                        className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
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
                                            alert('Event details copied to clipboard!');
                                        }
                                    }}
                                    className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
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