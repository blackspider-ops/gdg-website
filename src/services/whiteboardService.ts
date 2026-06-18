import { supabase } from '@/lib/supabase';

export interface Whiteboard {
  id: string;
  name: string;
  document: any | null;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Persistence + sync for collaborative whiteboards. The tldraw store snapshot is
 * stored in whiteboards.document (JSONB). Live collaboration uses Supabase Realtime
 * on the whiteboards table (last-write-wins). See 20260616000004_whiteboards.sql.
 */
export class WhiteboardService {
  static async list(): Promise<Whiteboard[]> {
    try {
      const { data, error } = await supabase
        .from('whiteboards')
        .select('id, name, created_by, updated_by, created_at, updated_at')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Whiteboard[];
    } catch (error) {
      console.error('Error listing whiteboards:', error);
      return [];
    }
  }

  static async get(id: string): Promise<Whiteboard | null> {
    try {
      const { data, error } = await supabase
        .from('whiteboards')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Whiteboard;
    } catch (error) {
      console.error('Error loading whiteboard:', error);
      return null;
    }
  }

  static async create(name: string, createdBy: string): Promise<Whiteboard | null> {
    try {
      const { data, error } = await supabase
        .from('whiteboards')
        .insert({ name: name.trim() || 'Untitled board', created_by: createdBy, updated_by: createdBy })
        .select('*')
        .single();
      if (error) throw error;
      return data as Whiteboard;
    } catch (error) {
      console.error('Error creating whiteboard:', error);
      return null;
    }
  }

  static async saveDocument(id: string, document: any, updatedBy: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('whiteboards')
        .update({ document, updated_by: updatedBy, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving whiteboard:', error);
      return false;
    }
  }

  static async rename(id: string, name: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('whiteboards')
        .update({ name: name.trim(), updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error renaming whiteboard:', error);
      return false;
    }
  }

  static async remove(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('whiteboards').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting whiteboard:', error);
      return false;
    }
  }
}

export default WhiteboardService;
