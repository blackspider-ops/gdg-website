-- Add monitoring and alerting for security events
-- LOW FIX: Monitor failed login attempts and suspicious activity

-- Create security alerts table
CREATE TABLE IF NOT EXISTS security_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT,
  details JSONB,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_security_alerts_type ON security_alerts(alert_type);
CREATE INDEX idx_security_alerts_severity ON security_alerts(severity);
CREATE INDEX idx_security_alerts_resolved ON security_alerts(is_resolved);
CREATE INDEX idx_security_alerts_created ON security_alerts(created_at DESC);

-- Enable RLS
ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;

-- Only super admins can view alerts
CREATE POLICY "Super admins can view security alerts"
ON security_alerts FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid()
    AND role = 'super_admin'
    AND is_active = true
  )
);

-- Service role can manage alerts
CREATE POLICY "Service role can manage security alerts"
ON security_alerts
TO service_role
USING (true)
WITH CHECK (true);

-- Function to create security alert
CREATE OR REPLACE FUNCTION create_security_alert(
  p_alert_type TEXT,
  p_severity TEXT,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_details JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_alert_id UUID;
BEGIN
  INSERT INTO security_alerts (
    alert_type,
    severity,
    title,
    description,
    details
  ) VALUES (
    p_alert_type,
    p_severity,
    p_title,
    p_description,
    p_details
  ) RETURNING id INTO v_alert_id;
  
  RETURN v_alert_id;
END;
$$;

-- Function to monitor failed login attempts
CREATE OR REPLACE FUNCTION monitor_failed_logins()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recent_failures INTEGER;
  v_email TEXT;
BEGIN
  -- Only monitor login_failed events
  IF NEW.event_type != 'login_failed' THEN
    RETURN NEW;
  END IF;
  
  v_email := NEW.details->>'email';
  
  -- Count recent failures for this email (last 15 minutes)
  SELECT COUNT(*) INTO v_recent_failures
  FROM security_events
  WHERE event_type = 'login_failed'
  AND details->>'email' = v_email
  AND created_at > NOW() - INTERVAL '15 minutes';
  
  -- Create alert if threshold exceeded
  IF v_recent_failures >= 5 THEN
    PERFORM create_security_alert(
      'multiple_failed_logins',
      'high',
      'Multiple Failed Login Attempts',
      format('Email %s has %s failed login attempts in the last 15 minutes', v_email, v_recent_failures),
      jsonb_build_object(
        'email', v_email,
        'attempt_count', v_recent_failures,
        'time_window', '15 minutes'
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for failed login monitoring
DROP TRIGGER IF EXISTS trigger_monitor_failed_logins ON security_events;
CREATE TRIGGER trigger_monitor_failed_logins
  AFTER INSERT ON security_events
  FOR EACH ROW
  EXECUTE FUNCTION monitor_failed_logins();

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_security_alert TO service_role;
