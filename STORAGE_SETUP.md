# Storage Setup for Blog Submissions

## Quick Fix for Upload Errors

The 400 Bad Request error happens because the storage bucket doesn't exist yet. Here's how to fix it:

### Option 1: Create via Supabase Dashboard (Recommended)

1. **Go to your Supabase Dashboard**
2. **Click "Storage" in the sidebar**
3. **Click "New Bucket"**
4. **Enter these settings**:
   - **Name**: `media`
   - **Public bucket**: ✅ **Yes** (check this box)
   - **File size limit**: `50MB`
   - **Allowed MIME types**: Leave empty (allows all)
5. **Click "Create bucket"**

### Option 2: Create via SQL (Alternative)

Run this in your Supabase SQL Editor:

```sql
-- Create media bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('media', 'media', true, 52428800)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Public read access" ON storage.objects
    FOR SELECT USING (bucket_id = 'media');

CREATE POLICY "Authenticated upload" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'media');
```

### Test the Fix

1. **Create the bucket** using either method above
2. **Try the blog submission form** again
3. **Upload should work** without 400 errors
4. **Check your email** for the PDF attachment

### Troubleshooting

**Still getting errors?**
- Make sure the bucket is named exactly `media`
- Ensure "Public bucket" is checked
- Try refreshing your browser
- Check browser console for detailed error messages

**Alternative bucket name:**
If you want to use a different bucket name, update these files:
- `src/services/simpleUploadService.ts` (line with `.from('media')`)
- `supabase/functions/send-contact-form/index.ts` (line with `.from('media')`)

### What This Fixes

- ✅ **Eliminates 400 Bad Request** errors
- ✅ **Enables PDF uploads** for blog submissions  
- ✅ **Allows email attachments** to work
- ✅ **Provides file storage** for the media system

The storage bucket is the foundation for all file uploads in your system!