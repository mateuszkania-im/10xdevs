# Schemat bazy danych PostgreSQL dla VibeTravels

## 1. Lista tabel z kolumnami, typami danych i ograniczeniami

### users

This table is managed by Supabase Auth

- **id** UUID PRIMARY KEY DEFAULT gen_random_uuid()
- **email** TEXT NOT NULL UNIQUE
- **created_at** TIMESTAMPTZ NOT NULL DEFAULT NOW()
- **last_login** TIMESTAMPTZ

### travel_projects

- **id** UUID PRIMARY KEY DEFAULT gen_random_uuid()
- **user_id** UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- **name** TEXT NOT NULL
- **created_at** TIMESTAMPTZ NOT NULL DEFAULT NOW()
- **updated_at** TIMESTAMPTZ NOT NULL DEFAULT NOW()
- **last_notes_update_at** TIMESTAMPTZ NOT NULL DEFAULT NOW()

### notes

- **id** UUID PRIMARY KEY DEFAULT gen_random_uuid()
- **project_id** UUID NOT NULL REFERENCES travel_projects(id) ON DELETE CASCADE
- **title** TEXT NOT NULL
- **content** TEXT
- **is_config_note** BOOLEAN NOT NULL DEFAULT FALSE
- **position** INTEGER NOT NULL
- **priority** INTEGER NOT NULL DEFAULT 0
- **created_at** TIMESTAMPTZ NOT NULL DEFAULT NOW()
- **updated_at** TIMESTAMPTZ NOT NULL DEFAULT NOW()

**Ograniczenie**: jedna notatka konfiguracyjna na projekt

```sql
ALTER TABLE notes ADD CONSTRAINT one_config_per_project \
  UNIQUE (project_id) WHERE is_config_note;
```

### config_data

- **id** UUID PRIMARY KEY DEFAULT gen_random_uuid()
- **note_id** UUID NOT NULL UNIQUE REFERENCES notes(id) ON DELETE CASCADE
- **arrival_date** DATE NOT NULL
- **departure_date** DATE NOT NULL
- **num_days** INTEGER NOT NULL
- **num_people** INTEGER NOT NULL

### note_tags

- **id** UUID PRIMARY KEY DEFAULT gen_random_uuid()
- **note_id** UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE
- **tag_name** TEXT NOT NULL
- **created_at** TIMESTAMPTZ NOT NULL DEFAULT NOW()

**Ograniczenie**: unikatowy tag per notatka

```sql
ALTER TABLE note_tags ADD CONSTRAINT unique_tag_per_note \
  UNIQUE (note_id, tag_name);
```

### travel_plans

- **id** UUID PRIMARY KEY DEFAULT gen_random_uuid()
- **project_id** UUID NOT NULL REFERENCES travel_projects(id) ON DELETE CASCADE
- **version_name** TEXT NOT NULL
- **content** JSONB NOT NULL
- **is_outdated** BOOLEAN NOT NULL DEFAULT FALSE
- **created_at** TIMESTAMPTZ NOT NULL DEFAULT NOW()
- **updated_at** TIMESTAMPTZ NOT NULL DEFAULT NOW()

**Ograniczenie**: unikatowa wersja na projekt

```sql
ALTER TABLE travel_plans ADD CONSTRAINT unique_version_per_project \
  UNIQUE (project_id, version_name);
```

## 2. Relacje między tabelami

- **users → travel_projects**: 1 — \* (user_id)
- **travel_projects → notes**: 1 — \* (project_id)
- **notes → config_data**: 1 — 1 (note_id), tylko gdy is_config_note = TRUE
- **notes → note_tags**: 1 — \* (note_id)
- **travel_projects → travel_plans**: 1 — \* (project_id)

## 3. Indeksy dla wydajności

### notes

```sql
CREATE INDEX idx_notes_project_position
  ON notes(project_id, position);
CREATE INDEX idx_notes_priority
  ON notes(project_id, priority);
CREATE INDEX idx_notes_content_fts
  ON notes USING GIN (to_tsvector('simple', content));
```

### note_tags

```sql
CREATE INDEX idx_note_tags_note_id
  ON note_tags(note_id);
```

### travel_projects

```sql
CREATE INDEX idx_projects_user
  ON travel_projects(user_id);
```

### travel_plans

```sql
CREATE INDEX idx_plans_project
  ON travel_plans(project_id);
CREATE INDEX idx_plans_content_jsonb
  ON travel_plans USING GIN (content jsonb_path_ops);
```

## 4. Zasady PostgreSQL (Row Level Security)

Wszystkie tabele z danymi aplikacji mają włączone RLS. Przykład polityk:

```sql
-- Projekty
ALTER TABLE travel_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY projects_owner ON travel_projects FOR ALL
  USING (user_id = auth.uid());

-- Notatki
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY notes_owner ON notes FOR ALL
  USING (project_id IN (
    SELECT id FROM travel_projects WHERE user_id = auth.uid()
  ));

-- Tagi notatek
ALTER TABLE note_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY tags_owner ON note_tags FOR ALL
  USING (note_id IN (
    SELECT id FROM notes
    WHERE project_id IN (
      SELECT id FROM travel_projects WHERE user_id = auth.uid()
    )
  ));

-- Dane konfiguracyjne
ALTER TABLE config_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY config_owner ON config_data FOR ALL
  USING (note_id IN (
    SELECT id FROM notes
    WHERE project_id IN (
      SELECT id FROM travel_projects WHERE user_id = auth.uid()
    )
  ));

-- Plany podróży
ALTER TABLE travel_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY plans_owner ON travel_plans FOR ALL
  USING (project_id IN (
    SELECT id FROM travel_projects WHERE user_id = auth.uid()
  ));
```

## 5. Dodatkowe uwagi i mechanizmy

- **Trigger do oznaczania planów jako nieaktualnych:**

  ```sql
  CREATE FUNCTION mark_plans_outdated() RETURNS trigger AS $$
  BEGIN
    UPDATE travel_plans
      SET is_outdated = TRUE, updated_at = NOW()
      WHERE project_id = NEW.project_id;
    UPDATE travel_projects
      SET last_notes_update_at = NOW()
      WHERE id = NEW.project_id;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  CREATE TRIGGER notes_update_trigger
    AFTER INSERT OR UPDATE OR DELETE ON notes
    FOR EACH ROW EXECUTE FUNCTION mark_plans_outdated();
  ```

- **Kaskadowe usuwanie**: ON DELETE CASCADE dla relacji projects→notes, notes→config_data/note_tags, projects→travel_plans.
- **UUID**: wymagane rozszerzenie `pgcrypto` lub `uuid-ossp`.
- **Pozycjonowanie notatek**: pole `position` aktualizowane przez warstwę serwisową po operacjach drag-and-drop.
- **Migracje**: gotowy schemat do wygenerowania za pomocą narzędzia `knex`, `typeorm` lub Supabase Migrations.
