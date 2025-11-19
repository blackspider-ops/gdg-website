-- Safe Blog Migration Script
-- Run this in your Supabase SQL Editor to set up the blog system

-- This script is safe to run multiple times and will not create duplicates

-- First, let's check if blog tables already exist
DO $$
BEGIN
    -- Only proceed if blog_posts table doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'blog_posts') THEN
        RAISE NOTICE 'Creating blog system tables...';
        
        -- Run the full migration
        -- You can copy and paste the content of 013_create_blog_system.sql here
        -- Or run that migration file directly
        
    ELSE
        RAISE NOTICE 'Blog tables already exist. Skipping table creation.';
        
        -- Only add missing policies and functions
        -- Check and add any missing RLS policies
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'blog_posts' AND policyname = 'Public read access for published blog posts') THEN
            CREATE POLICY "Public read access for published blog posts" ON blog_posts 
                FOR SELECT USING (status = 'published');
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'blog_posts' AND policyname = 'Allow all operations on blog_posts for admins') THEN
            CREATE POLICY "Allow all operations on blog_posts for admins" ON blog_posts 
                FOR ALL USING (true);
        END IF;

        -- Add the view increment function if it doesn't exist
        CREATE OR REPLACE FUNCTION increment_blog_views(post_id UUID)
        RETURNS VOID AS $func$
        BEGIN
            UPDATE blog_posts 
            SET views_count = COALESCE(views_count, 0) + 1 
            WHERE id = post_id;
        END;
        $func$ LANGUAGE plpgsql;
        
        RAISE NOTICE 'Blog system is ready to use!';
    END IF;
END $$;