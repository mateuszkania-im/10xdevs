-- Migracja - dodanie funkcji create_note_with_tags

-- Tworzenie funkcji create_note_with_tags
CREATE OR REPLACE FUNCTION create_note_with_tags(
  p_project_id uuid,
  p_title text,
  p_content text,
  p_position integer,
  p_priority integer,
  p_is_config_note boolean,
  p_tags text[]
) RETURNS json AS $$
DECLARE
  v_note_id uuid;
BEGIN
  -- Wstaw notatkę
  INSERT INTO notes (
    project_id,
    title,
    content,
    is_config_note,
    position,
    priority
  ) VALUES (
    p_project_id,
    p_title,
    p_content,
    p_is_config_note,
    p_position,
    p_priority
  ) RETURNING id INTO v_note_id;
  
  -- Wstaw tagi jeśli istnieją
  IF p_tags IS NOT NULL AND array_length(p_tags, 1) > 0 THEN
    INSERT INTO note_tags (note_id, tag_name)
    SELECT v_note_id, tag
    FROM unnest(p_tags) AS tag;
  END IF;
  
  -- Aktualizuj last_notes_update_at dla projektu
  UPDATE travel_projects
  SET last_notes_update_at = NOW()
  WHERE id = p_project_id;
  
  RETURN json_build_object('id', v_note_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 