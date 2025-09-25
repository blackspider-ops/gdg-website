import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

interface ContactFormRequest {
    name: string
    email: string
    type: string
    message: string
    interests?: string[]
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

        const formData: ContactFormRequest = await req.json()

        // Validate required fields
        if (!formData.name || !formData.email || !formData.message) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields: name, email, message' }),
                {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        // Create email content
        const FROM_EMAIL = 'contact@decryptpsu.me'
        const FROM_NAME = 'GDG@PSU Contact Form'
        const TO_EMAIL = 'gdg@psu.edu'

        // Map contact types to readable labels
        const contactTypeLabels: Record<string, string> = {
            'general': 'General Inquiry',
            'join': 'Join Chapter',
            'volunteer': 'Volunteer Opportunity',
            'sponsor': 'Partnership/Sponsorship',
            'speaker': 'Speaking Opportunity'
        }

        const contactTypeLabel = contactTypeLabels[formData.type] || formData.type

        // Create email template
        const htmlContent = createContactEmailTemplate({
            name: formData.name,
            email: formData.email,
            type: contactTypeLabel,
            message: formData.message,
            interests: formData.interests || []
        })

        const textContent = createContactTextContent({
            name: formData.name,
            email: formData.email,
            type: contactTypeLabel,
            message: formData.message,
            interests: formData.interests || []
        })

        // Send email to club email
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: `${FROM_NAME} <${FROM_EMAIL}>`,
                to: [TO_EMAIL],
                reply_to: formData.email,
                subject: `Contact Form: ${contactTypeLabel} - ${formData.name}`,
                text: textContent,
                html: htmlContent,
                tags: [
                    { name: 'type', value: 'contact-form' },
                    { name: 'contact_type', value: formData.type }
                ]
            }),
        })

        const result = await response.json()

        if (response.ok) {
            return new Response(
                JSON.stringify({
                    success: true,
                    message: 'Contact form submitted successfully',
                    id: result.id
                }),
                {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        } else {
            return new Response(
                JSON.stringify({ success: false, error: result.message || 'Failed to send email' }),
                {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

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

function createContactEmailTemplate(params: {
    name: string
    email: string
    type: string
    message: string
    interests: string[]
}): string {
    const { name, email, type, message, interests } = params

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Contact Form Submission - ${type}</title>
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
        .field {
          margin-bottom: 20px;
          padding: 15px;
          background-color: #f8f9fa;
          border-radius: 8px;
          border-left: 4px solid #4285f4;
        }
        .field-label {
          font-weight: 600;
          color: #4285f4;
          margin-bottom: 5px;
        }
        .field-value {
          color: #333;
        }
        .interests {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
        }
        .interest-tag {
          background-color: #e3f2fd;
          color: #1976d2;
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 12px;
          font-weight: 500;
        }
        .message-content {
          background-color: #ffffff;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 20px;
          white-space: pre-wrap;
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
          <h1>📧 Contact Form Submission</h1>
        </div>
        <div class="content">
          <div class="field">
            <div class="field-label">Contact Type</div>
            <div class="field-value">${type}</div>
          </div>

          <div class="field">
            <div class="field-label">Name</div>
            <div class="field-value">${name}</div>
          </div>

          <div class="field">
            <div class="field-label">Email</div>
            <div class="field-value">${email}</div>
          </div>

          ${interests.length > 0 ? `
          <div class="field">
            <div class="field-label">Areas of Interest</div>
            <div class="interests">
              ${interests.map(interest => `<span class="interest-tag">${interest}</span>`).join('')}
            </div>
          </div>
          ` : ''}

          <div class="field">
            <div class="field-label">Message</div>
            <div class="message-content">${message}</div>
          </div>

          <p><strong>Reply to this email to respond directly to ${name}.</strong></p>
        </div>
        <div class="footer">
          <p>This message was sent via the GDG@PSU contact form.</p>
          <p>Submitted on ${new Date().toLocaleString()}</p>
        </div>
      </div>
    </body>
    </html>
  `
}

function createContactTextContent(params: {
    name: string
    email: string
    type: string
    message: string
    interests: string[]
}): string {
    const { name, email, type, message, interests } = params

    return `CONTACT FORM SUBMISSION

Contact Type: ${type}
Name: ${name}
Email: ${email}
${interests.length > 0 ? `Areas of Interest: ${interests.join(', ')}` : ''}

MESSAGE:
${message}

---
Reply to this email to respond directly to ${name}.
This message was sent via the GDG@PSU contact form.
Submitted on ${new Date().toLocaleString()}`
}