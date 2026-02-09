import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

serve(async (req) => {
  // Updated CORS headers to include x-client-info
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey'
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
    const { 
      attendee_name, 
      attendee_email, 
      event_title, 
      event_date, 
      event_time, 
      event_location, 
      event_room, 
      event_description,
      google_event_url,
      notes 
    } = body;

    // Format RSVP section if google_event_url exists
    const rsvpSection = google_event_url ? `
      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <h3 style="margin-top: 0; color: #856404;">⚠️ IMPORTANT: RSVP Required</h3>
        <p style="margin-bottom: 10px;"><strong>You must RSVP on the official event page to confirm your attendance and receive updates!</strong></p>
        <a href="${google_event_url}" style="display: inline-block; background-color: #4285f4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 10px;">
          📍 RSVP on Official Event Page
        </a>
      </div>
    ` : '';

    // Send email via Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'GDG Events <events@gdgpsu.dev>',
        to: [attendee_email],
        subject: `✅ Registration Confirmed: ${event_title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #4285f4;">Registration Confirmed! 🎉</h1>
            <p>Dear ${attendee_name},</p>
            <p>Thank you for registering for <strong>${event_title}</strong>!</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #4285f4;">📅 Event Details</h3>
              <p><strong>Date:</strong> ${new Date(event_date).toLocaleDateString()}</p>
              <p><strong>Time:</strong> ${event_time}</p>
              <p><strong>Location:</strong> ${event_location}</p>
              ${event_room ? `<p><strong>Room:</strong> ${event_room}</p>` : ''}
            </div>

            ${rsvpSection}

            ${notes ? `
              <div style="background-color: #e7f3ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Your Notes:</strong> ${notes}</p>
              </div>
            ` : ''}

            <p style="margin-top: 30px;">We're excited to see you there!</p>
            <p>Best regards,<br><strong>The GDG@PSU Team</strong></p>
          </div>
        `
      })
    });

    const emailData = await emailResponse.json();

    return new Response(JSON.stringify({
      success: true,
      message: 'Email sent',
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