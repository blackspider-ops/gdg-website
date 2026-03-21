-- Improve authentication security
-- MEDIUM FIX: Prevent account enumeration and timing attacks

-- Update authenticate_admin function with constant-time comparison
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
  v_dummy_hash TEXT := '$2b$12$dummyhashtopreventtimingattacksxxxxxxxxxxxxxxxxxxxxxxxxxxx';
  v_start_time TIMESTAMP;
  v_elapsed_ms INTEGER;
  v_delay_ms INTEGER;
BEGIN
  v_start_time := clock_timestamp();
  
  -- Normalize email
  p_email := LOWER(TRIM(p_email));
  
  -- Check rate limiting (max 5 attempts per 15 minutes)
  SELECT COUNT(*), MAX(created_at)
  INTO v_login_attempts, v_last_attempt
  FROM security_events
  WHERE event_type = 'login_failed'
    AND details->>'email' = p_email
    AND created_at > NOW() - INTERVAL '15 minutes';
  
  IF v_login_attempts >= 5 THEN
    -- Add random delay to prevent timing attacks
    PERFORM pg_sleep(random() * 2);
    
    -- Log blocked attempt
    INSERT INTO security_events (event_type, details)
    VALUES ('account_locked', jsonb_build_object(
      'email', p_email,
      'reason', 'too_many_attempts',
      'attempts', v_login_attempts
    ));
    
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, 
      'Invalid email or password'::TEXT; -- Generic message
    RETURN;
  END IF;
  
  -- Fetch admin user (without exposing to frontend)
  SELECT * INTO v_admin_user
  FROM admin_users
  WHERE admin_users.email = p_email
    AND is_active = true;
  
  -- Always perform password check to prevent timing attacks
  IF FOUND THEN
    v_password_valid := (v_admin_user.password_hash = crypt(p_password, v_admin_user.password_hash));
  ELSE
    -- Perform dummy hash check to maintain constant time
    v_password_valid := (v_dummy_hash = crypt(p_password, v_dummy_hash));
    v_password_valid := FALSE; -- Always false for non-existent users
  END IF;
  
  -- Add random delay to prevent timing attacks (50-150ms)
  v_elapsed_ms := EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_start_time))::INTEGER;
  v_delay_ms := 100 + (random() * 50)::INTEGER - v_elapsed_ms;
  IF v_delay_ms > 0 THEN
    PERFORM pg_sleep(v_delay_ms / 1000.0);
  END IF;
  
  IF NOT v_password_valid THEN
    -- Log failed attempt (generic message to prevent user enumeration)
    INSERT INTO security_events (event_type, details)
    VALUES ('login_failed', jsonb_build_object(
      'email', p_email,
      'reason', 'invalid_credentials',
      'timestamp', NOW()
    ));
    
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

-- Add function to check password against breach database
-- This would integrate with HaveIBeenPwned API in production
CREATE OR REPLACE FUNCTION is_password_breached(
  p_password TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_common_passwords TEXT[] := ARRAY[
    'password', 'Password123', '12345678', 'qwerty', 'abc123',
    'password1', 'Password1', '123456789', 'letmein', 'welcome',
    'admin', 'Admin123', 'root', 'toor', 'pass123'
  ];
BEGIN
  -- Check against common passwords list
  IF p_password = ANY(v_common_passwords) THEN
    RETURN TRUE;
  END IF;
  
  -- In production, integrate with HaveIBeenPwned API here
  -- For now, just check common patterns
  IF p_password ~* '^password' OR p_password ~* '^admin' THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Update create_admin_user to check for breached passwords
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
  -- Validate password strength (increased to 14 characters)
  IF LENGTH(p_password) < 14 THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Password must be at least 14 characters'::TEXT;
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
  
  -- Check if password is breached
  IF is_password_breached(p_password) THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'This password has been found in data breaches. Please choose a different password.'::TEXT;
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

GRANT EXECUTE ON FUNCTION is_password_breached TO authenticated;
