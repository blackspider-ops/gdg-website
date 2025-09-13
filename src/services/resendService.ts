// Resend Email Service - Modern email API
// https://resend.com/

export interface ResendEmailData {
  to: string;
  subject: string;
  content: string;
  html_content?: string;
  subscriber_name?: string;
  unsubscribe_url?: string;
}

export class ResendService {
  private static readonly EMAIL_API_URL = import.meta.env.VITE_EMAIL_API_URL || '/api/send-email';
  private static readonly FROM_EMAIL = import.meta.env.VITE_FROM_EMAIL || 'newsletter@decryptpsu.me';
  private static readonly FROM_NAME = import.meta.env.VITE_FROM_NAME || 'GDG@PSU Newsletter';
  private static readonly DOMAIN = import.meta.env.VITE_DOMAIN || 'decryptpsu.me';

  static async sendEmail(emailData: ResendEmailData): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      // Use backend API endpoint to send email (avoids CORS issues)
      const response = await fetch(this.EMAIL_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        return { success: true, id: result.id };
      } else {
        return { success: false, error: result.error || 'Unknown error' };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async sendBulkEmails(emails: ResendEmailData[]): Promise<{success: boolean, sent: number, failed: number, results: Array<{email: string, success: boolean, id?: string, error?: string}>}> {
    let sent = 0;
    let failed = 0;
    const results: Array<{email: string, success: boolean, id?: string, error?: string}> = [];


    // Send emails in batches to respect rate limits
    const batchSize = 10; // Resend allows good throughput
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      

      const batchPromises = batch.map(async (email) => {
        const result = await this.sendEmail(email);
        
        results.push({
          email: email.to,
          success: result.success,
          id: result.id,
          error: result.error
        });

        if (result.success) {
          sent++;
        } else {
          failed++;
        }

        return result;
      });

      await Promise.all(batchPromises);
      
      // Small delay between batches to be respectful
      if (i + batchSize < emails.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }


    return {
      success: failed === 0 || sent > failed,
      sent,
      failed,
      results
    };
  }



  // Newsletter confirmation email
  static async sendNewsletterConfirmation(to: string, name: string, confirmationToken: string): Promise<boolean> {
    const confirmationUrl = `https://${this.DOMAIN}/newsletter/confirm?token=${confirmationToken}`;
    
    const confirmationEmail: ResendEmailData = {
      to,
      subject: '📧 Confirm your GDG@PSU Newsletter subscription',
      content: `Hello ${name}!

Thank you for subscribing to the GDG@PSU newsletter! 🎉

To complete your subscription and start receiving our updates about:
• Upcoming tech events and workshops
• Community announcements
• Industry insights and opportunities
• Networking events

Please confirm your email address by clicking the link below:

${confirmationUrl}

If you didn't subscribe to this newsletter, you can safely ignore this email.

Welcome to the GDG@PSU community!

Best regards,
The GDG@PSU Team`,
      subscriber_name: name,
      html_content: `
        <h2>Welcome to GDG@PSU! 🎉</h2>
        <p>Hello ${name}!</p>
        <p>Thank you for subscribing to the GDG@PSU newsletter!</p>
        
        <p>To complete your subscription and start receiving our updates about:</p>
        <ul>
          <li>🚀 Upcoming tech events and workshops</li>
          <li>📢 Community announcements</li>
          <li>💡 Industry insights and opportunities</li>
          <li>🤝 Networking events</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${confirmationUrl}" 
             style="background-color: #4285f4; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            ✅ Confirm Subscription
          </a>
        </div>
        
        <p><small>If you didn't subscribe to this newsletter, you can safely ignore this email.</small></p>
        <p>Welcome to the GDG@PSU community!</p>
      `
    };

    const result = await this.sendEmail(confirmationEmail);
    return result.success;
  }

  // Event registration confirmation
  static async sendEventRegistrationConfirmation(
    to: string, 
    name: string, 
    eventTitle: string, 
    eventDate: string, 
    eventLocation: string,
    eventDetails?: string
  ): Promise<boolean> {
    const eventEmail: ResendEmailData = {
      to,
      subject: `🎉 Registration Confirmed: ${eventTitle}`,
      content: `Hello ${name}!

Your registration for "${eventTitle}" has been confirmed! 🎉

Event Details:
📅 Date: ${eventDate}
📍 Location: ${eventLocation}
${eventDetails ? `\n📝 Details: ${eventDetails}` : ''}

What to expect:
• Engaging presentations and workshops
• Networking opportunities with fellow developers
• Learning about the latest technologies
• Q&A sessions with industry experts

We're excited to see you there!

If you have any questions, feel free to reach out to us.

Best regards,
The GDG@PSU Team

---
Add this event to your calendar: https://${this.DOMAIN}/events`,
      subscriber_name: name,
      html_content: `
        <h2>🎉 Registration Confirmed!</h2>
        <p>Hello ${name}!</p>
        <p>Your registration for <strong>"${eventTitle}"</strong> has been confirmed!</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #4285f4;">📅 Event Details</h3>
          <p><strong>📅 Date:</strong> ${eventDate}</p>
          <p><strong>📍 Location:</strong> ${eventLocation}</p>
          ${eventDetails ? `<p><strong>📝 Details:</strong> ${eventDetails}</p>` : ''}
        </div>
        
        <h3>What to expect:</h3>
        <ul>
          <li>🎯 Engaging presentations and workshops</li>
          <li>🤝 Networking opportunities with fellow developers</li>
          <li>💡 Learning about the latest technologies</li>
          <li>❓ Q&A sessions with industry experts</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://${this.DOMAIN}/events" 
             style="background-color: #34a853; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            📅 Add to Calendar
          </a>
        </div>
        
        <p>We're excited to see you there!</p>
        <p>If you have any questions, feel free to reach out to us.</p>
      `
    };

    const result = await this.sendEmail(eventEmail);
    return result.success;
  }

  // Event reminder email
  static async sendEventReminder(
    to: string, 
    name: string, 
    eventTitle: string, 
    eventDate: string, 
    eventLocation: string,
    hoursUntilEvent: number
  ): Promise<boolean> {
    const reminderEmail: ResendEmailData = {
      to,
      subject: `⏰ Reminder: ${eventTitle} ${hoursUntilEvent < 24 ? 'starts soon!' : 'is tomorrow!'}`,
      content: `Hello ${name}!

This is a friendly reminder that "${eventTitle}" ${hoursUntilEvent < 24 ? `starts in ${hoursUntilEvent} hours` : 'is tomorrow'}! ⏰

Event Details:
📅 Date: ${eventDate}
📍 Location: ${eventLocation}

Don't forget to:
• Bring your laptop if it's a hands-on workshop
• Arrive 15 minutes early for networking
• Bring business cards for networking
• Prepare any questions you'd like to ask

We're looking forward to seeing you there!

Best regards,
The GDG@PSU Team`,
      subscriber_name: name,
      html_content: `
        <h2>⏰ Event Reminder</h2>
        <p>Hello ${name}!</p>
        <p>This is a friendly reminder that <strong>"${eventTitle}"</strong> ${hoursUntilEvent < 24 ? `starts in ${hoursUntilEvent} hours` : 'is tomorrow'}!</p>
        
        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #856404;">📅 Event Details</h3>
          <p><strong>📅 Date:</strong> ${eventDate}</p>
          <p><strong>📍 Location:</strong> ${eventLocation}</p>
        </div>
        
        <h3>Don't forget to:</h3>
        <ul>
          <li>💻 Bring your laptop if it's a hands-on workshop</li>
          <li>⏰ Arrive 15 minutes early for networking</li>
          <li>🎴 Bring business cards for networking</li>
          <li>❓ Prepare any questions you'd like to ask</li>
        </ul>
        
        <p>We're looking forward to seeing you there!</p>
      `
    };

    const result = await this.sendEmail(reminderEmail);
    return result.success;
  }

  // Welcome email for new members
  static async sendWelcomeEmail(to: string, name: string): Promise<boolean> {
    const welcomeEmail: ResendEmailData = {
      to,
      subject: '🎉 Welcome to GDG@PSU!',
      content: `Hello ${name}!

Welcome to Google Developer Group at Penn State University! 🎉

We're thrilled to have you join our community of passionate developers, designers, and tech enthusiasts.

What you can expect as a GDG@PSU member:
• Regular workshops and tech talks
• Networking events with industry professionals
• Hands-on coding sessions and hackathons
• Access to Google technologies and resources
• Opportunities to contribute to open-source projects
• Career development and mentorship

Getting Started:
1. Join our community channels
2. Follow us on social media
3. Attend our upcoming events
4. Connect with fellow members

Visit our website: https://${this.DOMAIN}
Upcoming events: https://${this.DOMAIN}/events

We can't wait to see what amazing things you'll build with us!

Best regards,
The GDG@PSU Team`,
      subscriber_name: name,
      html_content: `
        <h1>🎉 Welcome to GDG@PSU!</h1>
        <p>Hello ${name}!</p>
        <p>Welcome to <strong>Google Developer Group at Penn State University!</strong></p>
        <p>We're thrilled to have you join our community of passionate developers, designers, and tech enthusiasts.</p>
        
        <h3>What you can expect as a GDG@PSU member:</h3>
        <ul>
          <li>🎯 Regular workshops and tech talks</li>
          <li>🤝 Networking events with industry professionals</li>
          <li>💻 Hands-on coding sessions and hackathons</li>
          <li>🚀 Access to Google technologies and resources</li>
          <li>🌟 Opportunities to contribute to open-source projects</li>
          <li>📈 Career development and mentorship</li>
        </ul>
        
        <h3>Getting Started:</h3>
        <ol>
          <li>Join our community channels</li>
          <li>Follow us on social media</li>
          <li>Attend our upcoming events</li>
          <li>Connect with fellow members</li>
        </ol>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://${this.DOMAIN}" 
             style="background-color: #4285f4; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; margin: 10px;">
            🌐 Visit Website
          </a>
          <a href="https://${this.DOMAIN}/events" 
             style="background-color: #34a853; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; margin: 10px;">
            📅 View Events
          </a>
        </div>
        
        <p>We can't wait to see what amazing things you'll build with us!</p>
      `
    };

    const result = await this.sendEmail(welcomeEmail);
    return result.success;
  }

  // Test email functionality
  static async sendTestEmail(to: string): Promise<boolean> {
    const testEmail: ResendEmailData = {
      to,
      subject: '🧪 Test Email from GDG@PSU Newsletter System',
      content: `Hello!

This is a test email from your GDG@PSU newsletter system.

If you're receiving this, your email configuration is working correctly! 🎉

Domain: ${this.DOMAIN}
From: ${this.FROM_EMAIL}

Key features:
• Direct email sending from your app
• Professional email templates
• Newsletter confirmations
• Event registration emails
• Automatic scheduling
• Bulk email support

You can now send newsletters to your subscribers with confidence.

Best regards,
The GDG@PSU Newsletter System`,
      subscriber_name: 'Test User'
    };

    const result = await this.sendEmail(testEmail);
    return result.success;
  }
}