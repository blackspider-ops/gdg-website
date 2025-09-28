import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

interface CommentNotificationRequest {
  comment_id: string
  blog_post_title: string
  blog_post_slug: string
  author_name: string
  author_email: string
  comment_content: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'RESEND_API_KEY is not set' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { 
      comment_id, 
      blog_post_title, 
      blog_post_slug, 
      author_name, 
      author_email, 
      comment_content 
    }: CommentNotificationRequest = await req.json()

    // Validate required fields
    if (!comment_id || !blog_post_title || !author_name || !comment_content) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get all blog editor emails
    const { data: blogEditors, error: editorsError } = await supabase
      .from('admin_users')
      .select('email')
      .eq('role', 'blog_editor')
      .eq('is_active', true)

    if (editorsError) {
      // Continue without blog editors if fetch fails
    }

    // Prepare recipient list
    const recipients = ['gdg@psu.edu']
    if (blogEditors && blogEditors.length > 0) {
      recipients.push(...blogEditors.map(editor => editor.email))
    }

    // Email content
    const subject = `New Blog Comment Pending Review - ${blog_post_title}`
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Comment Pending Review</title>
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
            .comment-content {
              background-color: #ffffff;
              border: 1px solid #e9ecef;
              border-radius: 8px;
              padding: 20px;
              white-space: pre-wrap;
              font-style: italic;
            }
            .action-buttons { 
              text-align: center; 
              margin: 30px 0; 
            }
            .btn { 
              display: inline-block; 
              padding: 12px 24px; 
              margin: 0 10px; 
              text-decoration: none; 
              border-radius: 6px; 
              font-weight: 500; 
            }
            .btn-primary { 
              background-color: #4285f4; 
              color: white; 
            }
            .btn-secondary { 
              background-color: #f1f3f4; 
              color: #5f6368; 
            }
            .footer {
              background-color: #f8f9fa;
              padding: 20px;
              text-align: center;
              border-top: 1px solid #e9ecef;
              font-size: 12px;
              color: #666;
            }
            .footer a { 
              color: #1a73e8; 
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
              <h1>📝 New Blog Comment</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">A new comment is pending your review</p>
            </div>
            
            <div class="content">
              <div class="field">
                <div class="field-label">Blog Post</div>
                <div class="field-value">${blog_post_title}</div>
              </div>

              <div class="field">
                <div class="field-label">Author</div>
                <div class="field-value">${author_name}</div>
              </div>

              <div class="field">
                <div class="field-label">Email</div>
                <div class="field-value">${author_email}</div>
              </div>

              <div class="field">
                <div class="field-label">Submitted</div>
                <div class="field-value">${new Date().toLocaleString()}</div>
              </div>

              <div class="field">
                <div class="field-label">Comment Content</div>
                <div class="comment-content">"${comment_content}"</div>
              </div>

              <div class="action-buttons">
                <a href="${Deno.env.get('SITE_URL') || 'https://gdgpsu.org'}/admin/blog?tab=comments" class="btn btn-primary">
                  Review Comments
                </a>
                <a href="${Deno.env.get('SITE_URL') || 'https://gdgpsu.org'}/blog/${blog_post_slug}" class="btn btn-secondary">
                  View Blog Post
                </a>
              </div>

              <p style="color: #5f6368; font-size: 14px; margin-top: 30px;">
                💡 <strong>Quick Actions:</strong> Admins and blog editors can approve, reject, or flag this comment from the admin panel. 
                Comments remain hidden from the public until approved.
              </p>
            </div>

            <div class="footer">
              <p>This is an automated notification from the GDG@PSU Blog Comment System.</p>
              <p>
                <a href="${Deno.env.get('SITE_URL') || 'https://gdgpsu.org'}/admin">Admin Dashboard</a> | 
                <a href="${Deno.env.get('SITE_URL') || 'https://gdgpsu.org'}">GDG@PSU Website</a>
              </p>
              <p style="margin-top: 15px; font-size: 12px; color: #9aa0a6;">
                GDG@PSU - Google Developer Group at Penn State University
              </p>
            </div>
          </div>
        </body>
      </html>
    `

    const textContent = `
New Blog Comment Pending Review

Blog Post: ${blog_post_title}
Author: ${author_name} (${author_email})
Submitted: ${new Date().toLocaleString()}

Comment:
"${comment_content}"

Please review this comment in the admin panel:
${Deno.env.get('SITE_URL') || 'https://gdgpsu.org'}/admin/blog?tab=comments

View the blog post:
${Deno.env.get('SITE_URL') || 'https://gdgpsu.org'}/blog/${blog_post_slug}

Admins and blog editors can approve, reject, or flag comments from the admin panel.
Comments remain hidden from the public until approved.

---
This is an automated notification from the GDG@PSU Blog Comment System.
GDG@PSU - Google Developer Group at Penn State University
    `

    // Prepare email payload
    const emailPayload = {
      from: 'GDG@PSU Blog <contact@decryptpsu.me>',
      to: recipients,
      subject: subject,
      html: htmlContent,
      text: textContent,
      tags: [
        { name: 'type', value: 'comment-notification' },
        { name: 'blog_post', value: blog_post_slug }
      ]
    }

    // Send email using Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    })

    const emailResult = await emailResponse.json()

    if (emailResponse.ok) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Comment notification sent successfully to ${recipients.length} recipients`,
          email_id: emailResult.id,
          recipients: recipients.length
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    } else {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: emailResult.message || 'Failed to send email' 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})