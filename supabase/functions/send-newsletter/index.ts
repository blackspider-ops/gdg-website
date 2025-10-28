import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
serve(async (req)=>{
  // Simple CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: corsHeaders
    });
  }
  try {
    const body = await req.json();
    const { subscriber_email, subscriber_name, confirmation_token, confirmation_url } = body;
    // Send newsletter confirmation email via Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'GDG Newsletter <newsletter@gdgpsu.dev>',
        to: [
          subscriber_email
        ],
        subject: '📧 Confirm your newsletter subscription',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Confirm Newsletter Subscription</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 0 auto; }
              .header { background: #4285f4; color: white; padding: 30px 20px; text-align: center; }
              .header h1 { margin: 0; font-size: 24px; }
              .content { padding: 30px 20px; background: #f9f9f9; }
              .button { display: inline-block; padding: 15px 30px; background: #4285f4; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
              .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; background: #f0f0f0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Welcome to GDG Newsletter! 📧</h1>
              </div>
              <div class="content">
                <p>Hi ${subscriber_name},</p>
                <p>Thank you for subscribing to the GDG newsletter! You're one step away from getting the latest updates on:</p>
                <ul>
                  <li>🎯 Upcoming workshops and events</li>
                  <li>💡 Tech talks and learning opportunities</li>
                  <li>🤝 Networking events and community highlights</li>
                  <li>📚 Resources and development tips</li>
                </ul>
                
                <p><strong>Please confirm your subscription by clicking the button below:</strong></p>
                
                <div style="text-align: center;">
                  <a href="${confirmation_url}" class="button">Confirm Subscription</a>
                </div>
                
                <p style="font-size: 14px; color: #666;">
                  If the button doesn't work, copy and paste this link into your browser:<br>
                  <a href="${confirmation_url}">${confirmation_url}</a>
                </p>
                
                <p>If you didn't subscribe to this newsletter, you can safely ignore this email.</p>
                
                <p>Best regards,<br><strong>The GDG Team</strong></p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Google Developer Groups</p>
              </div>
            </div>
          </body>
          </html>
        `
      })
    });
    const emailData = await emailResponse.json();
    return new Response(JSON.stringify({
      success: true,
      message: 'Newsletter confirmation email sent',
      emailId: emailData.id
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
