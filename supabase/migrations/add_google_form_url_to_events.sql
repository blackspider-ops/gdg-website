-- Add Google Form URL field to events table
-- This allows admins to set up Google Form registration for each event

ALTER TABLE events ADD COLUMN google_form_url TEXT;