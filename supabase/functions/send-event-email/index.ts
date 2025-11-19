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

interface EventEmailRequest {
    event_id: string
    subject: string
    message: string
    email_type: 'reminder' | 'thank_you' | 'update' | 'custom'
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

        const emailData: EventEmailRequest = await req.json()

        // Validate required fields
        if (!emailData.event_id || !emailData.subject || !emailData.message) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields: event_id, subject, message' }),
                {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        // Initialize Supabase client
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        // Get event details
        const { data: event, error: eventError } = await supabase
            .from('events')
            .select('*')
            .eq('id', emailData.event_id)
            .single()

        if (eventError || !event) {
            return new Response(
                JSON.stringify({ error: 'Event not found' }),
                {
                    status: 404,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        // Get all attendees for this event
        const { data: attendees, error: attendeesError } = await supabase
            .from('event_attendance')
            .select('attendee_email, attendee_name')
            .eq('event_id', emailData.event_id)

        if (attendeesError) {
            return new Response(
                JSON.stringify({ error: 'Failed to fetch attendees' }),
                {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        // Initialize attendees array (can be empty if no attendees)
        const attendeesList = attendees || [];

        // Get unique attendees by email
        const uniqueAttendees = attendeesList.reduce((acc: any[], current) => {
            if (!acc.find(attendee => attendee.attendee_email === current.attendee_email)) {
                acc.push(current);
            }
            return acc;
        }, []);

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
        const FROM_EMAIL = 'events@gdgpsu.dev'
        const FROM_NAME = 'GDG@PSU Events'

        const eventDate = new Date(event.date)
        const isUpcoming = eventDate > new Date()

        // Create email template
        const htmlContent = createEventEmailTemplate({
            eventTitle: event.title,
            eventDate: eventDate.toLocaleDateString(),
            eventTime: eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            eventLocation: event.location,
            message: emailData.message,
            emailType: emailData.email_type,
            isUpcoming
        })

        const textContent = createTextContent({
            eventTitle: event.title,
            eventDate: eventDate.toLocaleDateString(),
            eventTime: eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            eventLocation: event.location,
            message: emailData.message,
            emailType: emailData.email_type,
            isUpcoming
        })

        // Combine all email addresses
        const allEmails = [
            ...uniqueAttendees.map(attendee => attendee.attendee_email),
            ...customEmailList
        ];

        // Remove duplicates
        const uniqueEmails = [...new Set(allEmails)];

        // Check if we have any recipients
        if (uniqueEmails.length === 0) {
            return new Response(
                JSON.stringify({ error: 'No recipients found. Please add attendees or custom email addresses.' }),
                {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        // Send emails to all recipients
        const emailPromises = uniqueEmails.map(async (email) => {
            try {
                // Find the attendee name for personalization
                const attendee = uniqueAttendees.find(a => a.attendee_email === email);
                const recipientName = attendee ? attendee.attendee_name : null;
                
                // Personalize the content for this recipient
                const personalizedMessage = recipientName 
                    ? emailData.message.replace(/{name}/g, recipientName)
                    : emailData.message.replace(/Dear {name}/g, 'Dear attendees').replace(/{name}/g, 'attendees');
                    
                const personalizedSubject = recipientName 
                    ? emailData.subject.replace(/{name}/g, recipientName)
                    : emailData.subject.replace(/{name}/g, 'attendees');
                
                const personalizedHtmlContent = createEventEmailTemplate({
                    eventTitle: event.title,
                    eventDate: eventDate.toLocaleDateString(),
                    eventTime: eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    eventLocation: event.location,
                    message: personalizedMessage,
                    emailType: emailData.email_type,
                    isUpcoming,
                    recipientName
                });

                const personalizedTextContent = createTextContent({
                    eventTitle: event.title,
                    eventDate: eventDate.toLocaleDateString(),
                    eventTime: eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    eventLocation: event.location,
                    message: personalizedMessage,
                    emailType: emailData.email_type,
                    isUpcoming,
                    recipientName
                });

                const response = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${RESEND_API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        from: `${FROM_NAME} <${FROM_EMAIL}>`,
                        to: [email],
                        subject: personalizedSubject,
                        text: personalizedTextContent,
                        html: personalizedHtmlContent,
                        tags: [
                            { name: 'type', value: 'event-email' },
                            { name: 'event_id', value: emailData.event_id },
                            { name: 'email_type', value: emailData.email_type }
                        ]
                    }),
                })

                const result = await response.json()

                if (response.ok) {
                    return { success: true, email: email, id: result.id }
                } else {
                    return { success: false, email: email, error: result.message }
                }
            } catch (error) {
                return { success: false, email: email, error: error.message }
            }
        })

        // Wait for all emails to be sent
        const results = await Promise.all(emailPromises)

        const successful = results.filter(r => r.success)
        const failed = results.filter(r => !r.success)

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

function createEventEmailTemplate(params: {
    eventTitle: string
    eventDate: string
    eventTime: string
    eventLocation: string
    message: string
    emailType: string
    isUpcoming: boolean
    recipientName?: string
}): string {
    const { eventTitle, eventDate, eventTime, eventLocation, message, emailType, isUpcoming, recipientName } = params

    const headerText = emailType === 'reminder' ? '📅 Event Reminder' :
        emailType === 'thank_you' ? '🙏 Thank You!' :
            emailType === 'update' ? '📢 Event Update' :
                '📧 Event Communication'

    const greeting = isUpcoming ? 'We hope you\'re excited about the upcoming event!' :
        'Thank you for attending our event!'

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${eventTitle}</title>
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
        .event-details {
          background-color: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
          border-left: 4px solid #4285f4;
        }
        .event-details h3 {
          margin: 0 0 15px 0;
          color: #4285f4;
          font-size: 18px;
        }
        .detail-item {
          margin: 8px 0;
          display: flex;
          align-items: center;
        }
        .detail-icon {
          margin-right: 10px;
          font-size: 16px;
        }
        .message-content {
          background-color: #ffffff;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .footer {
          background-color: #f8f9fa;
          padding: 20px;
          text-align: center;
          border-top: 1px solid #e9ecef;
          font-size: 12px;
          color: #666;
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
          <h1>${headerText}</h1>
        </div>
        <div class="content">
          <p>${recipientName ? `Hello ${recipientName}!` : 'Hello!'}</p>
          <p>${greeting}</p>
          
          <div class="event-details">
            <h3>${eventTitle}</h3>
            <div class="detail-item">
              <span class="detail-icon">📅</span>
              <span><strong>Date:</strong> ${eventDate}</span>
            </div>
            <div class="detail-item">
              <span class="detail-icon">🕒</span>
              <span><strong>Time:</strong> ${eventTime}</span>
            </div>
            <div class="detail-item">
              <span class="detail-icon">📍</span>
              <span><strong>Location:</strong> ${eventLocation}</span>
            </div>
          </div>

          <div class="message-content">
            ${message.split('\n').map(paragraph => `<p>${paragraph}</p>`).join('')}
          </div>

          <p>Best regards,<br>
          <strong>The GDG@PSU Team</strong></p>
        </div>
        <div class="footer">
          <p>You're receiving this email because you registered for this GDG@PSU event.</p>
          <p>GDG@PSU - Google Developer Group at Penn State University</p>
        </div>
      </div>
    </body>
    </html>
  `
}

function createTextContent(params: {
    eventTitle: string
    eventDate: string
    eventTime: string
    eventLocation: string
    message: string
    emailType: string
    isUpcoming: boolean
    recipientName?: string
}): string {
    const { eventTitle, eventDate, eventTime, eventLocation, message, emailType, isUpcoming, recipientName } = params

    const headerText = emailType === 'reminder' ? 'EVENT REMINDER' :
        emailType === 'thank_you' ? 'THANK YOU!' :
            emailType === 'update' ? 'EVENT UPDATE' :
                'EVENT COMMUNICATION'

    const greeting = isUpcoming ? 'We hope you\'re excited about the upcoming event!' :
        'Thank you for attending our event!'

    return `${headerText}

${recipientName ? `Hello ${recipientName}!` : 'Hello!'}

${greeting}

EVENT DETAILS:
${eventTitle}

📅 Date: ${eventDate}
🕒 Time: ${eventTime}
📍 Location: ${eventLocation}

MESSAGE:
${message}

Best regards,
The GDG@PSU Team

---
You're receiving this email because you registered for this GDG@PSU event.
GDG@PSU - Google Developer Group at Penn State University`
}