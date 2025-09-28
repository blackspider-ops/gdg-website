-- Add email notification system for new blog comments
-- This migration documents the email notification feature for blog comments

-- Email notifications are handled at the application level via:
-- 1. BlogCommentsService.createComment() calls sendCommentNotification()
-- 2. sendCommentNotification() invokes the 'send-comment-notification' Edge Function
-- 3. Edge Function sends email to gdg@psu.edu using Resend API

-- Required Environment Variables in Supabase:
-- RESEND_API_KEY: API key for Resend email service
-- SITE_URL: Base URL for the website (e.g., https://gdgpsu.org)

-- Email notification features:
-- - Sent to: gdg@psu.edu
-- - Subject: "New Blog Comment Pending Review - [Blog Post Title]"
-- - Content: Comment details, author info, direct links to admin panel
-- - HTML template with professional styling
-- - Fallback text version

-- The notification system is designed to be non-blocking:
-- - If email fails, comment creation still succeeds
-- - Errors are logged but don't prevent user interaction
-- - Email sending happens after successful comment insertion

-- No database triggers are used to avoid complexity and potential blocking
-- All email logic is handled in the application layer for better control

SELECT 'Email notification system configured for blog comments' as status;