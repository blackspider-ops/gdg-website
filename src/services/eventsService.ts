import { supabase } from '@/lib/supabase';

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  image_url?: string;
  registration_url?: string;
  google_form_url?: string;
  registration_type?: 'external' | 'internal' | 'both';
  max_participants?: number;
  registration_enabled?: boolean;
  is_featured: boolean;
  level?: 'beginner' | 'intermediate' | 'advanced' | 'open_for_all';
  external_attendees?: number;
  created_at: string;
  updated_at: string;
}

export class EventsService {
  static async getEvents(): Promise<Event[]> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.warn('Events service error:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.warn('Events service network error:', error);
      return [];
    }
  }

  static async getEventsWithAccurateAttendeeCount(): Promise<(Event & { accurate_attendee_count: number })[]> {
    try {
      const events = await this.getEvents();
      
      // For each event, get the unique internal attendee count
      const eventsWithCounts = await Promise.all(
        events.map(async (event) => {
          try {
            // Get unique attendees for this event
            const { data: attendees, error } = await supabase
              .from('event_attendance')
              .select('attendee_email')
              .eq('event_id', event.id);

            if (error) {
              return {
                ...event,
                accurate_attendee_count: event.external_attendees || 0
              };
            }

            // Count unique attendees by email
            const uniqueAttendees = attendees?.reduce((acc: string[], current) => {
              if (!acc.includes(current.attendee_email)) {
                acc.push(current.attendee_email);
              }
              return acc;
            }, []) || [];

            const internalCount = uniqueAttendees.length;
            const externalCount = event.external_attendees || 0;
            const totalCount = internalCount + externalCount;

            return {
              ...event,
              accurate_attendee_count: totalCount
            };
          } catch (error) {
            return {
              ...event,
              accurate_attendee_count: event.external_attendees || 0
            };
          }
        })
      );

      return eventsWithCounts;
    } catch (error) {
      return [];
    }
  }

  static async getUpcomingEvents(): Promise<Event[]> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .gte('date', new Date().toISOString())
        .order('date', { ascending: true });

      if (error) {
        console.warn('Upcoming events service error:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.warn('Upcoming events service network error:', error);
      return [];
    }
  }

  static async getFeaturedEvents(): Promise<Event[]> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_featured', true)
        .order('date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      return [];
    }
  }

  static async createEvent(event: Omit<Event, 'id' | 'created_at' | 'updated_at'>): Promise<Event | null> {
    try {
      const { data, error } = await supabase
        .from('events')
        .insert({
          ...event,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      return null;
    }
  }

  static async updateEvent(id: string, updates: Partial<Event>): Promise<Event | null> {
    try {
      const { data, error } = await supabase
        .from('events')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      return null;
    }
  }

  static async deleteEvent(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      return false;
    }
  }

  static async getEventStats() {
    try {
      const [totalEvents, upcomingEvents, pastEvents] = await Promise.all([
        supabase.from('events').select('id', { count: 'exact' }),
        supabase.from('events').select('id', { count: 'exact' }).gte('date', new Date().toISOString()),
        supabase.from('events').select('id', { count: 'exact' }).lt('date', new Date().toISOString())
      ]);

      // Get accurate attendee counts for all events
      const eventsWithCounts = await this.getEventsWithAccurateAttendeeCount();
      const totalAttendees = eventsWithCounts.reduce((sum, event) => {
        return sum + event.accurate_attendee_count;
      }, 0);

      return {
        total: totalEvents.count || 0,
        upcoming: upcomingEvents.count || 0,
        past: pastEvents.count || 0,
        totalAttendees: totalAttendees
      };
    } catch (error) {
      return {
        total: 0,
        upcoming: 0,
        past: 0,
        totalAttendees: 0
      };
    }
  }
}