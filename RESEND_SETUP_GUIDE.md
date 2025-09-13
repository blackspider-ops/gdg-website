# Resend Setup Guide - Complete Newsletter Solution

Resend is the **BEST** choice for newsletters! Built by developers, for developers. Here's everything you need:

## 🚀 Why Resend?

- ✅ **3,000 emails/month FREE** (vs EmailJS 100/month)
- ✅ **Built for developers** - Simple API, great docs
- ✅ **Excellent deliverability** - Your emails reach inboxes
- ✅ **Real-time analytics** - Opens, clicks, bounces
- ✅ **Professional features** - Templates, webhooks, domains
- ✅ **Fast sending** - Batch processing, no delays

## 📋 What You Need from Resend

### 1. **Account & API Key** (2 minutes)
- Go to [resend.com](https://resend.com)
- Sign up with GitHub/Google
- Go to API Keys → Create API Key
- Copy the key (starts with `re_`)

### 2. **Domain Setup** (5 minutes - IMPORTANT!)
- Go to Domains → Add Domain
- Add your domain: `gdgpsu.com`
- Add the DNS records they provide:
  ```
  Type: TXT
  Name: @
  Value: [they'll give you this]
  
  Type: CNAME  
  Name: resend._domainkey
  Value: [they'll give you this]
  ```
- Wait for verification (usually instant)

### 3. **Environment Variable** (30 seconds)
```bash
# Add to .env.local
VITE_RESEND_API_KEY=re_your_api_key_here
```

## 🛠 Complete Setup Steps

### Step 1: Create Resend Account
1. Go to [resend.com](https://resend.com)
2. Click "Sign Up" 
3. Use GitHub or Google for quick signup
4. Verify your email

### Step 2: Get API Key
1. In Resend dashboard, go to "API Keys"
2. Click "Create API Key"
3. Name it "GDG Newsletter" 
4. Copy the key (starts with `re_`)

### Step 3: Add Domain (CRITICAL!)
1. Go to "Domains" in Resend dashboard
2. Click "Add Domain"
3. Enter your domain: `gdgpsu.com`
4. Copy the DNS records they show you
5. Add these records to your domain DNS:

**For Cloudflare/Namecheap/GoDaddy:**
```
Type: TXT
Name: @ (or leave blank)
Value: v=spf1 include:_spf.resend.com ~all

Type: CNAME
Name: resend._domainkey
Value: [unique value from Resend]
```

6. Click "Verify Domain" in Resend
7. Wait for green checkmark ✅

### Step 4: Configure App
1. Add to `.env.local`:
   ```
   VITE_RESEND_API_KEY=re_your_actual_key_here
   ```

2. Update sender email in `src/config/emailConfig.ts`:
   ```typescript
   resend: {
     apiKey: import.meta.env.VITE_RESEND_API_KEY,
     senderEmail: 'newsletter@gdgpsu.com', // Use your verified domain
     senderName: 'GDG@PSU Newsletter'
   }
   ```

3. Restart your dev server:
   ```bash
   npm run dev
   ```

### Step 5: Test It!
1. Go to Admin → Newsletter Management
2. Create a test campaign
3. Send to your own email first
4. Check it arrives in inbox (not spam!)

## 📧 Email Configuration

### Sender Email Options:
```typescript
// These will work once domain is verified:
newsletter@gdgpsu.com     // ✅ Professional
noreply@gdgpsu.com       // ✅ Good for newsletters  
hello@gdgpsu.com         // ✅ Friendly
admin@gdgpsu.com         // ✅ Official

// Don't use:
gdgpsu@gmail.com         // ❌ Not your domain
newsletter@resend.dev    // ❌ Not allowed
```

### Update Your Config:
```typescript
// src/config/emailConfig.ts
export const EMAIL_CONFIG = {
  provider: 'resend' as const, // ✅ Set to resend
  
  resend: {
    apiKey: import.meta.env.VITE_RESEND_API_KEY,
    senderEmail: 'newsletter@gdgpsu.com', // ✅ Your verified domain
    senderName: 'GDG@PSU Newsletter'
  }
}
```

## 🎯 Testing Checklist

### ✅ Before Going Live:
- [ ] Domain verified in Resend (green checkmark)
- [ ] API key added to `.env.local`
- [ ] Sender email uses verified domain
- [ ] Test email sent to yourself
- [ ] Email arrives in inbox (not spam)
- [ ] Unsubscribe link works
- [ ] Email looks good on mobile

### 🧪 Test Campaign:
```
Subject: Test Newsletter - GDG@PSU
Content: 
Hello!

This is a test of our new newsletter system.

If you received this, everything is working perfectly!

Best regards,
GDG@PSU Team
```

## 📊 Resend Dashboard Features

Once set up, you'll see:
- **Real-time sending status**
- **Open rates and click tracking**  
- **Bounce and complaint monitoring**
- **Email logs and debugging**
- **Domain reputation scores**

## 🚨 Troubleshooting

### Domain Not Verifying?
- Check DNS records are exactly as shown
- Wait up to 24 hours for DNS propagation
- Use DNS checker tools to verify records

### Emails Going to Spam?
- Make sure domain is verified
- Add SPF/DKIM records properly
- Start with small batches
- Ask recipients to whitelist your domain

### API Errors?
- Check API key is correct (starts with `re_`)
- Verify sender email uses verified domain
- Check Resend dashboard for error details

### Rate Limiting?
- Resend free tier: 3,000 emails/month
- Paid plans have higher limits
- App automatically handles rate limiting

## 💰 Pricing (Very Generous!)

- **Free**: 3,000 emails/month
- **Pro**: $20/month for 50,000 emails
- **Business**: $80/month for 100,000 emails

Perfect for most newsletters!

## 🎉 You're Ready!

Once domain is verified and API key is set:
1. Your newsletters will have professional deliverability
2. Real-time analytics and tracking
3. Fast, reliable sending
4. Professional sender reputation

**Resend is the perfect choice for GDG@PSU newsletters!** 🚀