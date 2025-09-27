-- Create a separate public bucket for blog submissions
-- This is more secure than giving public access to the admin media system

-- Create the blog-submissions bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'blog-submissions',
    'blog-submissions', 
    false, -- Keep private, but allow public uploads
    52428800, -- 50MB limit
    ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'image/jpeg', 'image/png', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the blog-submissions bucket
-- Allow anyone to upload files
CREATE POLICY "Allow public blog submission uploads" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'blog-submissions'
    );

-- Allow reading files (needed for email function to download and attach them)
CREATE POLICY "Allow reading blog submission files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'blog-submissions'
    );

-- Prevent public deletion (only admins should be able to delete)
-- No delete policy = no public delete access

-- Create a simple table to track blog submission metadata (optional)
CREATE TABLE IF NOT EXISTS blog_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    file_path TEXT NOT NULL,
    original_name TEXT NOT NULL,
    submitter_name TEXT NOT NULL,
    submitter_email TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved', 'rejected')),
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on blog_submissions table
ALTER TABLE blog_submissions ENABLE ROW LEVEL SECURITY;

-- Allow public inserts to blog_submissions table
CREATE POLICY "Allow public blog submission records" ON blog_submissions
    FOR INSERT WITH CHECK (true);

-- Allow admins to read and update blog submissions
CREATE POLICY "Admins can manage blog submissions" ON blog_submissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.is_active = true
        )
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blog_submissions_status ON blog_submissions(status);
CREATE INDEX IF NOT EXISTS idx_blog_submissions_created_at ON blog_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_submissions_email ON blog_submissions(submitter_email);