import { supabase } from '@/lib/supabase';

export interface Attendee {
  id: string;
  event_id: string;
  attendee_name: string;
  attendee_email: string;
  registration_date: string;
  attended: boolean;
  check_in_time?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AttendanceStats {
  totalRegistrations: number;
  totalAttended: number;
  attendanceRate: number;
}

export class AttendanceService {
  static async checkIfUserRegistered(eventId: string, email: string): Promise<boolean> {
    try {
      // Validate email format before making the request
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!email || !emailRegex.test(email)) {
        return false;
      }

      const { data, error } = await supabase
        .from('event_attendance')
        .select('id')
        .eq('event_id', eventId)
        .eq('attendee_email', email)
        .maybeSingle(); // Use maybeSingle instead of single to avoid errors when no rows found

      if (error) {
        return false;
      }

      return !!data;
    } catch (error) {
      return false;
    }
  }

  static async getEventAttendees(eventId: string): Promise<Attendee[]> {
    try {
      const { data, error } = await supabase
        .from('event_attendance')
        .select('*')
        .eq('event_id', eventId)
        .order('registration_date', { ascending: false });

      if (error) throw error;
      
      // Filter for unique attendees by email (keep the latest registration)
      const uniqueAttendees = data?.reduce((acc: Attendee[], current: Attendee) => {
        const existingIndex = acc.findIndex(attendee => attendee.attendee_email === current.attendee_email);
        if (existingIndex === -1) {
          acc.push(current);
        } else {
          // Keep the more recent registration
          const existing = acc[existingIndex];
          if (new Date(current.registration_date) > new Date(existing.registration_date)) {
            acc[existingIndex] = current;
          }
        }
        return acc;
      }, []) || [];
      
      return uniqueAttendees;
    } catch (error) {
      return [];
    }
  }

  static async addAttendee(eventId: string, attendeeData: {
    attendee_name: string;
    attendee_email: string;
    notes?: string;
  }): Promise<Attendee | null> {
    try {
      // First, check if the user is already registered for this event
      const { data: existingAttendee, error: checkError } = await supabase
        .from('event_attendance')
        .select('*')
        .eq('event_id', eventId)
        .eq('attendee_email', attendeeData.attendee_email)
        .maybeSingle();

      if (checkError) {
        throw checkError;
      }

      if (existingAttendee) {
        // User is already registered
        throw new Error('You are already registered for this event');
      }

      // Add the attendee to the attendance table
      const { data: attendee, error: attendeeError } = await supabase
        .from('event_attendance')
        .insert({
          event_id: eventId,
          ...attendeeData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (attendeeError) {
        // Handle duplicate key constraint error
        if (attendeeError.code === '23505') {
          throw new Error('You are already registered for this event');
        }
        throw attendeeError;
      }

      // Then, increment the attendees_count in the events table
      const { error: updateError } = await supabase.rpc('increment_attendees_count', {
        event_id: eventId
      });

      if (updateError) {
        // Don't fail the registration if count update fails
      }

      // Send confirmation email
      try {
        await this.sendConfirmationEmail(eventId, attendeeData);
      } catch (emailError) {
        // Don't fail the registration if email fails
      }

      return attendee;
    } catch (error: any) {

      // Re-throw the error so the UI can handle it properly
      throw error;
    }
  }

  static async sendConfirmationEmail(eventId: string, attendeeData: {
    attendee_name: string;
    attendee_email: string;
    notes?: string;
  }): Promise<void> {
    try {
      // Get event details for the email
      const { data: event, error } = await supabase
        .from('events')
        .select('title, date, location, time, room, description')
        .eq('id', eventId)
        .single();

      if (error) {
        throw error;
      }

      // Format the event time
      const eventDate = new Date(event.date);
      const formattedTime = event.time || eventDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

      const emailPayload = {
        attendee_name: attendeeData.attendee_name,
        attendee_email: attendeeData.attendee_email,
        event_title: event.title,
        event_date: event.date,
        event_time: formattedTime,
        event_location: event.location,
        event_room: event.room || '',
        event_description: event.description || '',
        notes: attendeeData.notes || ''
      };


      // Use the confirmation-mail Edge Function (cache-bust-v2)
      const { data, error: functionError } = await supabase.functions.invoke('confirmation-mail', {
        body: emailPayload
      });

      if (functionError) {
        throw functionError;
      }


    } catch (error) {
      throw error;
    }
  }

  static async markAttendance(attendeeId: string, attended: boolean): Promise<boolean> {
    try {
      const updateData: any = {
        attended,
        updated_at: new Date().toISOString()
      };

      if (attended) {
        updateData.check_in_time = new Date().toISOString();
      } else {
        updateData.check_in_time = null;
      }

      const { error } = await supabase
        .from('event_attendance')
        .update(updateData)
        .eq('id', attendeeId);

      if (error) throw error;
      return true;
    } catch (error) {
      return false;
    }
  }

  static async updateAttendee(attendeeId: string, updates: Partial<Attendee>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('event_attendance')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', attendeeId);

      if (error) throw error;
      return true;
    } catch (error) {
      return false;
    }
  }

  static async removeAttendee(attendeeId: string): Promise<boolean> {
    try {
      // First, get the event_id before deleting
      const { data: attendee, error: fetchError } = await supabase
        .from('event_attendance')
        .select('event_id')
        .eq('id', attendeeId)
        .single();

      if (fetchError) throw fetchError;

      // Delete the attendee
      const { error: deleteError } = await supabase
        .from('event_attendance')
        .delete()
        .eq('id', attendeeId);

      if (deleteError) throw deleteError;

      // Decrement the attendees_count in the events table
      const { error: updateError } = await supabase.rpc('decrement_attendees_count', {
        event_id: attendee.event_id
      });

      if (updateError) {
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  static async getEventAttendanceStats(eventId: string): Promise<AttendanceStats> {
    try {
      // Get unique attendees first
      const uniqueAttendees = await this.getEventAttendees(eventId);

      const totalRegistrations = uniqueAttendees.length;
      const totalAttended = uniqueAttendees.filter(attendee => attendee.attended).length;
      const attendanceRate = totalRegistrations > 0 ? (totalAttended / totalRegistrations) * 100 : 0;

      return {
        totalRegistrations,
        totalAttended,
        attendanceRate: Math.round(attendanceRate * 100) / 100
      };
    } catch (error) {
      return {
        totalRegistrations: 0,
        totalAttended: 0,
        attendanceRate: 0
      };
    }
  }

  static async getTotalAttendanceAcrossAllEvents(): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('event_attendance')
        .select('attended')
        .eq('attended', true);

      if (error) throw error;
      return data?.length || 0;
    } catch (error) {
      return 0;
    }
  }
}