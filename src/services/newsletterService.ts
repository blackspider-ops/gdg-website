import { supabase } from '@/lib/supabase';
import { EMAIL_CONFIG } from '@/config/emailConfig';

export interface NewsletterSubscriber {
  id: string;
  email: string;
  name?: string;
  subscribed_at: string;
  is_active: boolean;
  confirmation_token?: string;
  confirmed_at?: string;
  unsubscribe_token: string;
  created_at: string;
  updated_at: string;
}

export interface NewsletterCampaign {
  id: string;
  subject: string;
  content: string;
  html_content?: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  scheduled_at?: string;
  sent_at?: string;
  recipient_count: number;
  open_count: number;
  click_count: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface NewsletterTemplate {
  id: string;
  name: string;
  description?: string;
  content: string;
  html_content?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class NewsletterService {
  static async subscribe(email: string, name?: string): Promise<NewsletterSubscriber | null> {
    try {
      // Generate confirmation and unsubscribe tokens
      const confirmationToken = crypto.randomUUID();
      const unsubscribeToken = crypto.randomUUID();
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .insert({
          email,
          name,
          confirmation_token: confirmationToken,
          unsubscribe_token: unsubscribeToken,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        // Handle duplicate email
        if (error.code === '23505') {
          throw new Error('This email is already subscribed to our newsletter.');
        }
        throw error;
      }

      // Send confirmation email
      try {
        await this.sendConfirmationEmail(email, name, confirmationToken);
      } catch (emailError) {
        // If email fails, don't fail the entire subscription
        // The user is still subscribed and can be manually confirmed if needed
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  static async sendConfirmationEmail(email: string, name?: string, confirmationToken?: string): Promise<void> {
    try {
      if (!confirmationToken) {
        throw new Error('Confirmation token is required');
      }

      // Use Resend for newsletter confirmation emails
      const { ResendService } = await import('@/services/resendService');
      
      const success = await ResendService.sendNewsletterConfirmation(
        email, 
        name || 'Subscriber', 
        confirmationToken
      );

      if (!success) {
        throw new Error('Failed to send confirmation email via Resend');
      }
    } catch (error) {
      throw error;
    }
  }

  static async confirmSubscription(token: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .update({
          confirmed_at: new Date().toISOString(),
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('confirmation_token', token)
        .select()
        .single();

      if (error || !data) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  static async unsubscribe(token: string): Promise<boolean> {
    try {
      // First try to unsubscribe by unsubscribe_token
      let { data, error } = await supabase
        .from('newsletter_subscribers')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('unsubscribe_token', token)
        .select()
        .single();

      // If no match found and token looks like an email, try email fallback
      if (error && token.includes('@')) {
        const { data: emailData, error: emailError } = await supabase
          .from('newsletter_subscribers')
          .update({
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .eq('email', token)
          .select()
          .single();

        if (!emailError && emailData) {
          return true;
        }
      }

      if (error || !data) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  static async getSubscribers(): Promise<NewsletterSubscriber[]> {
    try {
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .eq('is_active', true)
        .order('subscribed_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      return [];
    }
  }

  static async getAllSubscribers(): Promise<NewsletterSubscriber[]> {
    try {
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .order('subscribed_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      return [];
    }
  }

  static async getSubscriberStats() {
    try {
      const [totalSubs, activeSubs, recentSubs] = await Promise.all([
        supabase.from('newsletter_subscribers').select('id', { count: 'exact' }),
        supabase.from('newsletter_subscribers').select('id', { count: 'exact' }).eq('is_active', true),
        supabase.from('newsletter_subscribers').select('id', { count: 'exact' }).eq('is_active', true).gte('subscribed_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      ]);

      return {
        total: totalSubs.count || 0,
        active: activeSubs.count || 0,
        recent: recentSubs.count || 0
      };
    } catch (error) {
      return {
        total: 0,
        active: 0,
        recent: 0
      };
    }
  }

  // Newsletter Campaign Management
  static async createCampaign(campaign: Omit<NewsletterCampaign, 'id' | 'created_at' | 'updated_at' | 'recipient_count' | 'open_count' | 'click_count'>): Promise<NewsletterCampaign | null> {
    try {
      const { data, error } = await supabase
        .from('newsletter_campaigns')
        .insert({
          ...campaign,
          recipient_count: 0,
          open_count: 0,
          click_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      return null;
    }
  }

  static async getCampaigns(): Promise<NewsletterCampaign[]> {
    try {
      const { data, error } = await supabase
        .from('newsletter_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      return [];
    }
  }

  static async updateCampaign(id: string, updates: Partial<NewsletterCampaign>): Promise<NewsletterCampaign | null> {
    try {
      const { data, error } = await supabase
        .from('newsletter_campaigns')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      return null;
    }
  }

  static async deleteCampaign(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('newsletter_campaigns')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      return false;
    }
  }

  static async sendCampaign(id: string, customEmails?: string): Promise<boolean> {
    try {
      // Get campaign details
      const { data: campaign, error: campaignError } = await supabase
        .from('newsletter_campaigns')
        .select('*')
        .eq('id', id)
        .single();

      if (campaignError || !campaign) {
        throw new Error('Campaign not found');
      }

      // Send using the new edge function
      const result = await this.sendNewsletterCampaign({
        campaign_id: id,
        subject: campaign.subject,
        content: campaign.content,
        html_content: campaign.html_content,
        custom_emails: customEmails
      });

      return result.success;
    } catch (error) {
      return false;
    }
  }

  static async sendNewsletterCampaign(campaignData: {
    campaign_id: string;
    subject: string;
    content: string;
    html_content?: string;
    custom_emails?: string;
  }): Promise<{
    success: boolean;
    total_sent?: number;
    total_failed?: number;
    results?: {
      successful: number;
      failed: number;
      failed_emails: Array<{ email: string; error: string }>;
    };
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('send-newsletter-campaign', {
        body: campaignData
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to send newsletter'
      };
    }
  }

  // Legacy method - kept for backward compatibility
  static async sendBulkEmails(campaign: NewsletterCampaign, subscribers: NewsletterSubscriber[]): Promise<{success: boolean, sent: number, failed: number}> {
    try {
      const result = await this.sendNewsletterCampaign({
        campaign_id: campaign.id,
        subject: campaign.subject,
        content: campaign.content,
        html_content: campaign.html_content
      });

      return {
        success: result.success,
        sent: result.total_sent || 0,
        failed: result.total_failed || 0
      };
    } catch (error) {
      return { success: false, sent: 0, failed: subscribers.length };
    }
  }

  // This method is now handled by the bulk email service
  // Individual email sending is done through EmailService or DirectEmailService

  static convertTextToHtml(text: string): string {
    return text
      .split('\n\n')
      .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
      .join('');
  }

  static async getScheduledCampaigns(): Promise<NewsletterCampaign[]> {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('newsletter_campaigns')
        .select('*')
        .eq('status', 'scheduled')
        .lte('scheduled_at', now);

      if (error) throw error;
      return data || [];
    } catch (error) {
      return [];
    }
  }

  static async processScheduledCampaigns(): Promise<void> {
    try {
      const scheduledCampaigns = await this.getScheduledCampaigns();
      
      for (const campaign of scheduledCampaigns) {
        await this.sendCampaign(campaign.id);
      }
    } catch (error) {
    }
  }

  // Newsletter Template Management
  static async createTemplate(template: Omit<NewsletterTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<NewsletterTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('newsletter_templates')
        .insert({
          ...template,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      return null;
    }
  }

  static async getTemplates(): Promise<NewsletterTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('newsletter_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      return [];
    }
  }

  static async updateTemplate(id: string, updates: Partial<NewsletterTemplate>): Promise<NewsletterTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('newsletter_templates')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      return null;
    }
  }

  static async deleteTemplate(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('newsletter_templates')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      return false;
    }
  }

  // Bulk removal methods
  static async removePendingSubscribers(): Promise<boolean> {
    try {
      // First get all pending subscribers
      const { data: pendingSubscribers, error: fetchError } = await supabase
        .from('newsletter_subscribers')
        .select('id, email, confirmed_at, is_active')
        .is('confirmed_at', null)
        .eq('is_active', true);

      if (fetchError) {
        throw fetchError;
      }

      if (!pendingSubscribers || pendingSubscribers.length === 0) {
        return true; // No pending subscribers to remove
      }

      // Delete the pending subscribers
      const { error: deleteError, count } = await supabase
        .from('newsletter_subscribers')
        .delete({ count: 'exact' })
        .in('id', pendingSubscribers.map(sub => sub.id));

      if (deleteError) {
        throw deleteError;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  static async removeAllSubscribers(): Promise<boolean> {
    try {
      // First check how many subscribers exist
      const { data: allSubscribers, error: fetchError } = await supabase
        .from('newsletter_subscribers')
        .select('id, email')
        .limit(1000); // Safety limit

      if (fetchError) {
        throw fetchError;
      }

      if (!allSubscribers || allSubscribers.length === 0) {
        return true;
      }

      // Delete all subscribers
      const { error: deleteError, count } = await supabase
        .from('newsletter_subscribers')
        .delete({ count: 'exact' })
        .in('id', allSubscribers.map(sub => sub.id));

      if (deleteError) {
        throw deleteError;
      }

      return true;
    } catch (error) {
      return false;
    }
  }
}