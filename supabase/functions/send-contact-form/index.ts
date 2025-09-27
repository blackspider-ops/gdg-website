import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

interface ContactFormRequest {
  name: string
  email: string
  type: string
  message: string
  interests?: string[]
  fileUploadId?: string
  fileName?: string
}

interface EmailAttachment {
  filename: string
  content: string
  type: string
  disposition: string
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
      'speaker': 'Speaking Opportunity',
      'blog_submission': 'Blog Submission'
    }

    const contactTypeLabel = contactTypeLabels[formData.type] || formData.type

    // Handle file attachment for blog submissions
    let attachment: EmailAttachment | null = null


    if (formData.type === 'blog_submission' && formData.fileUploadId) {
      try {
        let filePath = ''
        let fileName = formData.fileName || 'blog-submission.pdf'
        let mimeType = 'application/pdf'

        // Get file info from blog_submissions table using the submission ID
        const { data: submissionRecord, error: submissionError } = await supabase
          .from('blog_submissions')
          .select('file_path, original_name, mime_type')
          .eq('id', formData.fileUploadId)
          .single()



        if (submissionRecord && !submissionError) {
          filePath = submissionRecord.file_path
          fileName = submissionRecord.original_name
          mimeType = submissionRecord.mime_type
        } else {
          // Fallback: check if it's a direct file path (for backward compatibility)
          filePath = formData.fileUploadId || ''
          fileName = formData.fileName || 'blog-submission.pdf'
          mimeType = 'application/pdf'

        }



        if (filePath) {
          // Try blog-submissions bucket first, then fallback to media bucket
          let fileBlob = null
          let downloadError = null

          try {
            const result = await supabase.storage
              .from('blog-submissions')
              .download(filePath)
            fileBlob = result.data
            downloadError = result.error
          } catch (blogBucketError) {

            // Fallback to media bucket for backward compatibility
            const result = await supabase.storage
              .from('media')
              .download(filePath)
            fileBlob = result.data
            downloadError = result.error
          }



          if (fileBlob && !downloadError) {
            // Convert blob to base64 using Deno's standard library (handles large files properly)
            const arrayBuffer = await fileBlob.arrayBuffer()
            const uint8Array = new Uint8Array(arrayBuffer)
            
            // Use Deno's standard library base64 encoder - this handles large files correctly
            const base64Content = base64Encode(uint8Array)

            attachment = {
              filename: fileName,
              content: base64Content,
              type: mimeType,
              disposition: 'attachment'
            }

          }
        }
      } catch (error) {
        // Continue without attachment if there's an error
      }
    }

    // Create email template
    const htmlContent = createContactEmailTemplate({
      name: formData.name,
      email: formData.email,
      type: contactTypeLabel,
      message: formData.message,
      interests: formData.interests || [],
      hasAttachment: !!attachment,
      fileName: formData.fileName
    })

    const textContent = createContactTextContent({
      name: formData.name,
      email: formData.email,
      type: contactTypeLabel,
      message: formData.message,
      interests: formData.interests || [],
      hasAttachment: !!attachment,
      fileName: formData.fileName
    })

    // Prepare email payload
    const emailPayload: {
      from: string
      to: string[]
      reply_to: string
      subject: string
      text: string
      html: string
      tags: Array<{ name: string; value: string }>
      attachments?: EmailAttachment[]
    } = {
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
    }

    // Add attachment if available
    if (attachment) {
      emailPayload.attachments = [attachment]
    }

    // Send email to club email
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
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
  hasAttachment?: boolean
  fileName?: string
}): string {
  const { name, email, type, message, interests, hasAttachment, fileName } = params

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

          ${hasAttachment ? `
          <div class="field">
            <div class="field-label">📎 Attached File</div>
            <div class="field-value">
              <span style="background-color: #e3f2fd; color: #1976d2; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 500;">
                📄 ${fileName || 'Blog Submission File'}
              </span>
            </div>
          </div>
          ` : ''}

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
  hasAttachment?: boolean
  fileName?: string
}): string {
  const { name, email, type, message, interests, hasAttachment, fileName } = params

  return `CONTACT FORM SUBMISSION

Contact Type: ${type}
Name: ${name}
Email: ${email}
${interests.length > 0 ? `Areas of Interest: ${interests.join(', ')}` : ''}
${hasAttachment ? `Attached File: ${fileName || 'Blog Submission File'}` : ''}

MESSAGE:
${message}

---
Reply to this email to respond directly to ${name}.
This message was sent via the GDG@PSU contact form.
Submitted on ${new Date().toLocaleString()}`
}