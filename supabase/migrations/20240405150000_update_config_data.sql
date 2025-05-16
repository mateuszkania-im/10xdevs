-- Migracja - dodanie nowych kolumn do config_data

-- Dodanie nowych kolumn do tabeli config_data
ALTER TABLE config_data 
ADD COLUMN destination text, 
ADD COLUMN travel_style text,
ADD COLUMN budget text,
ADD COLUMN interests text[];

-- Tworzenie lub aktualizacja funkcji create_config_note
CREATE OR REPLACE FUNCTION create_config_note(
  p_project_id uuid,
  p_title text,
  p_content text,
  p_priority integer,
  p_arrival_date date,
  p_departure_date date,
  p_num_days integer,
  p_num_people integer,
  p_tags text[],
  p_destination text DEFAULT NULL,
  p_travel_style text DEFAULT NULL,
  p_budget text DEFAULT NULL,
  p_interests text[] DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_note_id uuid;
  v_next_position integer;
BEGIN
  -- Pobierz następną pozycję dla notatki
  SELECT COALESCE(MAX(position), 0) + 1 INTO v_next_position
  FROM notes
  WHERE project_id = p_project_id;
  
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
    true,
    v_next_position,
    p_priority
  ) RETURNING id INTO v_note_id;
  
  -- Wstaw dane konfiguracyjne
  INSERT INTO config_data (
    note_id,
    arrival_date,
    departure_date,
    num_days,
    num_people,
    destination,
    travel_style,
    budget,
    interests
  ) VALUES (
    v_note_id,
    p_arrival_date,
    p_departure_date,
    p_num_days,
    p_num_people,
    p_destination,
    p_travel_style,
    p_budget,
    p_interests
  );
  
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
  
  RETURN v_note_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 