# Deploy Updated Contact Form Function

## What's New
The contact form function now supports PDF attachments for blog submissions! When someone submits a blog post via the contact form, the PDF will be attached to the email you receive.

## How to Deploy

### Option 1: Using Supabase CLI (Recommended)
```bash
# Navigate to your project directory
cd your-project-directory

# Deploy the function
supabase functions deploy send-contact-form
```

### Option 2: Manual Deployment via Dashboard
1. **Go to Supabase Dashboard** → **Edge Functions**
2. **Find `send-contact-form` function**
3. **Click "Edit"**
4. **Replace the entire code** with the updated version from `supabase/functions/send-contact-form/index.ts`
5. **Click "Deploy"**

## Environment Variables Required
Make sure these environment variables are set in your Supabase project:
- `RESEND_API_KEY` - Your Resend API key
- `SUPABASE_URL` - Your Supabase project URL  
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key

## What the Updated Function Does

### For Regular Contact Forms:
- Works exactly the same as before
- Sends email with form data

### For Blog Submissions:
- **Detects blog submission** type
- **Downloads PDF** from media storage
- **Attaches PDF** to email
- **Enhanced email template** showing attachment info
- **Fallback handling** if attachment fails

## Email Features
- **PDF Attachment**: The actual PDF file is attached to the email
- **File Info**: Shows filename and attachment icon in email
- **Fallback**: If attachment fails, email still sends without it
- **Enhanced Template**: Better visual indication of blog submissions

## Testing
1. **Submit a blog post** via contact form with PDF
2. **Check your email** - should include PDF attachment
3. **Verify attachment** opens correctly
4. **Test regular forms** still work normally

## Troubleshooting
- **No attachment**: Check file upload worked and media storage is accessible
- **Function errors**: Check environment variables are set
- **Email not sending**: Verify Resend API key is valid

The function now provides a complete blog submission workflow with PDF attachments! 📎✨