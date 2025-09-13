import { supabase } from '@/lib/supabase';

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  image_url?: string;
  registration_url?: string;
  is_featured: boolean;
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

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching events:', error);
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

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
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
      console.error('Error fetching featured events:', error);
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
      console.error('Error creating event:', error);
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
      console.error('Error updating event:', error);
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
      console.error('Error deleting event:', error);
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

      return {
        total: totalEvents.count || 0,
        upcoming: upcomingEvents.count || 0,
        past: pastEvents.count || 0,
        // This would need to be calculated from actual attendance data
        totalAttendees: 247 // Placeholder - implement when you have attendance tracking
      };
    } catch (error) {
      console.error('Error fetching event stats:', error);
      return {
        total: 0,
        upcoming: 0,
        past: 0,
        totalAttendees: 0
      };
    }
  }
}