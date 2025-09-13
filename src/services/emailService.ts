import emailjs from '@emailjs/browser';
import { EMAIL_CONFIG, RATE_LIMITS } from '@/config/emailConfig';

export interface EmailData {
  to: string;
  subject: string;
  content: string;
  html_content?: string;
  subscriber_name?: string;
  unsubscribe_url?: string;
}

export class EmailService {
  static async initialize() {
    try {
      emailjs.init(EMAIL_CONFIG.emailjs.publicKey);
    } catch (error) {
    }
  }

  static async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      const templateParams = {
        to_email: emailData.to,
        subject: emailData.subject,
        message: emailData.content,
        html_content: emailData.html_content || this.convertTextToHtml(emailData.content),
        subscriber_name: emailData.subscriber_name || 'Subscriber',
        unsubscribe_url: emailData.unsubscribe_url || '#',
        from_name: 'GDG@PSU Newsletter',
        reply_to: 'noreply@gdgpsu.com'
      };

      const response = await emailjs.send(
        EMAIL_CONFIG.emailjs.serviceId,
        EMAIL_CONFIG.emailjs.templateId,
        templateParams
      );

      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  static async sendBulkEmails(emails: EmailData[]): Promise<{success: boolean, sent: number, failed: number}> {
    let sent = 0;
    let failed = 0;
    const limits = RATE_LIMITS.emailjs;

    // Send emails in batches with proper rate limiting
    for (let i = 0; i < emails.length; i += limits.batchSize) {
      const batch = emails.slice(i, i + limits.batchSize);
      
      for (const email of batch) {
        try {
          const success = await this.sendEmail(email);
          if (success) {
            sent++;
          } else {
            failed++;
          }
          
          // Delay between individual emails
          if (batch.indexOf(email) < batch.length - 1) {
            await new Promise(resolve => setTimeout(resolve, limits.delayBetweenEmails));
          }
        } catch (error) {
          failed++;
        }
      }

      // Delay between batches
      if (i + limits.batchSize < emails.length) {
        await new Promise(resolve => setTimeout(resolve, limits.delayBetweenBatches));
      }
    }

    return {
      success: failed === 0 || sent > failed,
      sent,
      failed
    };
  }

  private static convertTextToHtml(text: string): string {
    return text
      .split('\n\n')
      .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
      .join('');
  }
}

// Resend Email Service - Professional email API
export class ResendEmailService {
  private static readonly API_KEY = EMAIL_CONFIG.resend.apiKey;
  private static readonly API_URL = 'https://api.resend.com/emails';

  static async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      // Add unsubscribe footer to content
      const contentWithFooter = emailData.content + `\n\n---\nUnsubscribe: ${emailData.unsubscribe_url}`;
      const htmlWithFooter = emailData.html_content 
        ? emailData.html_content + `<hr><p><a href="${emailData.unsubscribe_url}">Unsubscribe</a></p>`
        : this.wrapInTemplate(contentWithFooter, emailData.subject);

      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${EMAIL_CONFIG.resend.senderName} <${EMAIL_CONFIG.resend.senderEmail}>`,
          to: [emailData.to],
          subject: emailData.subject,
          text: contentWithFooter,
          html: htmlWithFooter,
          tags: [
            { name: 'type', value: 'newsletter' },
            { name: 'source', value: 'gdg-psu' }
          ]
        })
      });

      if (response.ok) {
        const result = await response.json();
        return true;
      } else {
        const error = await response.json();
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  static async sendBulkEmails(emails: EmailData[]): Promise<{success: boolean, sent: number, failed: number}> {
    let sent = 0;
    let failed = 0;
    const limits = RATE_LIMITS.resend;

    // Resend supports batch sending - send multiple emails at once
    for (let i = 0; i < emails.length; i += limits.batchSize) {
      const batch = emails.slice(i, i + limits.batchSize);
      
      // Send batch in parallel for better performance
      const batchPromises = batch.map(async (email) => {
        try {
          const success = await this.sendEmail(email);
          return success ? 'sent' : 'failed';
        } catch (error) {
          return 'failed';
        }
      });

      const results = await Promise.all(batchPromises);
      sent += results.filter(r => r === 'sent').length;
      failed += results.filter(r => r === 'failed').length;

      // Progress logging

      // Delay between batches to respect rate limits
      if (i + limits.batchSize < emails.length) {
        await new Promise(resolve => setTimeout(resolve, limits.delayBetweenBatches));
      }
    }

    return {
      success: failed === 0 || sent > failed,
      sent,
      failed
    };
  }

  private static wrapInTemplate(content: string, subject: string): string {
    const htmlContent = content
      .split('\n\n')
      .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
      .join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
          .header { background: #4285f4; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: white; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>GDG@PSU Newsletter</h1>
        </div>
        <div class="content">
          ${htmlContent}
        </div>
        <div class="footer">
          <p>You're receiving this because you subscribed to GDG@PSU newsletter.</p>
        </div>
      </body>
      </html>
    `;
  }
}

// Gmail API integration (requires OAuth setup)
export class GmailService {
  private static accessToken: string | null = null;

  static async authenticate(): Promise<boolean> {
    // This would require Google OAuth setup
    // For simplicity, we'll assume you have the access token
    // You can get this from Google Cloud Console
    return true;
  }

  static async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      const message = this.createEmailMessage(emailData);
      
      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          raw: btoa(message).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
        })
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  private static createEmailMessage(emailData: EmailData): string {
    const boundary = 'boundary_' + Date.now();
    
    return [
      `To: ${emailData.to}`,
      `Subject: ${emailData.subject}`,
      `From: GDG@PSU Newsletter <newsletter@gdgpsu.com>`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      `Content-Type: text/plain; charset=UTF-8`,
      '',
      emailData.content,
      '',
      `--${boundary}`,
      `Content-Type: text/html; charset=UTF-8`,
      '',
      emailData.html_content || this.convertTextToHtml(emailData.content),
      '',
      `--${boundary}--`
    ].join('\r\n');
  }

  private static convertTextToHtml(text: string): string {
    return text
      .split('\n\n')
      .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
      .join('');
  }
}