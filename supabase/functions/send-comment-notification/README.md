# Send Comment Notification Edge Function

This Edge Function sends email notifications to administrators and blog editors when new blog comments are submitted for review.

## Environment Variables Required

Add these to your Supabase project settings:

```bash
RESEND_API_KEY=your_resend_api_key_here
SITE_URL=https://gdgpsu.org
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## How it works

1. When a user submits a comment on a blog post, it's created with `is_approved = false`
2. The `BlogCommentsService.createComment()` method calls this function
3. The function:
   - Fetches all active blog editor emails from the database
   - Sends an HTML email to both `gdg@psu.edu` and all blog editors
   - Includes comment details and direct management links

## Email Recipients

The notification email is sent to:
- **gdg@psu.edu** (main admin email)
- **All active blog editors** (fetched from `admin_users` table where `role = 'blog_editor'` and `is_active = true`)

## Email Content

The notification email includes:
- **Subject**: "New Blog Comment Pending Review - [Blog Post Title]"
- **To**: gdg@psu.edu + all blog editor emails
- **Content**: 
  - Comment author and email
  - Comment content
  - Blog post title
  - Direct link to admin comment management
  - Link to view the blog post
  - Note that both admins and blog editors can manage comments

## Testing

You can test this function by submitting a comment on any blog post. The comment will be created and an email notification should be sent to gdg@psu.edu.

## Error Handling

- If email sending fails, the comment is still created successfully
- Errors are logged but don't prevent comment submission
- The function returns appropriate HTTP status codes