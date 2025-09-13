#!/bin/bash

# Deploy the send-email Edge Function to Supabase
echo "🚀 Deploying send-email Edge Function to Supabase..."

# Make sure you have the Supabase CLI installed
# npm install -g supabase

# Deploy the function
supabase functions deploy send-email

echo "✅ Edge Function deployed successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Set your RESEND_API_KEY secret in Supabase:"
echo "   supabase secrets set RESEND_API_KEY=your_resend_api_key_here"
echo ""
echo "2. Your email function is now available at:"
echo "   https://your-project-id.supabase.co/functions/v1/send-email"
echo ""
echo "3. Test the function with:"
echo "   curl -X POST 'https://your-project-id.supabase.co/functions/v1/send-email' \\"
echo "     -H 'Authorization: Bearer YOUR_ANON_KEY' \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"to\":\"test@example.com\",\"subject\":\"Test\",\"content\":\"Hello World!\"}'"