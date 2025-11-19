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
      notes 
    } = body;

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
          <h1>Registration Confirmed! 🎉</h1>
          <p>Dear ${attendee_name},</p>
          <p>Thank you for registering for <strong>${event_title}</strong>!</p>
          <p><strong>Date:</strong> ${new Date(event_date).toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${event_time}</p>
          <p><strong>Location:</strong> ${event_location}</p>
          ${event_room ? `<p><strong>Room:</strong> ${event_room}</p>` : ''}
          ${notes ? `<p><strong>Your Notes:</strong> ${notes}</p>` : ''}
          <p>Best regards,<br>The GDG Team</p>
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