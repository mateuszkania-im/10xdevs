-- Migracja - dodanie kolumny has_config_note do travel_projects

-- Dodanie nowej kolumny do tabeli travel_projects
ALTER TABLE travel_projects 
ADD COLUMN has_config_note boolean NOT NULL DEFAULT false;

-- Aktualizacja wartości has_config_note dla istniejących projektów
UPDATE travel_projects
SET has_config_note = EXISTS (
  SELECT 1 
  FROM notes 
  WHERE notes.project_id = travel_projects.id 
  AND notes.is_config_note = true
);

-- Dodanie komentarza do kolumny
COMMENT ON COLUMN travel_projects.has_config_note IS 'Flaga wskazująca, czy projekt ma notatkę konfiguracyjną'; 