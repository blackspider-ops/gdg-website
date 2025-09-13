// Vercel serverless function for sending emails
// Deploy this to Vercel by putting it in /api/send-email.js

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { to, subject, content, html_content, subscriber_name, unsubscribe_url } = req.body;

    // Validate required fields
    if (!to || !subject || !content) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: to, subject, content' 
      });
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      return res.status(500).json({ 
        success: false, 
        error: 'RESEND_API_KEY not configured' 
      });
    }

    // Email configuration
    const FROM_EMAIL = process.env.FROM_EMAIL || 'newsletter@decryptpsu.me';
    const FROM_NAME = process.env.FROM_NAME || 'GDG@PSU Newsletter';

    // Create unsubscribe footer
    const textFooter = `\n\n---\nYou're receiving this email because you subscribed to GDG@PSU newsletter.\nTo unsubscribe, visit: ${unsubscribe_url || '#'}`;
    
    const htmlFooter = `
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
      <div style="font-size: 12px; color: #666; text-align: center; padding: 20px;">
        <p>You're receiving this email because you subscribed to GDG@PSU newsletter.</p>
        ${unsubscribe_url ? `<p><a href="${unsubscribe_url}" style="color: #666;">Unsubscribe</a></p>` : ''}
      </div>
    `;

    const finalTextContent = content + textFooter;
    const finalHtmlContent = wrapInTemplate(
      (html_content || convertTextToHtml(content)) + htmlFooter,
      subject
    );

    // Send email via Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [to],
        subject: subject,
        text: finalTextContent,
        html: finalHtmlContent,
        tags: [
          { name: 'type', value: 'newsletter' },
          { name: 'source', value: 'gdg-psu-admin' }
        ]
      }),
    });

    const result = await response.json();

    if (response.ok) {
      console.log(`✅ Email sent successfully to ${to}:`, result.id);
      return res.status(200).json({ success: true, id: result.id });
    } else {
      console.error(`❌ Failed to send email to ${to}:`, result);
      return res.status(400).json({ 
        success: false, 
        error: result.message || 'Unknown error' 
      });
    }
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
}

function convertTextToHtml(text) {
  return text
    .split('\n\n')
    .map(paragraph => `<p style="margin-bottom: 16px;">${paragraph.replace(/\n/g, '<br>')}</p>`)
    .join('');
}

function wrapInTemplate(content, subject) {
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
  `;
}