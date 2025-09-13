# 📧 Email Setup Guide

Since you're using Supabase online (not CLI), here's how to set up email sending to avoid CORS issues:

## Option 1: Deploy to Vercel (Recommended - Free & Easy)

### Step 1: Deploy the API endpoint
1. Create a Vercel account at https://vercel.com
2. Connect your GitHub repository
3. Deploy your project to Vercel
4. The `api/send-email.js` file will automatically become a serverless function

### Step 2: Set environment variables in Vercel
1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add these variables:
   - `RESEND_API_KEY`: Your Resend API key
   - `FROM_EMAIL`: newsletter@decryptpsu.me
   - `FROM_NAME`: GDG@PSU Newsletter

### Step 3: Update your frontend
1. Add this to your `.env` file:
   ```
   VITE_EMAIL_API_URL=https://your-app.vercel.app/api/send-email
   ```
2. Replace `your-app` with your actual Vercel app name

## Option 2: Use Netlify Functions

### Step 1: Create netlify function
Create `netlify/functions/send-email.js` with the same content as `api/send-email.js`

### Step 2: Deploy to Netlify
1. Connect your repo to Netlify
2. Set environment variables in Netlify dashboard
3. Update `VITE_EMAIL_API_URL` to `https://your-app.netlify.app/.netlify/functions/send-email`

## Option 3: Simple Express Server (if you have hosting)

Create a simple Express server:

```javascript
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.post('/api/send-email', async (req, res) => {
  // Same logic as in api/send-email.js
});

app.listen(3001, () => {
  console.log('Email API running on port 3001');
});
```

## Testing

Once deployed, test with:

```bash
curl -X POST 'https://your-app.vercel.app/api/send-email' \
  -H 'Content-Type: application/json' \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "content": "Hello World!"
  }'
```

## Why This Fixes CORS

- **Problem**: Browsers block direct API calls to external services like Resend
- **Solution**: Backend proxy handles the API call, avoiding CORS restrictions
- **Result**: Your frontend calls your backend, backend calls Resend ✅

## Quick Start (Vercel)

1. Push your code to GitHub
2. Connect to Vercel
3. Add environment variables
4. Update `VITE_EMAIL_API_URL` in your `.env`
5. Test email sending! 🎉