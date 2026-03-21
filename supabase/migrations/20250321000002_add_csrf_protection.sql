-- Add CSRF token management
-- MEDIUM FIX: Protect against cross-site request forgery

-- Create CSRF tokens table
CREATE TABLE IF NOT EXISTS csrf_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  admin_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_csrf_tokens_token ON csrf_tokens(token);
CREATE INDEX idx_csrf_tokens_expires ON csrf_tokens(expires_at);
CREATE INDEX idx_csrf_tokens_admin ON csrf_tokens(admin_id);

-- Enable RLS
ALTER TABLE csrf_tokens ENABLE ROW LEVEL SECURITY;

-- Service role can manage tokens
CREATE POLICY "Service role can manage csrf tokens"
ON csrf_tokens
TO service_role
USING (true)
WITH CHECK (true);

-- Function to generate CSRF token
CREATE OR REPLACE FUNCTION generate_csrf_token(
  p_admin_id UUID DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token TEXT;
BEGIN
  -- Generate secure random token
  v_token := encode(gen_random_bytes(32), 'base64');
  
  -- Store token (expires in 1 hour)
  INSERT INTO csrf_tokens (token, admin_id, expires_at)
  VALUES (v_token, p_admin_id, NOW() + INTERVAL '1 hour');
  
  RETURN v_token;
END;
$$;

-- Function to validate CSRF token
CREATE OR REPLACE FUNCTION validate_csrf_token(
  p_token TEXT,
  p_admin_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_valid BOOLEAN;
BEGIN
  -- Check if token exists, not used, not expired
  SELECT EXISTS (
    SELECT 1 FROM csrf_tokens
    WHERE token = p_token
    AND (admin_id = p_admin_id OR admin_id IS NULL)
    AND used = false
    AND expires_at > NOW()
  ) INTO v_valid;
  
  IF v_valid THEN
    -- Mark token as used
    UPDATE csrf_tokens
    SET used = true
    WHERE token = p_token;
  END IF;
  
  RETURN v_valid;
END;
$$;

-- Function to cleanup expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_csrf_tokens()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM csrf_tokens
  WHERE expires_at < NOW() - INTERVAL '1 day';
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION generate_csrf_token TO anon, authenticated;
GRANT EXECUTE ON FUNCTION validate_csrf_token TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_csrf_tokens TO service_role;
