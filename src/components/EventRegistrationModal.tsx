import React, { useState } from 'react';
import { X, ExternalLink, User, Mail, MessageSquare } from 'lucide-react';
import { AttendanceService } from '@/services/attendanceService';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

interface EventRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: {
    id: string;
    title: string;
    date: string;
    time: string;
    location: string;
    registrationUrl?: string;
    googleFormUrl?: string;
    registrationType?: 'external' | 'internal' | 'both';
    maxParticipants?: number;
    registrationEnabled?: boolean;
  };
}

const EventRegistrationModal: React.FC<EventRegistrationModalProps> = ({
  isOpen,
  onClose,
  event
}) => {
  const [registrationMethod, setRegistrationMethod] = useState<'external' | 'google_form' | 'internal'>('internal');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Lock body scroll when modal is open
  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  // Check if registration is disabled
  if (event.registrationEnabled === false) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-xl w-full max-w-md mx-4 shadow-xl">
          <div className="p-6 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Registration Closed</h2>
            <p className="text-gray-600 mb-6">Registration for this event is currently closed.</p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleExternalRegistration = () => {
    if (event.registrationUrl) {
      window.open(event.registrationUrl, '_blank', 'noopener,noreferrer');
      onClose();
    }
  };

  const handleGoogleFormRegistration = () => {
    if (event.googleFormUrl) {
      window.open(event.googleFormUrl, '_blank', 'noopener,noreferrer');
      onClose();
    }
  };

  const handleInternalRegistration = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await AttendanceService.addAttendee(event.id, {
        attendee_name: formData.name,
        attendee_email: formData.email,
        notes: formData.notes
      });

      if (result) {
        setSubmitted(true);
        setTimeout(() => {
          onClose();
          setSubmitted(false);
          setFormData({ name: '', email: '', notes: '' });
        }, 2000);
      }
    } catch (error: any) {
      console.error('Registration failed:', error);
      
      // Handle duplicate registration
      if (error?.code === '23505' || error?.message?.includes('duplicate key')) {
        alert('You are already registered for this event! Check your email for the confirmation.');
      } else {
        alert('Registration failed. Please try again or contact support.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      style={{
        overflow: 'hidden',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      onWheel={(e) => e.preventDefault()}
      onTouchMove={(e) => e.preventDefault()}
      onScroll={(e) => e.preventDefault()}
    >
      <div
        className="bg-white rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden shadow-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        <div className="flex-shrink-0 p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Register for Event</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
          <div className="mt-2">
            <h3 className="font-medium text-gray-900">{event.title}</h3>
            <p className="text-sm text-gray-600">{event.date} at {event.time}</p>
            <p className="text-sm text-gray-600">{event.location}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overflow-auto p-6">
          {submitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Registration Successful!</h3>
              <p className="text-gray-600">You're all set for the event. We'll send you a confirmation email shortly.</p>
            </div>
          ) : (
            <>
              {/* Registration Method Selection */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-700">Choose registration method:</p>
                  {event.maxParticipants && (
                    <p className="text-xs text-gray-500">Max: {event.maxParticipants} participants</p>
                  )}
                </div>
                <div className="space-y-2">
                  {/* Always show internal registration as fallback */}
                  <button
                    onClick={() => setRegistrationMethod('internal')}
                    className={`w-full p-3 text-left border rounded-lg transition-colors ${registrationMethod === 'internal'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <div className="flex items-center space-x-3">
                      <User size={20} className="text-blue-600" />
                      <div>
                        <div className="font-medium text-gray-900">Quick Registration</div>
                        <div className="text-sm text-gray-600">Register directly with us</div>
                      </div>
                    </div>
                  </button>

                  {(event.registrationType === 'external' || event.registrationType === 'both' || !event.registrationType) && event.registrationUrl && (
                    <button
                      onClick={() => setRegistrationMethod('external')}
                      className={`w-full p-3 text-left border rounded-lg transition-colors ${registrationMethod === 'external'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <div className="flex items-center space-x-3">
                        <ExternalLink size={20} className="text-blue-600" />
                        <div>
                          <div className="font-medium text-gray-900">External Registration</div>
                          <div className="text-sm text-gray-600">Register through the official event platform</div>
                        </div>
                      </div>
                    </button>
                  )}

                  {(event.registrationType === 'external' || event.registrationType === 'both' || !event.registrationType) && event.googleFormUrl && (
                    <button
                      onClick={() => setRegistrationMethod('google_form')}
                      className={`w-full p-3 text-left border rounded-lg transition-colors ${registrationMethod === 'google_form'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <div className="flex items-center space-x-3">
                        <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                        </svg>
                        <div>
                          <div className="font-medium text-gray-900">Google Form Registration</div>
                          <div className="text-sm text-gray-600">Register using our Google Form</div>
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              </div>

              {/* Registration Form for Internal Method */}
              {registrationMethod === 'internal' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your email address"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Additional Notes (Optional)
                    </label>
                    <div className="relative">
                      <MessageSquare size={18} className="absolute left-3 top-3 text-gray-400" />
                      <textarea
                        rows={2}
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Any dietary restrictions, accessibility needs, or questions?"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* External Registration Actions */}
              {registrationMethod === 'external' && event.registrationUrl && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    You'll be redirected to the official registration platform to complete your registration.
                  </p>
                  <div className="flex space-x-3">
                    <button
                      onClick={onClose}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleExternalRegistration}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Continue to Registration
                    </button>
                  </div>
                </div>
              )}

              {/* Google Form Registration Actions */}
              {registrationMethod === 'google_form' && event.googleFormUrl && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    You'll be redirected to our Google Form to complete your registration.
                  </p>
                  <div className="flex space-x-3">
                    <button
                      onClick={onClose}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleGoogleFormRegistration}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Open Google Form
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Fixed Footer with Buttons - Only for internal registration */}
        {!submitted && registrationMethod === 'internal' && (
          <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-white rounded-b-xl">
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleInternalRegistration()}
                disabled={isSubmitting || !formData.name || !formData.email}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Registering...' : 'Register'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventRegistrationModal;