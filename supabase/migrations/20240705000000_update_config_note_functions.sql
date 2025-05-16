-- Migracja - aktualizacja funkcji config_note

-- Aktualizacja funkcji create_config_note
CREATE OR REPLACE FUNCTION create_config_note(
  p_project_id uuid,
  p_title text,
  p_content text,
  p_priority integer,
  p_arrival_date date,
  p_departure_date date,
  p_num_days integer DEFAULT NULL,
  p_num_people integer DEFAULT 1,
  p_tags text[],
  p_destination text DEFAULT NULL,
  p_travel_style text DEFAULT NULL,
  p_budget text DEFAULT NULL,
  p_interests text[] DEFAULT NULL,
  p_accommodation_address text DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_note_id uuid;
  v_next_position integer;
  v_calculated_days integer;
BEGIN
  -- Pobierz następną pozycję dla notatki
  SELECT COALESCE(MAX(position), 0) + 1 INTO v_next_position
  FROM notes
  WHERE project_id = p_project_id;
  
  -- Oblicz liczbę dni automatycznie (różnica dat + 1)
  -- Jeśli daty są takie same, to jest to 1 dzień
  v_calculated_days := (p_departure_date - p_arrival_date) + 1;

  -- Upewnij się, że mamy poprawnego num_people (minimum 1)
  IF p_num_people IS NULL OR p_num_people < 1 THEN
    p_num_people := 1;
  END IF;
  
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
    0, -- Zawsze pozycja 0 dla notatki konfiguracyjnej
    0  -- Zawsze priorytet 0 dla notatki konfiguracyjnej
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
    interests,
    accommodation_address
  ) VALUES (
    v_note_id,
    p_arrival_date,
    p_departure_date,
    v_calculated_days, -- Używamy obliczonej wartości
    p_num_people,
    p_destination,
    p_travel_style,
    p_budget,
    p_interests,
    p_accommodation_address
  );
  
  -- Wstaw tagi jeśli istnieją
  IF p_tags IS NOT NULL AND array_length(p_tags, 1) > 0 THEN
    INSERT INTO note_tags (note_id, tag_name)
    SELECT v_note_id, tag
    FROM unnest(p_tags) AS tag;
  END IF;
  
  -- Aktualizuj last_notes_update_at dla projektu
  UPDATE travel_projects
  SET last_notes_update_at = NOW(),
      has_config_note = true
  WHERE id = p_project_id;
  
  RETURN v_note_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aktualizacja funkcji update_config_note
CREATE OR REPLACE FUNCTION update_config_note(
  p_note_id uuid,
  p_title text DEFAULT NULL,
  p_content text DEFAULT NULL,
  p_priority integer DEFAULT NULL,
  p_arrival_date date DEFAULT NULL,
  p_departure_date date DEFAULT NULL,
  p_num_days integer DEFAULT NULL,
  p_num_people integer DEFAULT NULL,
  p_tags text[] DEFAULT NULL,
  p_destination text DEFAULT NULL,
  p_travel_style text DEFAULT NULL,
  p_budget text DEFAULT NULL,
  p_interests text[] DEFAULT NULL,
  p_accommodation_address text DEFAULT NULL
) RETURNS void AS $$
DECLARE
  v_project_id uuid;
  v_current_arrival_date date;
  v_current_departure_date date;
  v_calculated_days integer;
BEGIN
  -- Pobierz project_id dla notatki
  SELECT project_id INTO v_project_id
  FROM notes
  WHERE id = p_note_id;
  
  -- Aktualizuj notatkę
  UPDATE notes
  SET
    title = COALESCE(p_title, title),
    content = COALESCE(p_content, content),
    priority = 0, -- Zawsze priorytet 0 dla notatki konfiguracyjnej
    updated_at = NOW()
  WHERE id = p_note_id;
  
  -- Pobierz aktualne daty, aby obliczyć liczbę dni
  SELECT 
    COALESCE(p_arrival_date, arrival_date),
    COALESCE(p_departure_date, departure_date)
  INTO 
    v_current_arrival_date,
    v_current_departure_date
  FROM config_data
  WHERE note_id = p_note_id;
  
  -- Oblicz liczbę dni automatycznie (różnica dat + 1)
  v_calculated_days := (v_current_departure_date - v_current_arrival_date) + 1;
  
  -- Aktualizuj dane konfiguracyjne
  UPDATE config_data
  SET
    arrival_date = COALESCE(p_arrival_date, arrival_date),
    departure_date = COALESCE(p_departure_date, departure_date),
    num_days = v_calculated_days, -- Zawsze używamy obliczonej wartości
    num_people = COALESCE(p_num_people, num_people),
    destination = COALESCE(p_destination, destination),
    travel_style = COALESCE(p_travel_style, travel_style),
    budget = COALESCE(p_budget, budget),
    interests = COALESCE(p_interests, interests),
    accommodation_address = COALESCE(p_accommodation_address, accommodation_address)
  WHERE note_id = p_note_id;
  
  -- Aktualizuj tagi jeśli podano
  IF p_tags IS NOT NULL THEN
    -- Usuń istniejące tagi
    DELETE FROM note_tags
    WHERE note_id = p_note_id;
    
    -- Dodaj nowe tagi
    IF array_length(p_tags, 1) > 0 THEN
      INSERT INTO note_tags (note_id, tag_name)
      SELECT p_note_id, tag
      FROM unnest(p_tags) AS tag;
    END IF;
  END IF;
  
  -- Aktualizuj last_notes_update_at dla projektu
  UPDATE travel_projects
  SET last_notes_update_at = NOW()
  WHERE id = v_project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 