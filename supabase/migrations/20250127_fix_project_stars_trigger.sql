-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS update_project_stars_count_trigger ON project_stars;
DROP FUNCTION IF EXISTS update_project_stars_count();

-- Recreate the function with better error handling
CREATE OR REPLACE FUNCTION update_project_stars_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle INSERT (star added)
    IF TG_OP = 'INSERT' THEN
        UPDATE projects 
        SET stars_count = COALESCE(stars_count, 0) + 1 
        WHERE id = NEW.project_id;
        
        -- Log for debugging
        RAISE NOTICE 'Added star to project %, new count: %', NEW.project_id, (SELECT stars_count FROM projects WHERE id = NEW.project_id);
        
        RETURN NEW;
    END IF;
    
    -- Handle DELETE (star removed)
    IF TG_OP = 'DELETE' THEN
        UPDATE projects 
        SET stars_count = GREATEST(COALESCE(stars_count, 0) - 1, 0)
        WHERE id = OLD.project_id;
        
        -- Log for debugging
        RAISE NOTICE 'Removed star from project %, new count: %', OLD.project_id, (SELECT stars_count FROM projects WHERE id = OLD.project_id);
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER update_project_stars_count_trigger
    AFTER INSERT OR DELETE ON project_stars
    FOR EACH ROW
    EXECUTE FUNCTION update_project_stars_count();

-- Recalculate all star counts to ensure consistency
UPDATE projects 
SET stars_count = (
    SELECT COUNT(*) 
    FROM project_stars 
    WHERE project_stars.project_id = projects.id
);

-- Test the trigger by adding and removing a test star
DO $$
DECLARE
    test_project_id UUID;
    initial_count INTEGER;
    after_insert_count INTEGER;
    after_delete_count INTEGER;
BEGIN
    -- Get a project ID to test with
    SELECT id INTO test_project_id FROM projects LIMIT 1;
    
    IF test_project_id IS NOT NULL THEN
        -- Get initial count
        SELECT stars_count INTO initial_count FROM projects WHERE id = test_project_id;
        RAISE NOTICE 'Testing with project %, initial count: %', test_project_id, initial_count;
        
        -- Insert a test star
        INSERT INTO project_stars (project_id, user_identifier) 
        VALUES (test_project_id, 'test_trigger_' || extract(epoch from now()));
        
        -- Check count after insert
        SELECT stars_count INTO after_insert_count FROM projects WHERE id = test_project_id;
        RAISE NOTICE 'After insert count: %', after_insert_count;
        
        -- Delete the test star
        DELETE FROM project_stars 
        WHERE project_id = test_project_id 
        AND user_identifier LIKE 'test_trigger_%';
        
        -- Check count after delete
        SELECT stars_count INTO after_delete_count FROM projects WHERE id = test_project_id;
        RAISE NOTICE 'After delete count: %', after_delete_count;
        
        -- Verify the trigger worked
        IF after_insert_count = initial_count + 1 AND after_delete_count = initial_count THEN
            RAISE NOTICE 'Trigger test PASSED!';
        ELSE
            RAISE NOTICE 'Trigger test FAILED! Expected: % -> % -> %, Got: % -> % -> %', 
                initial_count, initial_count + 1, initial_count,
                initial_count, after_insert_count, after_delete_count;
        END IF;
    END IF;
END $$;