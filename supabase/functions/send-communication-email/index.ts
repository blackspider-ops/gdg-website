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

interface CommunicationEmailRequest {
    to_emails: string[]
    subject: string
    message: string
    email_type: 'announcement' | 'task_notification' | 'direct_message' | 'custom'
    sender_name?: string
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

        const emailData: CommunicationEmailRequest = await req.json()

        // Validate required fields
        if (!emailData.to_emails || !emailData.subject || !emailData.message) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields: to_emails, subject, message' }),
                {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        if (!Array.isArray(emailData.to_emails) || emailData.to_emails.length === 0) {
            return new Response(
                JSON.stringify({ error: 'to_emails must be a non-empty array' }),
                {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        // Create email content
        const FROM_EMAIL = 'communications@decryptpsu.me'
        const FROM_NAME = emailData.sender_name || 'GDG@PSU Communications'

        // Create email template based on type
        const htmlContent = createCommunicationEmailTemplate({
            subject: emailData.subject,
            message: emailData.message,
            emailType: emailData.email_type,
            senderName: FROM_NAME
        })

        const textContent = createTextContent({
            subject: emailData.subject,
            message: emailData.message,
            emailType: emailData.email_type,
            senderName: FROM_NAME
        })

        // Send emails to all recipients
        const emailPromises = emailData.to_emails.map(async (email) => {
            try {
                const response = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${RESEND_API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        from: `${FROM_NAME} <${FROM_EMAIL}>`,
                        to: [email],
                        subject: emailData.subject,
                        text: textContent,
                        html: htmlContent,
                        tags: [
                            { name: 'type', value: 'communication' },
                            { name: 'email_type', value: emailData.email_type },
                            { name: 'source', value: 'gdg-psu-admin' }
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

function createCommunicationEmailTemplate(params: {
    subject: string
    message: string
    emailType: string
    senderName: string
}): string {
    const { subject, message, emailType, senderName } = params

    const headerText = emailType === 'announcement' ? '📢 Team Announcement' :
        emailType === 'task_notification' ? '📋 Task Notification' :
            emailType === 'direct_message' ? '💬 Direct Message' :
                '📧 Communication'

    const headerColor = emailType === 'announcement' ? '#4285f4' :
        emailType === 'task_notification' ? '#34a853' :
            emailType === 'direct_message' ? '#ea4335' :
                '#4285f4'

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
          background: linear-gradient(135deg, ${headerColor} 0%, #34a853 100%);
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
        .message-content {
          background-color: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
          border-left: 4px solid ${headerColor};
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
          <h2>${subject}</h2>
          
          <div class="message-content">
            ${message.split('\n').map(paragraph => `<p>${paragraph}</p>`).join('')}
          </div>

          <p>Best regards,<br>
          <strong>${senderName}</strong></p>
        </div>
        <div class="footer">
          <p>This is an automated message from the GDG@PSU Communications Hub.</p>
          <p>GDG@PSU - Google Developer Group at Penn State University</p>
        </div>
      </div>
    </body>
    </html>
  `
}

function createTextContent(params: {
    subject: string
    message: string
    emailType: string
    senderName: string
}): string {
    const { subject, message, emailType, senderName } = params

    const headerText = emailType === 'announcement' ? 'TEAM ANNOUNCEMENT' :
        emailType === 'task_notification' ? 'TASK NOTIFICATION' :
            emailType === 'direct_message' ? 'DIRECT MESSAGE' :
                'COMMUNICATION'

    return `${headerText}

${subject}

${message}

Best regards,
${senderName}

---
This is an automated message from the GDG@PSU Communications Hub.
GDG@PSU - Google Developer Group at Penn State University`
}