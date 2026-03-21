-- Add function to update admin password
-- Allows admins to change their own password or super admins to reset others

CREATE OR REPLACE FUNCTION update_admin_password(
  p_admin_id UUID,
  p_new_password TEXT,
  p_current_password TEXT DEFAULT NULL
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
  v_admin admin_users%ROWTYPE;
  v_password_hash TEXT;
BEGIN
  -- Get admin user
  SELECT * INTO v_admin
  FROM admin_users
  WHERE id = p_admin_id
    AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Admin user not found'::TEXT;
    RETURN;
  END IF;
  
  -- If current password provided, verify it
  IF p_current_password IS NOT NULL THEN
    IF v_admin.password_hash != crypt(p_current_password, v_admin.password_hash) THEN
      RETURN QUERY SELECT FALSE, 'Current password is incorrect'::TEXT;
      RETURN;
    END IF;
  END IF;
  
  -- Validate new password strength
  IF LENGTH(p_new_password) < 8 THEN
    RETURN QUERY SELECT FALSE, 'Password must be at least 8 characters'::TEXT;
    RETURN;
  END IF;
  
  -- Hash new password
  v_password_hash := crypt(p_new_password, gen_salt('bf', 12));
  
  -- Update password
  UPDATE admin_users
  SET password_hash = v_password_hash,
      password_changed_at = NOW(),
      must_change_password = FALSE
  WHERE id = p_admin_id;
  
  -- Log the action
  INSERT INTO admin_actions (admin_id, action, details)
  VALUES (p_admin_id, 'change_password', jsonb_build_object('timestamp', NOW()));
  
  RETURN QUERY SELECT TRUE, 'Password updated successfully'::TEXT;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_admin_password TO authenticated, anon;

COMMENT ON FUNCTION update_admin_password IS 'Securely updates admin password with validation';
