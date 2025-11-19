-- Add automatic overdue task detection system (no email handling)

-- Drop existing function if it exists to avoid return type conflicts
DROP FUNCTION IF EXISTS mark_overdue_tasks();

-- Function to mark overdue tasks (database operations only)
CREATE OR REPLACE FUNCTION mark_overdue_tasks()
RETURNS INTEGER AS $$
DECLARE
    marked_count INTEGER := 0;
BEGIN
    -- Mark tasks as overdue and count them
    UPDATE communication_tasks 
    SET status = 'overdue', updated_at = NOW()
    WHERE due_date < CURRENT_DATE 
    AND status IN ('pending', 'in-progress');
    
    GET DIAGNOSTICS marked_count = ROW_COUNT;
    
    -- Log the count
    IF marked_count > 0 THEN
        RAISE NOTICE 'Marked % tasks as overdue', marked_count;
    END IF;
    
    RETURN marked_count;
END;
$$ LANGUAGE plpgsql;

-- Function to be called by edge functions or manually
CREATE OR REPLACE FUNCTION check_and_mark_overdue_tasks()
RETURNS TABLE(marked_count INTEGER, message TEXT) AS $$
DECLARE
    actual_marked_count INTEGER := 0;
    potential_count INTEGER := 0;
BEGIN
    -- Count tasks that will be marked as overdue
    SELECT COUNT(*) INTO potential_count
    FROM communication_tasks 
    WHERE due_date < CURRENT_DATE 
    AND status IN ('pending', 'in-progress');
    
    -- Mark them as overdue if any exist
    IF potential_count > 0 THEN
        SELECT mark_overdue_tasks() INTO actual_marked_count;
        RETURN QUERY SELECT actual_marked_count, format('Marked %s task(s) as overdue', actual_marked_count);
    ELSE
        RETURN QUERY SELECT 0, 'No overdue tasks found';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION mark_overdue_tasks() TO authenticated;
GRANT EXECUTE ON FUNCTION check_and_mark_overdue_tasks() TO authenticated;
GRANT EXECUTE ON FUNCTION mark_overdue_tasks() TO service_role;
GRANT EXECUTE ON FUNCTION check_and_mark_overdue_tasks() TO service_role;

-- Add a comment for documentation
COMMENT ON FUNCTION mark_overdue_tasks() IS 'Marks tasks as overdue when their due date has passed (database operations only)';
COMMENT ON FUNCTION check_and_mark_overdue_tasks() IS 'Checks for and marks overdue tasks, returns count and message (no email handling)';

-- Note: For production, you might want to set up a cron job using pg_cron extension
-- Example (requires pg_cron extension):
-- SELECT cron.schedule('check-overdue-tasks', '0 */6 * * *', 'SELECT check_and_mark_overdue_tasks();');
-- This would run every 6 hours

-- Email notifications are handled by the edge function (check-overdue-tasks)
-- This database function only handles the task status updates for better separation of concerns