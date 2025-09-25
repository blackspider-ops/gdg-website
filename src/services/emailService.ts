import { supabase } from '@/lib/supabase';

export interface EventEmailRequest {
  event_id: string;
  subject: string;
  message: string;
  email_type: 'reminder' | 'thank_you' | 'update' | 'custom';
  custom_emails?: string;
}

export interface EmailResult {
  success: boolean;
  total_sent?: number;
  total_failed?: number;
  results?: {
    successful: number;
    failed: number;
    failed_emails: Array<{ email: string; error: string }>;
  };
  error?: string;
}

export class EmailService {
  static async sendEventEmail(emailData: EventEmailRequest): Promise<EmailResult> {
    try {
      const { data, error } = await supabase.functions.invoke('send-event-email', {
        body: emailData
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to send email'
      };
    }
  }
}