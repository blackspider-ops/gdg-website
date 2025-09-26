-- Fix function search path security warnings
-- This sets a secure search_path for all functions to prevent search path attacks

-- Set search_path for all the functions mentioned in the warnings
ALTER FUNCTION public.log_admin_login SET search_path = public;
ALTER FUNCTION public.increment_link_clicks SET search_path = public;
ALTER FUNCTION public.mark_overdue_tasks SET search_path = public;
ALTER FUNCTION public.update_media_updated_at_column SET search_path = public;
ALTER FUNCTION public.update_folder_path SET search_path = public;
ALTER FUNCTION public.get_file_type_from_mime SET search_path = public;
ALTER FUNCTION public.increment_attendees_count SET search_path = public;
ALTER FUNCTION public.decrement_attendees_count SET search_path = public;
ALTER FUNCTION public.update_blog_updated_at_column SET search_path = public;
ALTER FUNCTION public.is_admin_user SET search_path = public;
ALTER FUNCTION public.update_campaign_stats SET search_path = public;
ALTER FUNCTION public.increment_blog_views SET search_path = public;
ALTER FUNCTION public.is_authenticated_admin SET search_path = public;
ALTER FUNCTION public.debug_current_user SET search_path = public;
ALTER FUNCTION public.update_updated_at_column SET search_path = public;