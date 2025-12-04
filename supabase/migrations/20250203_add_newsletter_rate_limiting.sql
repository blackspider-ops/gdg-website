-- Add rate limiting for newsletter subscriptions
-- Track subscription attempts to prevent abuse

CREATE TABLE IF NOT EXISTS newsletter_subscription_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  first_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  blocked_until TIMESTAMP WITH TIME ZONE,
  block_level INTEGER DEFAULT 0, -- 0: not blocked, 1: 1 hour, 2: 24 hours, 3+: 24 hours per attempt
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_newsletter_attempts_email ON newsletter_subscription_attempts(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_attempts_blocked ON newsletter_subscription_attempts(blocked_until);

-- Function to check and update rate limit
CREATE OR REPLACE FUNCTION check_newsletter_rate_limit(user_email TEXT)
RETURNS TABLE(
  is_blocked BOOLEAN,
  blocked_until_time TIMESTAMP WITH TIME ZONE,
  attempts_remaining INTEGER,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempt RECORD;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
  v_hour_ago TIMESTAMP WITH TIME ZONE := NOW() - INTERVAL '1 hour';
  v_new_blocked_until TIMESTAMP WITH TIME ZONE;
  v_new_block_level INTEGER;
BEGIN
  -- Get existing attempt record
  SELECT * INTO v_attempt
  FROM newsletter_subscription_attempts
  WHERE email = user_email;

  -- If no record exists, create one
  IF v_attempt IS NULL THEN
    INSERT INTO newsletter_subscription_attempts (email, attempt_count, first_attempt_at, last_attempt_at)
    VALUES (user_email, 1, v_now, v_now);
    
    RETURN QUERY SELECT FALSE, NULL::TIMESTAMP WITH TIME ZONE, 2, 'Attempt recorded'::TEXT;
    RETURN;
  END IF;

  -- Check if currently blocked
  IF v_attempt.blocked_until IS NOT NULL AND v_attempt.blocked_until > v_now THEN
    RETURN QUERY SELECT 
      TRUE, 
      v_attempt.blocked_until,
      0,
      'You are temporarily blocked from subscribing. Please try again later.'::TEXT;
    RETURN;
  END IF;

  -- If block expired, reset counters
  IF v_attempt.blocked_until IS NOT NULL AND v_attempt.blocked_until <= v_now THEN
    UPDATE newsletter_subscription_attempts
    SET 
      attempt_count = 1,
      first_attempt_at = v_now,
      last_attempt_at = v_now,
      blocked_until = NULL,
      updated_at = v_now
    WHERE email = user_email;
    
    RETURN QUERY SELECT FALSE, NULL::TIMESTAMP WITH TIME ZONE, 2, 'Block expired, attempt recorded'::TEXT;
    RETURN;
  END IF;

  -- Reset counter if more than 1 hour has passed since first attempt
  IF v_attempt.first_attempt_at < v_hour_ago THEN
    UPDATE newsletter_subscription_attempts
    SET 
      attempt_count = 1,
      first_attempt_at = v_now,
      last_attempt_at = v_now,
      updated_at = v_now
    WHERE email = user_email;
    
    RETURN QUERY SELECT FALSE, NULL::TIMESTAMP WITH TIME ZONE, 2, 'Counter reset, attempt recorded'::TEXT;
    RETURN;
  END IF;

  -- Increment attempt count
  v_attempt.attempt_count := v_attempt.attempt_count + 1;

  -- Check if we need to block
  IF v_attempt.attempt_count >= 3 THEN
    -- Determine block duration based on block level
    IF v_attempt.block_level = 0 THEN
      -- First block: 1 hour
      v_new_blocked_until := v_now + INTERVAL '1 hour';
      v_new_block_level := 1;
    ELSIF v_attempt.block_level = 1 THEN
      -- Second block: 24 hours
      v_new_blocked_until := v_now + INTERVAL '24 hours';
      v_new_block_level := 2;
    ELSE
      -- Subsequent blocks: 24 hours each
      v_new_blocked_until := v_now + INTERVAL '24 hours';
      v_new_block_level := v_attempt.block_level + 1;
    END IF;

    UPDATE newsletter_subscription_attempts
    SET 
      attempt_count = v_attempt.attempt_count,
      last_attempt_at = v_now,
      blocked_until = v_new_blocked_until,
      block_level = v_new_block_level,
      updated_at = v_now
    WHERE email = user_email;

    RETURN QUERY SELECT 
      TRUE, 
      v_new_blocked_until,
      0,
      'Too many attempts. You have been temporarily blocked.'::TEXT;
    RETURN;
  END IF;

  -- Update attempt count
  UPDATE newsletter_subscription_attempts
  SET 
    attempt_count = v_attempt.attempt_count,
    last_attempt_at = v_now,
    updated_at = v_now
  WHERE email = user_email;

  RETURN QUERY SELECT 
    FALSE, 
    NULL::TIMESTAMP WITH TIME ZONE, 
    3 - v_attempt.attempt_count,
    'Attempt recorded'::TEXT;
END;
$$;

-- Function to clean up old attempt records (run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_newsletter_attempts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete records older than 30 days where block has expired
  DELETE FROM newsletter_subscription_attempts
  WHERE 
    created_at < NOW() - INTERVAL '30 days'
    AND (blocked_until IS NULL OR blocked_until < NOW());
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;
