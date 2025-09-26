-- Fix the security definer view issue
-- Drop and recreate the view without SECURITY DEFINER

DROP VIEW IF EXISTS public.newsletter_campaign_analytics CASCADE;

-- Recreate the view explicitly with SECURITY INVOKER
CREATE VIEW public.newsletter_campaign_analytics 
WITH (security_invoker = true) AS
SELECT 
    nc.id,
    nc.subject,
    nc.status,
    nc.scheduled_at,
    nc.sent_at,
    nc.recipient_count,
    nc.open_count,
    nc.click_count,
    CASE 
        WHEN nc.recipient_count > 0 THEN ROUND((nc.open_count::DECIMAL / nc.recipient_count::DECIMAL) * 100, 2)
        ELSE 0 
    END as open_rate,
    CASE 
        WHEN nc.open_count > 0 THEN ROUND((nc.click_count::DECIMAL / nc.open_count::DECIMAL) * 100, 2)
        ELSE 0 
    END as click_through_rate,
    nc.created_at,
    nc.updated_at,
    au.email as created_by_email
FROM newsletter_campaigns nc
LEFT JOIN admin_users au ON nc.created_by = au.id;