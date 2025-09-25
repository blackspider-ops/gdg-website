import { supabase } from '@/lib/supabase';

export interface ContactFormData {
  name: string;
  email: string;
  type: string;
  message: string;
  interests?: string[];
}

export interface ContactFormResult {
  success: boolean;
  message?: string;
  error?: string;
}

export class ContactService {
  static async submitContactForm(formData: ContactFormData): Promise<ContactFormResult> {
    try {
      const { data, error } = await supabase.functions.invoke('send-contact-form', {
        body: formData
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to submit contact form'
      };
    }
  }
}