-- Add attendance tracking for events
-- This migration adds the ability to track event attendance

-- Event attendance table
CREATE TABLE event_attendance (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
    attendee_name TEXT NOT NULL,
    attendee_email TEXT NOT NULL,
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    attended BOOLEAN DEFAULT FALSE,
    check_in_time TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, attendee_email)
);

-- Add attendance count column to events table for caching
ALTER TABLE events ADD COLUMN attendance_count INTEGER DEFAULT 0;

-- Create indexes for better performance
CREATE INDEX idx_event_attendance_event_id ON event_attendance(event_id);
CREATE INDEX idx_event_attendance_email ON event_attendance(attendee_email);
CREATE INDEX idx_event_attendance_attended ON event_attendance(attended);

-- Function to update attendance count when attendance records change
CREATE OR REPLACE FUNCTION update_event_attendance_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE events 
        SET attendance_count = (
            SELECT COUNT(*) 
            FROM event_attendance 
            WHERE event_id = NEW.event_id AND attended = TRUE
        )
        WHERE id = NEW.event_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE events 
        SET attendance_count = (
            SELECT COUNT(*) 
            FROM event_attendance 
            WHERE event_id = OLD.event_id AND attended = TRUE
        )
        WHERE id = OLD.event_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update attendance count
CREATE TRIGGER trigger_update_attendance_count
    AFTER INSERT OR UPDATE OR DELETE ON event_attendance
    FOR EACH ROW EXECUTE FUNCTION update_event_attendance_count();