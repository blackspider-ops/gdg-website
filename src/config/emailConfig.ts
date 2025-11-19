// Email service configuration
// Choose your preferred email service and configure accordingly

export const EMAIL_CONFIG = {
  // Choose your email service: 'emailjs' | 'resend' | 'brevo' | 'gmail' | 'sendgrid'
  provider: 'resend' as const,
  
  // Resend Configuration (https://resend.com/) - RECOMMENDED
  resend: {
    apiKey: import.meta.env.VITE_RESEND_API_KEY || 'your_resend_api_key',
    senderEmail: 'newsletter@gdgpsu.dev', // Must be from verified domain
    senderName: 'GDG@PSU Newsletter'
  },

  // EmailJS Configuration (https://www.emailjs.com/)
  emailjs: {
    serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID || 'your_service_id',
    templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'your_template_id',
    publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'your_public_key'
  },
  
  // Brevo (formerly Sendinblue) Configuration (https://www.brevo.com/)
  brevo: {
    apiKey: import.meta.env.VITE_BREVO_API_KEY || 'your_brevo_api_key',
    senderEmail: 'newsletter@gdgpsu.dev',
    senderName: 'GDG@PSU Newsletter'
  },
  
  // SendGrid Configuration (https://sendgrid.com/)
  sendgrid: {
    apiKey: import.meta.env.VITE_SENDGRID_API_KEY || 'your_sendgrid_api_key',
    senderEmail: 'newsletter@gdgpsu.dev',
    senderName: 'GDG@PSU Newsletter'
  },
  
  // Gmail API Configuration (requires OAuth setup)
  gmail: {
    clientId: import.meta.env.VITE_GMAIL_CLIENT_ID || 'your_gmail_client_id',
    senderEmail: 'newsletter@gdgpsu.dev'
  }
};

// Email rate limiting settings
export const RATE_LIMITS = {
  resend: {
    batchSize: 100, // Resend can handle large batches
    delayBetweenEmails: 10, // Very fast
    delayBetweenBatches: 100 // Minimal delay
  },
  emailjs: {
    batchSize: 5,
    delayBetweenEmails: 2000, // 2 seconds
    delayBetweenBatches: 5000 // 5 seconds
  },
  brevo: {
    batchSize: 50,
    delayBetweenEmails: 100, // 100ms
    delayBetweenBatches: 1000 // 1 second
  },
  sendgrid: {
    batchSize: 100,
    delayBetweenEmails: 50, // 50ms
    delayBetweenBatches: 500 // 500ms
  },
  gmail: {
    batchSize: 10,
    delayBetweenEmails: 1000, // 1 second
    delayBetweenBatches: 2000 // 2 seconds
  }
};