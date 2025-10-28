import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

interface NewsletterCampaignRequest {
    campaign_id: string
    subject: string
    content: string
    html_content?: string
    custom_emails?: string
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        if (!RESEND_API_KEY) {
            throw new Error('RESEND_API_KEY is not set')
        }

        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set')
        }

        const emailData: NewsletterCampaignRequest = await req.json()

        // Validate required fields
        if (!emailData.campaign_id || !emailData.subject || !emailData.content) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields: campaign_id, subject, content' }),
                {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        // Initialize Supabase client
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        // Get campaign details
        const { data: campaign, error: campaignError } = await supabase
            .from('newsletter_campaigns')
            .select('*')
            .eq('id', emailData.campaign_id)
            .single()

        if (campaignError || !campaign) {
            return new Response(
                JSON.stringify({ error: 'Campaign not found' }),
                {
                    status: 404,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        // Get all active subscribers
        const { data: subscribers, error: subscribersError } = await supabase
            .from('newsletter_subscribers')
            .select('email, name, unsubscribe_token')
            .eq('is_active', true)
            .not('confirmed_at', 'is', null)

        if (subscribersError) {
            return new Response(
                JSON.stringify({ error: 'Failed to fetch subscribers' }),
                {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        // Initialize subscribers array (can be empty if no subscribers)
        const subscribersList = subscribers || [];

        // Parse custom emails if provided
        let customEmailList: string[] = [];
        if (emailData.custom_emails) {
            customEmailList = emailData.custom_emails
                .split(/[,\n\r]+/)
                .map(email => email.trim())
                .filter(email => {
                    // Basic email validation
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    return email && emailRegex.test(email);
                });
        }

        // Create email content
        const FROM_EMAIL = 'newsletter@gdgpsu.dev'
        const FROM_NAME = 'GDG@PSU Newsletter'

        // Create email template
        const htmlContent = createNewsletterEmailTemplate({
            subject: emailData.subject,
            content: emailData.content,
            htmlContent: emailData.html_content
        })

        const textContent = createNewsletterTextContent({
            subject: emailData.subject,
            content: emailData.content
        })

        // Combine all email addresses
        const subscriberEmails = subscribersList.map(sub => ({ email: sub.email, name: sub.name, unsubscribe_token: sub.unsubscribe_token }));
        const customEmails = customEmailList.map(email => ({ email, name: null, unsubscribe_token: null }));
        const allRecipients = [...subscriberEmails, ...customEmails];

        // Remove duplicates by email
        const uniqueRecipients = allRecipients.reduce((acc: any[], current) => {
            if (!acc.find(recipient => recipient.email === current.email)) {
                acc.push(current);
            }
            return acc;
        }, []);

        // Check if we have any recipients
        if (uniqueRecipients.length === 0) {
            return new Response(
                JSON.stringify({ error: 'No recipients found. Please add subscribers or custom email addresses.' }),
                {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        // Update campaign status to sending
        await supabase
            .from('newsletter_campaigns')
            .update({
                status: 'sending',
                recipient_count: uniqueRecipients.length
            })
            .eq('id', emailData.campaign_id)

        // Send emails to all recipients
        const emailPromises = uniqueRecipients.map(async (recipient) => {
            try {
                // Personalize content for this recipient
                const recipientName = recipient.name || null;
                const personalizedContent = recipientName
                    ? emailData.content.replace(/{name}/g, recipientName)
                    : emailData.content.replace(/Dear {name}/g, 'Dear subscriber').replace(/{name}/g, 'subscriber');

                const personalizedSubject = recipientName
                    ? emailData.subject.replace(/{name}/g, recipientName)
                    : emailData.subject.replace(/{name}/g, 'subscriber');

                // Create unsubscribe URL
                const unsubscribeUrl = recipient.unsubscribe_token
                    ? `${Deno.env.get('SITE_URL') || 'https://gdgpsu.dev'}/newsletter/unsubscribe?token=${recipient.unsubscribe_token}`
                    : null;

                const personalizedHtmlContent = createNewsletterEmailTemplate({
                    subject: personalizedSubject,
                    content: personalizedContent,
                    htmlContent: emailData.html_content,
                    recipientName,
                    unsubscribeUrl
                });

                const personalizedTextContent = createNewsletterTextContent({
                    subject: personalizedSubject,
                    content: personalizedContent,
                    recipientName,
                    unsubscribeUrl
                });

                const response = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${RESEND_API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        from: `${FROM_NAME} <${FROM_EMAIL}>`,
                        to: [recipient.email],
                        subject: personalizedSubject,
                        text: personalizedTextContent,
                        html: personalizedHtmlContent,
                        tags: [
                            { name: 'type', value: 'newsletter-campaign' },
                            { name: 'campaign_id', value: emailData.campaign_id }
                        ]
                    }),
                })

                const result = await response.json()

                if (response.ok) {
                    return { success: true, email: recipient.email, id: result.id }
                } else {
                    return { success: false, email: recipient.email, error: result.message }
                }
            } catch (error) {
                return { success: false, email: recipient.email, error: error.message }
            }
        })

        // Wait for all emails to be sent
        const results = await Promise.all(emailPromises)

        const successful = results.filter(r => r.success)
        const failed = results.filter(r => !r.success)

        // Update campaign status
        const finalStatus = failed.length === 0 ? 'sent' : (successful.length > 0 ? 'sent' : 'failed');
        await supabase
            .from('newsletter_campaigns')
            .update({
                status: finalStatus,
                sent_at: new Date().toISOString(),
                recipient_count: successful.length
            })
            .eq('id', emailData.campaign_id)

        return new Response(
            JSON.stringify({
                success: true,
                total_sent: successful.length,
                total_failed: failed.length,
                results: {
                    successful: successful.length,
                    failed: failed.length,
                    failed_emails: failed.map(f => ({ email: f.email, error: f.error }))
                }
            }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )
    }
})

function createNewsletterEmailTemplate(params: {
    subject: string
    content: string
    htmlContent?: string
    recipientName?: string | null
    unsubscribeUrl?: string | null
}): string {
    const { subject, content, htmlContent, recipientName, unsubscribeUrl } = params

    const greeting = recipientName ? `Hello ${recipientName}!` : 'Hello!'
    const finalContent = htmlContent || content.split('\n').map(paragraph => `<p>${paragraph}</p>`).join('')

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6; 
          color: #333; 
          max-width: 600px; 
          margin: 0 auto; 
          padding: 0;
          background-color: #f8f9fa;
        }
        .container {
          background-color: #ffffff;
          margin: 20px;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header { 
          background: linear-gradient(135deg, #4285f4 0%, #34a853 100%);
          color: white; 
          padding: 30px 20px; 
          text-align: center; 
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
        }
        .content { 
          padding: 30px 20px;
          background-color: #ffffff;
        }
        .content p {
          margin-bottom: 16px;
        }
        .content a {
          color: #4285f4;
          text-decoration: none;
        }
        .content a:hover {
          text-decoration: underline;
        }
        .footer {
          background-color: #f8f9fa;
          padding: 20px;
          text-align: center;
          border-top: 1px solid #e9ecef;
          font-size: 12px;
          color: #666;
        }
        .unsubscribe {
          margin-top: 10px;
        }
        .unsubscribe a {
          color: #666;
          text-decoration: none;
        }
        @media (max-width: 600px) {
          .container {
            margin: 10px;
          }
          .header, .content {
            padding: 20px 15px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚀 GDG@PSU Newsletter</h1>
        </div>
        <div class="content">
          <p>${greeting}</p>
          ${finalContent}
          <p>Best regards,<br>
          <strong>The GDG@PSU Team</strong></p>
        </div>
        <div class="footer">
          <p>You're receiving this email because you subscribed to GDG@PSU newsletter.</p>
          <p>GDG@PSU - Google Developer Group at Penn State University</p>
          ${unsubscribeUrl ? `<div class="unsubscribe"><a href="${unsubscribeUrl}">Unsubscribe</a></div>` : ''}
        </div>
      </div>
    </body>
    </html>
  `
}

function createNewsletterTextContent(params: {
    subject: string
    content: string
    recipientName?: string | null
    unsubscribeUrl?: string | null
}): string {
    const { subject, content, recipientName, unsubscribeUrl } = params

    const greeting = recipientName ? `Hello ${recipientName}!` : 'Hello!'

    return `GDG@PSU NEWSLETTER

${greeting}

${content}

Best regards,
The GDG@PSU Team

---
You're receiving this email because you subscribed to GDG@PSU newsletter.
GDG@PSU - Google Developer Group at Penn State University

${unsubscribeUrl ? `To unsubscribe, visit: ${unsubscribeUrl}` : ''}`
}