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
        <div className="bg-card rounded-xl w-full max-w-md mx-4 shadow-xl">
          <div className="p-6 text-center">
            <h2 className="text-xl font-semibold text-foreground mb-4">Registration Closed</h2>
            <p className="text-muted-foreground mb-6">Registration for this event is currently closed.</p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-secondary text-primary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
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
      
      // Handle duplicate registration
      if (error?.code === '23505' || error?.message?.includes('duplicate key')) {
      } else {
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
        className="bg-card rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden shadow-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        <div className="flex-shrink-0 p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Register for Event</h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-muted-foreground"
            >
              <X size={20} />
            </button>
          </div>
          <div className="mt-2">
            <h3 className="font-medium text-foreground">{event.title}</h3>
            <p className="text-sm text-muted-foreground">{event.date} at {event.time}</p>
            <p className="text-sm text-muted-foreground">{event.location}</p>
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
              <h3 className="text-lg font-semibold text-foreground mb-2">Registration Successful!</h3>
              <p className="text-muted-foreground">You're all set for the event. We'll send you a confirmation email shortly.</p>
            </div>
          ) : (
            <>
              {/* Registration Method Selection */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-muted-foreground">Choose registration method:</p>
                  {event.maxParticipants && (
                    <p className="text-xs text-muted-foreground">Max: {event.maxParticipants} participants</p>
                  )}
                </div>
                <div className="space-y-2">
                  {/* Always show internal registration as fallback */}
                  <button
                    onClick={() => setRegistrationMethod('internal')}
                    className={`w-full p-3 text-left border rounded-lg transition-colors ${registrationMethod === 'internal'
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-border'
                      }`}
                  >
                    <div className="flex items-center space-x-3">
                      <User size={20} className="text-primary" />
                      <div>
                        <div className="font-medium text-foreground">Quick Registration</div>
                        <div className="text-sm text-muted-foreground">Register directly with us</div>
                      </div>
                    </div>
                  </button>

                  {(event.registrationType === 'external' || event.registrationType === 'both' || !event.registrationType) && event.registrationUrl && (
                    <button
                      onClick={() => setRegistrationMethod('external')}
                      className={`w-full p-3 text-left border rounded-lg transition-colors ${registrationMethod === 'external'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-border'
                        }`}
                    >
                      <div className="flex items-center space-x-3">
                        <ExternalLink size={20} className="text-primary" />
                        <div>
                          <div className="font-medium text-foreground">External Registration</div>
                          <div className="text-sm text-muted-foreground">Register through the official event platform</div>
                        </div>
                      </div>
                    </button>
                  )}

                  {(event.registrationType === 'external' || event.registrationType === 'both' || !event.registrationType) && event.googleFormUrl && (
                    <button
                      onClick={() => setRegistrationMethod('google_form')}
                      className={`w-full p-3 text-left border rounded-lg transition-colors ${registrationMethod === 'google_form'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-border'
                        }`}
                    >
                      <div className="flex items-center space-x-3">
                        <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                        </svg>
                        <div>
                          <div className="font-medium text-foreground">Google Form Registration</div>
                          <div className="text-sm text-muted-foreground">Register using our Google Form</div>
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
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Enter your email address"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Additional Notes (Optional)
                    </label>
                    <div className="relative">
                      <MessageSquare size={18} className="absolute left-3 top-3 text-muted-foreground" />
                      <textarea
                        rows={2}
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Any dietary restrictions, accessibility needs, or questions?"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* External Registration Actions */}
              {registrationMethod === 'external' && event.registrationUrl && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    You'll be redirected to the official registration platform to complete your registration.
                  </p>
                  <div className="flex space-x-3">
                    <button
                      onClick={onClose}
                      className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleExternalRegistration}
                      className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Continue to Registration
                    </button>
                  </div>
                </div>
              )}

              {/* Google Form Registration Actions */}
              {registrationMethod === 'google_form' && event.googleFormUrl && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    You'll be redirected to our Google Form to complete your registration.
                  </p>
                  <div className="flex space-x-3">
                    <button
                      onClick={onClose}
                      className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleGoogleFormRegistration}
                      className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
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
          <div className="flex-shrink-0 p-4 border-t border-border bg-card rounded-b-xl">
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleInternalRegistration()}
                disabled={isSubmitting || !formData.name || !formData.email}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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