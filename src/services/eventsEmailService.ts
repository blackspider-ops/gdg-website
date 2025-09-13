// Events Email Service using Resend
// Handles all event-related email communications

import { ResendService } from './resendService';

export interface EventEmailData {
  eventId: string;
  title: string;
  date: string;
  location: string;
  description?: string;
  registrationUrl?: string;
}

export interface AttendeeData {
  email: string;
  name: string;
  registeredAt: string;
}

export class EventsEmailService {
  
  // Send registration confirmation to attendee
  static async sendRegistrationConfirmation(
    attendee: AttendeeData, 
    event: EventEmailData
  ): Promise<boolean> {
    try {
      const success = await ResendService.sendEventRegistrationConfirmation(
        attendee.email,
        attendee.name,
        event.title,
        event.date,
        event.location,
        event.description
      );

      if (success) {
      } else {
      }

      return success;
    } catch (error) {
      return false;
    }
  }

  // Send event reminder to all attendees
  static async sendEventReminders(
    attendees: AttendeeData[], 
    event: EventEmailData,
    hoursUntilEvent: number = 24
  ): Promise<{sent: number, failed: number}> {
    let sent = 0;
    let failed = 0;


    for (const attendee of attendees) {
      try {
        const success = await ResendService.sendEventReminder(
          attendee.email,
          attendee.name,
          event.title,
          event.date,
          event.location,
          hoursUntilEvent
        );

        if (success) {
          sent++;
        } else {
          failed++;
        }

        // Small delay between emails
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        failed++;
      }
    }

    return { sent, failed };
  }

  // Send event announcement to newsletter subscribers
  static async sendEventAnnouncement(
    subscribers: Array<{email: string, name?: string}>,
    event: EventEmailData
  ): Promise<{sent: number, failed: number}> {
    let sent = 0;
    let failed = 0;


    // Prepare announcement emails
    const emails = subscribers.map(subscriber => ({
      to: subscriber.email,
      subject: `🚀 New Event: ${event.title}`,
      content: `Hello ${subscriber.name || 'there'}!

We're excited to announce a new upcoming event! 🎉

${event.title}

📅 Date: ${event.date}
📍 Location: ${event.location}
${event.description ? `\n📝 About: ${event.description}` : ''}

This is a great opportunity to:
• Learn new technologies and skills
• Network with fellow developers
• Get hands-on experience
• Ask questions to industry experts

${event.registrationUrl ? `Register now: ${event.registrationUrl}` : 'Registration details coming soon!'}

Don't miss out on this amazing opportunity!

Best regards,
The GDG@PSU Team`,
      subscriber_name: subscriber.name || 'Subscriber',
      html_content: `
        <h2>🚀 New Event Announcement</h2>
        <p>Hello ${subscriber.name || 'there'}!</p>
        <p>We're excited to announce a new upcoming event!</p>
        
        <div style="background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 20px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1976d2;">${event.title}</h3>
          <p><strong>📅 Date:</strong> ${event.date}</p>
          <p><strong>📍 Location:</strong> ${event.location}</p>
          ${event.description ? `<p><strong>📝 About:</strong> ${event.description}</p>` : ''}
        </div>
        
        <p>This is a great opportunity to:</p>
        <ul>
          <li>💡 Learn new technologies and skills</li>
          <li>🤝 Network with fellow developers</li>
          <li>🛠️ Get hands-on experience</li>
          <li>❓ Ask questions to industry experts</li>
        </ul>
        
        ${event.registrationUrl ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${event.registrationUrl}" 
               style="background-color: #4285f4; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              🎯 Register Now
            </a>
          </div>
        ` : '<p><em>Registration details coming soon!</em></p>'}
        
        <p>Don't miss out on this amazing opportunity!</p>
      `,
      unsubscribe_url: `https://decryptpsu.me/newsletter/unsubscribe?token=${subscriber.email}` // You'd use actual tokens
    }));

    // Send using Resend bulk email
    const result = await ResendService.sendBulkEmails(emails);
    
    return {
      sent: result.sent,
      failed: result.failed
    };
  }

  // Send welcome email to new event registrants
  static async sendWelcomeToNewMember(email: string, name: string): Promise<boolean> {
    try {
      const success = await ResendService.sendWelcomeEmail(email, name);
      
      if (success) {
      } else {
      }

      return success;
    } catch (error) {
      return false;
    }
  }

  // Send event cancellation notice
  static async sendEventCancellation(
    attendees: AttendeeData[],
    event: EventEmailData,
    reason?: string
  ): Promise<{sent: number, failed: number}> {
    let sent = 0;
    let failed = 0;


    const emails = attendees.map(attendee => ({
      to: attendee.email,
      subject: `❌ Event Cancelled: ${event.title}`,
      content: `Hello ${attendee.name}!

We regret to inform you that the following event has been cancelled:

${event.title}
📅 Originally scheduled: ${event.date}
📍 Location: ${event.location}

${reason ? `Reason: ${reason}` : 'We apologize for any inconvenience this may cause.'}

We're working on rescheduling this event and will notify you as soon as we have new details.

Thank you for your understanding.

Best regards,
The GDG@PSU Team`,
      subscriber_name: attendee.name,
      html_content: `
        <h2>❌ Event Cancellation Notice</h2>
        <p>Hello ${attendee.name}!</p>
        <p>We regret to inform you that the following event has been cancelled:</p>
        
        <div style="background-color: #ffebee; border-left: 4px solid #f44336; padding: 20px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #c62828;">${event.title}</h3>
          <p><strong>📅 Originally scheduled:</strong> ${event.date}</p>
          <p><strong>📍 Location:</strong> ${event.location}</p>
        </div>
        
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : '<p>We apologize for any inconvenience this may cause.</p>'}
        
        <p>We're working on rescheduling this event and will notify you as soon as we have new details.</p>
        <p>Thank you for your understanding.</p>
      `
    }));

    const result = await ResendService.sendBulkEmails(emails);
    
    return {
      sent: result.sent,
      failed: result.failed
    };
  }
}