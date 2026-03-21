-- Create secure authentication function that runs on the server
-- This prevents password hashes from being exposed to the frontend

CREATE OR REPLACE FUNCTION authenticate_admin(
  p_email TEXT,
  p_password TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  admin_id UUID,
  email TEXT,
  role TEXT,
  display_name TEXT,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_user admin_users%ROWTYPE;
  v_password_valid BOOLEAN;
  v_login_attempts INTEGER;
  v_last_attempt TIMESTAMP;
BEGIN
  -- Normalize email
  p_email := LOWER(TRIM(p_email));
  
  -- Check rate limiting (max 5 attempts per 15 minutes)
  SELECT COUNT(*), MAX(created_at)
  INTO v_login_attempts, v_last_attempt
  FROM security_events
  WHERE event_type = 'login_failed'
    AND admin_id IN (SELECT id FROM admin_users WHERE email = p_email)
    AND created_at > NOW() - INTERVAL '15 minutes';
  
  IF v_login_attempts >= 5 THEN
    -- Log blocked attempt
    INSERT INTO security_events (event_type, admin_id, details)
    SELECT 'account_locked', id, jsonb_build_object('reason', 'too_many_attempts', 'attempts', v_login_attempts)
    FROM admin_users WHERE email = p_email;
    
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, 
      'Account temporarily locked due to too many failed attempts. Try again in 15 minutes.'::TEXT;
    RETURN;
  END IF;
  
  -- Fetch admin user (without exposing to frontend)
  SELECT * INTO v_admin_user
  FROM admin_users
  WHERE admin_users.email = p_email
    AND is_active = true;
  
  IF NOT FOUND THEN
    -- Log failed attempt (generic message to prevent user enumeration)
    INSERT INTO security_events (event_type, details)
    VALUES ('login_failed', jsonb_build_object('email', p_email, 'reason', 'user_not_found'));
    
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, 
      'Invalid email or password'::TEXT;
    RETURN;
  END IF;
  
  -- Verify password using pgcrypto
  v_password_valid := (v_admin_user.password_hash = crypt(p_password, v_admin_user.password_hash));
  
  IF NOT v_password_valid THEN
    -- Log failed attempt
    INSERT INTO security_events (event_type, admin_id, details)
    VALUES ('login_failed', v_admin_user.id, jsonb_build_object('reason', 'invalid_password'));
    
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, 
      'Invalid email or password'::TEXT;
    RETURN;
  END IF;
  
  -- Success! Update last login
  UPDATE admin_users
  SET last_login = NOW()
  WHERE id = v_admin_user.id;
  
  -- Log successful login
  INSERT INTO security_events (event_type, admin_id, details)
  VALUES ('login_success', v_admin_user.id, jsonb_build_object('timestamp', NOW()));
  
  -- Log admin action
  INSERT INTO admin_actions (admin_id, action, details)
  VALUES (v_admin_user.id, 'login', jsonb_build_object('timestamp', NOW()));
  
  -- Return success with user info (NO PASSWORD HASH)
  RETURN QUERY SELECT 
    TRUE,
    v_admin_user.id,
    v_admin_user.email,
    v_admin_user.role::TEXT,
    v_admin_user.display_name,
    'Login successful'::TEXT;
END;
$$;

-- Grant execute permission to anonymous users (for login)
GRANT EXECUTE ON FUNCTION authenticate_admin(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION authenticate_admin(TEXT, TEXT) TO authenticated;

-- Create function to validate admin secret code
CREATE OR REPLACE FUNCTION validate_admin_secret(
  p_secret_code TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stored_code TEXT;
BEGIN
  -- Get the secret code from site_settings
  SELECT value INTO v_stored_code
  FROM site_settings
  WHERE key = 'admin_secret_code';
  
  -- Default fallback if not set
  IF v_stored_code IS NULL THEN
    v_stored_code := 'gdg-secret@psu.edu';
  END IF;
  
  -- Compare (case-insensitive)
  RETURN LOWER(TRIM(p_secret_code)) = LOWER(TRIM(v_stored_code));
END;
$$;

GRANT EXECUTE ON FUNCTION validate_admin_secret(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION validate_admin_secret(TEXT) TO authenticated;

-- Create function to create admin with hashed password
CREATE OR REPLACE FUNCTION create_admin_user(
  p_email TEXT,
  p_password TEXT,
  p_role TEXT DEFAULT 'admin',
  p_display_name TEXT DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  admin_id UUID,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_admin_id UUID;
  v_password_hash TEXT;
BEGIN
  -- Validate password strength
  IF LENGTH(p_password) < 12 THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Password must be at least 12 characters'::TEXT;
    RETURN;
  END IF;
  
  IF p_password !~ '[A-Z]' THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Password must contain at least one uppercase letter'::TEXT;
    RETURN;
  END IF;
  
  IF p_password !~ '[a-z]' THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Password must contain at least one lowercase letter'::TEXT;
    RETURN;
  END IF;
  
  IF p_password !~ '[0-9]' THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Password must contain at least one number'::TEXT;
    RETURN;
  END IF;
  
  IF p_password !~ '[!@#$%^&*(),.?":{}|<>]' THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Password must contain at least one special character'::TEXT;
    RETURN;
  END IF;
  
  -- Hash password using pgcrypto
  v_password_hash := crypt(p_password, gen_salt('bf', 12));
  
  -- Insert new admin
  INSERT INTO admin_users (email, password_hash, role, display_name, created_by, password_changed_at)
  VALUES (LOWER(TRIM(p_email)), v_password_hash, p_role::TEXT, p_display_name, p_created_by, NOW())
  RETURNING id INTO v_new_admin_id;
  
  -- Log action
  IF p_created_by IS NOT NULL THEN
    INSERT INTO admin_actions (admin_id, action, target_email, details)
    VALUES (p_created_by, 'create_admin', p_email, jsonb_build_object('new_admin_id', v_new_admin_id, 'role', p_role));
  END IF;
  
  RETURN QUERY SELECT TRUE, v_new_admin_id, 'Admin user created successfully'::TEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION create_admin_user(TEXT, TEXT, TEXT, TEXT, UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION authenticate_admin IS 'Securely authenticates admin users without exposing password hashes to the frontend. Includes rate limiting.';
COMMENT ON FUNCTION validate_admin_secret IS 'Validates admin secret code without exposing it to the frontend';
COMMENT ON FUNCTION create_admin_user IS 'Creates admin user with strong password validation and secure hashing';
