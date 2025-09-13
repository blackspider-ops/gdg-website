# Direct Email Sending Setup Guide

You can send newsletters directly from your app without Supabase! Here are the different options:

## Option 1: EmailJS (Recommended - Easiest Setup)

EmailJS allows you to send emails directly from the frontend without a backend.

### Setup Steps:

1. **Create EmailJS Account**
   - Go to [https://www.emailjs.com/](https://www.emailjs.com/)
   - Sign up for a free account (100 emails/month free)

2. **Connect Your Email Service**
   - Add a service (Gmail, Outlook, Yahoo, etc.)
   - Follow the setup wizard to connect your email account

3. **Create Email Template**
   - Go to Email Templates
   - Create a new template with these variables:
     ```
     To: {{to_email}}
     Subject: {{subject}}
     
     Hello {{subscriber_name}},
     
     {{message}}
     
     {{html_content}}
     
     ---
     Unsubscribe: {{unsubscribe_url}}
     
     Best regards,
     {{from_name}}
     ```

4. **Get Your Credentials**
   - Service ID (from Services page)
   - Template ID (from Templates page)  
   - Public Key (from Account > API Keys)

5. **Add to Environment Variables**
   Create `.env.local` file:
   ```
   VITE_EMAILJS_SERVICE_ID=your_service_id
   VITE_EMAILJS_TEMPLATE_ID=your_template_id
   VITE_EMAILJS_PUBLIC_KEY=your_public_key
   ```

### Pros:
- ✅ No backend required
- ✅ Easy setup (5 minutes)
- ✅ Free tier available
- ✅ Works with any email provider

### Cons:
- ❌ Rate limited (100 emails/month free)
- ❌ Emails sent from your personal account
- ❌ Limited customization

---

## Option 2: Brevo (Sendinblue) API

Professional email service with generous free tier.

### Setup Steps:

1. **Create Brevo Account**
   - Go to [https://www.brevo.com/](https://www.brevo.com/)
   - Sign up (300 emails/day free)

2. **Get API Key**
   - Go to Account > SMTP & API
   - Create new API key

3. **Add to Environment Variables**
   ```
   VITE_BREVO_API_KEY=your_api_key
   ```

4. **Update Email Config**
   In `src/config/emailConfig.ts`, change:
   ```typescript
   provider: 'brevo' as const,
   ```

### Pros:
- ✅ Professional email service
- ✅ 300 emails/day free
- ✅ Better deliverability
- ✅ Email analytics

### Cons:
- ❌ Requires API key management
- ❌ Need to verify sender domain

---

## Option 3: SendGrid API

Enterprise-grade email service.

### Setup Steps:

1. **Create SendGrid Account**
   - Go to [https://sendgrid.com/](https://sendgrid.com/)
   - Sign up (100 emails/day free)

2. **Get API Key**
   - Go to Settings > API Keys
   - Create new API key with Mail Send permissions

3. **Add to Environment Variables**
   ```
   VITE_SENDGRID_API_KEY=your_api_key
   ```

4. **Update Email Config**
   ```typescript
   provider: 'sendgrid' as const,
   ```

### Pros:
- ✅ Enterprise-grade reliability
- ✅ Excellent deliverability
- ✅ Advanced analytics
- ✅ Scalable

### Cons:
- ❌ More complex setup
- ❌ Requires sender verification

---

## Option 4: Gmail API

Use Gmail directly through Google APIs.

### Setup Steps:

1. **Google Cloud Console Setup**
   - Create project in Google Cloud Console
   - Enable Gmail API
   - Create OAuth 2.0 credentials

2. **Add Credentials**
   ```
   VITE_GMAIL_CLIENT_ID=your_client_id
   ```

3. **Update Email Config**
   ```typescript
   provider: 'gmail' as const,
   ```

### Pros:
- ✅ Use your existing Gmail
- ✅ No additional service needed
- ✅ Free (within Gmail limits)

### Cons:
- ❌ Complex OAuth setup
- ❌ Gmail rate limits
- ❌ Requires user authentication

---

## Current Implementation

The app is set up to use **EmailJS by default**. To switch providers:

1. Update `src/config/emailConfig.ts`
2. Change the `provider` field
3. Add the required environment variables
4. Restart your development server

## Testing

1. Set up your chosen email service
2. Add a test subscriber in the admin panel
3. Create a test newsletter campaign
4. Send it and check if the email arrives

## Rate Limits & Best Practices

- **EmailJS**: 5 emails per batch, 2-second delays
- **Brevo**: 50 emails per batch, 100ms delays  
- **SendGrid**: 100 emails per batch, 50ms delays
- **Gmail**: 10 emails per batch, 1-second delays

The app automatically handles rate limiting for each service.

## Troubleshooting

### EmailJS Issues:
- Check service is connected and active
- Verify template variables match
- Check browser console for errors

### API Issues:
- Verify API keys are correct
- Check sender email is verified
- Monitor service status pages

### General Issues:
- Check environment variables are loaded
- Verify email addresses are valid
- Check spam folders for test emails

## Production Recommendations

For production use:
1. **Small lists (< 100 subscribers)**: EmailJS
2. **Medium lists (< 1000 subscribers)**: Brevo
3. **Large lists (> 1000 subscribers)**: SendGrid
4. **Enterprise**: SendGrid or AWS SES

Remember to:
- Verify your sender domain
- Set up proper SPF/DKIM records
- Monitor bounce rates
- Respect unsubscribe requests