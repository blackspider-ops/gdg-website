-- Sync existing storage files to media_files table
-- This creates database records for files that exist in storage but not in the database

CREATE OR REPLACE FUNCTION sync_storage_to_media_files()
RETURNS TABLE (
  synced_count INTEGER,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_file RECORD;
  v_synced_count INTEGER := 0;
  v_file_type TEXT;
  v_file_extension TEXT;
  v_first_admin_id UUID;
BEGIN
  -- Get first active admin to use as uploader
  SELECT id INTO v_first_admin_id FROM public.admin_users WHERE is_active = true LIMIT 1;
  
  IF v_first_admin_id IS NULL THEN
    RETURN QUERY SELECT 0, 'No active admin user found to assign as uploader'::TEXT;
    RETURN;
  END IF;

  -- Loop through all files in the media bucket from storage.objects
  FOR v_file IN 
    SELECT 
      id,
      name,
      bucket_id,
      owner,
      created_at,
      updated_at,
      last_accessed_at,
      metadata
    FROM storage.objects
    WHERE bucket_id = 'media'
    AND name NOT LIKE '.emptyFolderPlaceholder'
  LOOP
    -- Check if file already exists in media_files
    IF NOT EXISTS (
      SELECT 1 FROM public.media_files 
      WHERE file_path = v_file.name
    ) THEN
      -- Extract file extension
      v_file_extension := LOWER(SUBSTRING(v_file.name FROM '\.([^.]+)$'));
      
      -- Determine file type based on extension
      v_file_type := CASE
        WHEN v_file_extension IN ('jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico') THEN 'image'
        WHEN v_file_extension IN ('mp4', 'webm', 'mov', 'avi', 'mkv') THEN 'video'
        WHEN v_file_extension IN ('mp3', 'wav', 'ogg', 'flac', 'm4a') THEN 'audio'
        WHEN v_file_extension IN ('pdf', 'doc', 'docx', 'txt') THEN 'document'
        ELSE 'other'
      END;
      
      -- Insert into media_files
      INSERT INTO public.media_files (
        name,
        original_name,
        file_path,
        file_type,
        file_size,
        mime_type,
        is_public,
        uploaded_by,
        created_at,
        updated_at
      ) VALUES (
        v_file.name,
        v_file.name,
        v_file.name,
        v_file_type,
        COALESCE((v_file.metadata->>'size')::BIGINT, 0),
        COALESCE(v_file.metadata->>'mimetype', 'application/octet-stream'),
        TRUE,
        v_first_admin_id,
        v_file.created_at,
        v_file.updated_at
      );
      
      v_synced_count := v_synced_count + 1;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT v_synced_count, format('Synced %s file(s) from storage to database', v_synced_count);
END;
$$;

-- Run the sync function
SELECT * FROM sync_storage_to_media_files();

-- Grant execute permission
GRANT EXECUTE ON FUNCTION sync_storage_to_media_files TO authenticated, service_role;

COMMENT ON FUNCTION sync_storage_to_media_files IS 'Syncs files from storage bucket to media_files table';
