-- Add secure session management with httpOnly cookies
-- CRITICAL FIX: Move sessions from localStorage to database

-- Create admin sessions table
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  refresh_token TEXT NOT NULL UNIQUE,
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Create indexes
CREATE INDEX idx_admin_sessions_admin_id ON admin_sessions(admin_id);
CREATE INDEX idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX idx_admin_sessions_expires ON admin_sessions(expires_at);
CREATE INDEX idx_admin_sessions_active ON admin_sessions(is_active);

-- Enable RLS
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

-- Only service role can manage sessions
CREATE POLICY "Service role can manage sessions"
ON admin_sessions
TO service_role
USING (true)
WITH CHECK (true);

-- Function to create session
CREATE OR REPLACE FUNCTION create_admin_session(
  p_admin_id UUID,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS TABLE (
  session_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_token TEXT;
  v_refresh_token TEXT;
  v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Generate secure random tokens
  v_session_token := encode(gen_random_bytes(32), 'base64');
  v_refresh_token := encode(gen_random_bytes(32), 'base64');
  v_expires_at := NOW() + INTERVAL '24 hours';
  
  -- Invalidate old sessions for this admin (keep only last 5)
  DELETE FROM admin_sessions
  WHERE admin_id = p_admin_id
  AND id NOT IN (
    SELECT id FROM admin_sessions
    WHERE admin_id = p_admin_id
    ORDER BY created_at DESC
    LIMIT 5
  );
  
  -- Create new session
  INSERT INTO admin_sessions (
    admin_id,
    session_token,
    refresh_token,
    ip_address,
    user_agent,
    expires_at
  ) VALUES (
    p_admin_id,
    v_session_token,
    v_refresh_token,
    p_ip_address,
    p_user_agent,
    v_expires_at
  );
  
  RETURN QUERY SELECT v_session_token, v_refresh_token, v_expires_at;
END;
$$;

-- Function to validate session
CREATE OR REPLACE FUNCTION validate_admin_session(
  p_session_token TEXT
)
RETURNS TABLE (
  valid BOOLEAN,
  admin_id UUID,
  email TEXT,
  role TEXT,
  display_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session admin_sessions%ROWTYPE;
  v_admin admin_users%ROWTYPE;
BEGIN
  -- Get session
  SELECT * INTO v_session
  FROM admin_sessions
  WHERE session_token = p_session_token
  AND is_active = true
  AND expires_at > NOW();
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT;
    RETURN;
  END IF;
  
  -- Update last activity
  UPDATE admin_sessions
  SET last_activity = NOW()
  WHERE id = v_session.id;
  
  -- Get admin user
  SELECT * INTO v_admin
  FROM admin_users
  WHERE id = v_session.admin_id
  AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT 
    TRUE,
    v_admin.id,
    v_admin.email,
    v_admin.role::TEXT,
    v_admin.display_name;
END;
$$;

-- Function to invalidate session
CREATE OR REPLACE FUNCTION invalidate_admin_session(
  p_session_token TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE admin_sessions
  SET is_active = false
  WHERE session_token = p_session_token;
  
  RETURN FOUND;
END;
$$;

-- Function to cleanup expired sessions (run via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM admin_sessions
  WHERE expires_at < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_admin_session TO anon, authenticated;
GRANT EXECUTE ON FUNCTION validate_admin_session TO anon, authenticated;
GRANT EXECUTE ON FUNCTION invalidate_admin_session TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_sessions TO service_role;
