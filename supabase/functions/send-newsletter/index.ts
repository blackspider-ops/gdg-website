import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NewsletterRequest {
  campaignId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { campaignId } = await req.json() as NewsletterRequest

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabaseClient
      .from('newsletter_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single()

    if (campaignError || !campaign) {
      throw new Error('Campaign not found')
    }

    // Get active subscribers
    const { data: subscribers, error: subscribersError } = await supabaseClient
      .from('newsletter_subscribers')
      .select('*')
      .eq('is_active', true)
      .not('confirmed_at', 'is', null)

    if (subscribersError) {
      throw new Error('Failed to fetch subscribers')
    }

    // Update campaign status to sending
    await supabaseClient
      .from('newsletter_campaigns')
      .update({
        status: 'sending',
        recipient_count: subscribers.length,
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId)

    // Send emails using Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      throw new Error('Resend API key not configured')
    }

    const fromEmail = Deno.env.get('FROM_EMAIL') || 'GDG@PSU <noreply@gdgpsu.com>'
    const baseUrl = Deno.env.get('SITE_URL') || 'https://gdgpsu.com'

    let successCount = 0
    let failureCount = 0
    const emailLogs = []

    // Send emails in batches to avoid rate limits
    const batchSize = 10
    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize)
      
      const batchPromises = batch.map(async (subscriber) => {
        try {
          // Create unsubscribe link
          const unsubscribeUrl = `${baseUrl}/newsletter/unsubscribe?token=${subscriber.unsubscribe_token}`
          
          // Prepare email content with unsubscribe link
          const emailContent = campaign.content + `\n\n---\nUnsubscribe: ${unsubscribeUrl}`
          const htmlContent = campaign.html_content 
            ? campaign.html_content + `<br><br><hr><p><a href="${unsubscribeUrl}">Unsubscribe</a></p>`
            : `<pre>${emailContent}</pre>`

          // Send email via Resend
          const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: fromEmail,
              to: [subscriber.email],
              subject: campaign.subject,
              text: emailContent,
              html: htmlContent,
              tags: [
                { name: 'campaign_id', value: campaignId },
                { name: 'newsletter', value: 'gdg-psu' }
              ]
            }),
          })

          const emailResult = await emailResponse.json()

          if (emailResponse.ok) {
            successCount++
            emailLogs.push({
              campaign_id: campaignId,
              subscriber_id: subscriber.id,
              email: subscriber.email,
              status: 'sent',
              resend_id: emailResult.id,
              sent_at: new Date().toISOString()
            })
          } else {
            failureCount++
            emailLogs.push({
              campaign_id: campaignId,
              subscriber_id: subscriber.id,
              email: subscriber.email,
              status: 'failed',
              error_message: emailResult.message || 'Unknown error',
              sent_at: new Date().toISOString()
            })
          }
        } catch (error) {
          failureCount++
          emailLogs.push({
            campaign_id: campaignId,
            subscriber_id: subscriber.id,
            email: subscriber.email,
            status: 'failed',
            error_message: error.message,
            sent_at: new Date().toISOString()
          })
        }
      })

      await Promise.all(batchPromises)
      
      // Small delay between batches to respect rate limits
      if (i + batchSize < subscribers.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    // Log email results
    if (emailLogs.length > 0) {
      await supabaseClient
        .from('newsletter_email_logs')
        .insert(emailLogs)
    }

    // Update campaign status
    const finalStatus = failureCount === 0 ? 'sent' : (successCount === 0 ? 'failed' : 'sent')
    await supabaseClient
      .from('newsletter_campaigns')
      .update({
        status: finalStatus,
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Newsletter sent successfully`,
        stats: {
          total: subscribers.length,
          success: successCount,
          failed: failureCount
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error sending newsletter:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})