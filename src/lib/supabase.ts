import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface AdminUser {
  id: string;
  email: string;
  password_hash: string;
  role: 'super_admin' | 'admin' | 'blog_editor';
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

export interface AdminAction {
  id: string;
  admin_id: string;
  action: string;
  target_email?: string;
  details?: any;
  created_at: string;
  admin_users?: {
    email: string;
  };
}