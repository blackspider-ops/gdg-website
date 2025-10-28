import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

interface EmailRequest {
  to: string
  subject: string
  content: string
  html_content?: string
  subscriber_name?: string
  unsubscribe_url?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Edge function called - send-email');
    console.log('RESEND_API_KEY exists:', !!RESEND_API_KEY);
    
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not set in edge function environment');
      throw new Error('RESEND_API_KEY is not set')
    }

    const emailData: EmailRequest = await req.json()
    console.log('Email request data:', { to: emailData.to, subject: emailData.subject });

    // Validate required fields
    if (!emailData.to || !emailData.subject || !emailData.content) {
      console.error('Missing required fields:', { to: !!emailData.to, subject: !!emailData.subject, content: !!emailData.content });
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, content' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create email template
    const FROM_EMAIL = 'newsletter@gdgpsu.dev'
    const FROM_NAME = 'GDG@PSU Newsletter'

    // Create unsubscribe footer
    const textFooter = `\n\n---\nYou're receiving this email because you subscribed to GDG@PSU newsletter.\nTo unsubscribe, visit: ${emailData.unsubscribe_url || '#'}`
    
    const htmlFooter = `
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
      <div style="font-size: 12px; color: #666; text-align: center; padding: 20px;">
        <p>You're receiving this email because you subscribed to GDG@PSU newsletter.</p>
        ${emailData.unsubscribe_url ? `<p><a href="${emailData.unsubscribe_url}" style="color: #666;">Unsubscribe</a></p>` : ''}
      </div>
    `

    const finalTextContent = emailData.content + textFooter
    const finalHtmlContent = wrapInTemplate(
      (emailData.html_content || convertTextToHtml(emailData.content)) + htmlFooter,
      emailData.subject
    )

    // Send email via Resend API
    console.log('Sending email to Resend API...');
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [emailData.to],
        subject: emailData.subject,
        text: finalTextContent,
        html: finalHtmlContent,
        tags: [
          { name: 'type', value: 'newsletter' },
          { name: 'source', value: 'gdg-psu-admin' }
        ]
      }),
    })

    const result = await response.json()
    console.log('Resend API response:', { status: response.status, result });

    if (response.ok) {
      console.log('Email sent successfully:', result.id);
      return new Response(
        JSON.stringify({ success: true, id: result.id }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    } else {
      console.error('Resend API error:', result);
      return new Response(
        JSON.stringify({ success: false, error: result.message || 'Unknown error' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
  } catch (error) {
    console.error('Error sending email:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

function convertTextToHtml(text: string): string {
  return text
    .split('\n\n')
    .map(paragraph => `<p style="margin-bottom: 16px;">${paragraph.replace(/\n/g, '<br>')}</p>`)
    .join('')
}

function wrapInTemplate(content: string, subject: string): string {
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
          ${content}
        </div>
      </div>
    </body>
    </html>
  `
}