-- Add function to clear rate limiting for an admin user
-- This is useful when users get locked out

CREATE OR REPLACE FUNCTION clear_admin_rate_limit(
  p_email TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Normalize email
  p_email := LOWER(TRIM(p_email));
  
  -- Delete failed login attempts
  DELETE FROM security_events 
  WHERE event_type IN ('login_failed', 'account_locked')
    AND details->>'email' = p_email
    AND created_at > NOW() - INTERVAL '15 minutes';
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  -- Log the action
  INSERT INTO security_events (event_type, details)
  VALUES ('rate_limit_cleared', jsonb_build_object(
    'email', p_email,
    'cleared_events', v_deleted_count,
    'timestamp', NOW()
  ));
  
  RETURN QUERY SELECT 
    TRUE,
    format('Cleared %s rate limit events for %s', v_deleted_count, p_email)::TEXT;
END;
$$;

-- Grant execute to authenticated users (admins only in practice)
GRANT EXECUTE ON FUNCTION clear_admin_rate_limit TO authenticated;

COMMENT ON FUNCTION clear_admin_rate_limit IS 'Clears rate limiting events for an admin user who is locked out';
