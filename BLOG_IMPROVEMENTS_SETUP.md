# Blog Improvements Setup Guide

## Overview
This update adds three major improvements to the blog system:

1. **Blog Submission Workflow** - Contact form integration + blog_editor role with approval system
2. **Individual Blog Pages** - Dedicated pages for each blog post using slugs
3. **Enhanced Blog Section** - Filtering, sorting, and "All Posts" view

## Database Setup

### Option 1: Run the Migration (if Supabase CLI is set up)
```bash
cd supabase
npx supabase db push
```

### Option 2: Manual SQL Execution (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/scripts/apply-blog-improvements.sql`
4. Run the script

## What's New

### 1. Blog Submission Workflow
- **Contact Form**: Added "Blog Submission" option to contact form dropdown
- **Blog Editor Role**: New `blog_editor` role for restricted admin access
- **Approval System**: Blog editors' posts require admin approval before publishing
- **Restricted Dashboard**: Blog editors see only blog management and profile sections

### 2. Individual Blog Pages
- **New Route**: `/blog/:slug` for individual blog posts
- **Full Post View**: Complete blog post with like/share functionality
- **SEO Friendly**: Proper meta tags and structured content
- **"Open in New Page" Buttons**: Added to all blog post cards

### 3. Enhanced Blog Section
- **All Posts Toggle**: Switch between featured view and complete listing
- **Category Filtering**: Filter posts by blog category
- **Sorting Options**: Sort by Latest, Most Viewed, or Most Liked
- **Improved UI**: Better post cards with category badges and action buttons

## New Database Tables & Columns

### Updated Tables
- `admin_users`: Added `blog_editor` to role constraint
- `blog_posts`: Added approval workflow columns:
  - `requires_approval` (boolean)
  - `approved_by` (UUID reference to admin_users)
  - `approved_at` (timestamp)
  - `rejected_by` (UUID reference to admin_users)
  - `rejected_at` (timestamp)
  - `rejection_reason` (text)

### New Tables
- `blog_likes`: Authentic like tracking
  - `id` (UUID primary key)
  - `post_id` (UUID reference to blog_posts)
  - `user_identifier` (text - browser fingerprint)
  - `created_at` (timestamp)

## User Roles & Permissions

### Blog Editor Role
- **Access**: Restricted admin dashboard with only blog management
- **Permissions**: 
  - Create and edit their own blog posts
  - View their own posts and drafts
  - Access profile settings
- **Limitations**:
  - Cannot publish posts directly (requires admin approval)
  - Cannot access other admin sections
  - Cannot see other users' posts in admin

### Admin/Super Admin Roles
- **Full Access**: All existing permissions plus:
  - Approve/reject blog editor posts
  - Manage blog editors
  - Override blog editor restrictions

## How to Create a Blog Editor

1. Go to Admin Dashboard → Admin Users
2. Create new admin user with role `blog_editor`
3. Blog editor will see restricted dashboard on login
4. Their posts will require approval before publishing

## Testing the Features

### Test Blog Submission
1. Go to `/contact`
2. Select "Blog Submission" from dropdown
3. Fill out form and submit

### Test Individual Blog Pages
1. Go to `/blog`
2. Click "Open Page" button on any blog post
3. Should navigate to `/blog/[slug]` with full post view

### Test Filtering & Sorting
1. Go to `/blog`
2. Click "All Posts" button
3. Try different category filters
4. Try different sorting options

### Test Blog Editor Role
1. Create a blog_editor admin user
2. Login as blog editor
3. Should see restricted dashboard
4. Create a blog post - should be marked as requiring approval

## File Changes Summary

### New Files
- `src/pages/admin/BlogEditorDashboard.tsx` - Restricted admin dashboard
- `src/pages/BlogPost.tsx` - Individual blog post pages
- `supabase/migrations/20241226_blog_improvements.sql` - Database migration
- `supabase/scripts/apply-blog-improvements.sql` - Manual setup script

### Modified Files
- `src/pages/Contact.tsx` - Added blog submission option
- `src/pages/Blog.tsx` - Added filtering, sorting, and "Open Page" buttons
- `src/pages/AdminDashboard.tsx` - Redirect blog editors to restricted dashboard
- `src/App.tsx` - Added new routes
- `src/lib/supabase.ts` - Updated AdminUser interface
- `src/services/blogService.ts` - Added approval workflow methods

## Troubleshooting

### Migration Issues
- If migration fails, use the manual SQL script in `supabase/scripts/apply-blog-improvements.sql`
- Check that all existing tables (admin_users, blog_posts, blog_categories) exist

### Role Issues
- Ensure the admin_users table constraint includes 'blog_editor'
- Verify blog_editor users are created with correct role

### Route Issues
- Clear browser cache if new routes don't work
- Ensure all imports in App.tsx are correct

## Next Steps

1. Run the database setup (Option 1 or 2 above)
2. Test the new features
3. Create your first blog_editor user
4. Start using the enhanced blog system!

The implementation maintains your existing design system and follows the same patterns used throughout your codebase.