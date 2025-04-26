-- Migracja inicjalna dla VibeTravels
-- Tworzy podstawowy schemat bazy danych z tabelami i ograniczeniami

-- Tabela travel_projects
create table travel_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_notes_update_at timestamptz not null default now()
);

-- RLS dla travel_projects
alter table travel_projects enable row level security;

-- Dodajemy polityki zarówno dla anon jak i authenticated
create policy "Użytkownicy mogą wyświetlać swoje projekty"
  on travel_projects for select
  to authenticated
  using (user_id = auth.uid());

create policy "Użytkownicy mogą tworzyć swoje projekty"
  on travel_projects for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Użytkownicy mogą aktualizować swoje projekty"
  on travel_projects for update
  to authenticated
  using (user_id = auth.uid());

create policy "Użytkownicy mogą usuwać swoje projekty"
  on travel_projects for delete
  to authenticated
  using (user_id = auth.uid());

-- Odmowa dostępu dla anon (nieuwierzytelnionych)
create policy "Anonimowi użytkownicy nie mają dostępu do projektów"
  on travel_projects for all
  to anon
  using (false);

-- Tabela notes
create table notes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references travel_projects(id) on delete cascade,
  title text not null,
  content text,
  is_config_note boolean not null default false,
  position integer not null,
  priority integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Dodanie indeksu warunkowego zamiast ograniczenia z where
create unique index one_config_per_project on notes (project_id) where is_config_note = true;

-- RLS dla notes
alter table notes enable row level security;

create policy "Użytkownicy mogą wyświetlać notatki ze swoich projektów"
  on notes for select
  to authenticated
  using (project_id in (
    select id from travel_projects where user_id = auth.uid()
  ));

create policy "Użytkownicy mogą tworzyć notatki w swoich projektach"
  on notes for insert
  to authenticated
  with check (project_id in (
    select id from travel_projects where user_id = auth.uid()
  ));

create policy "Użytkownicy mogą aktualizować notatki w swoich projektach"
  on notes for update
  to authenticated
  using (project_id in (
    select id from travel_projects where user_id = auth.uid()
  ));

create policy "Użytkownicy mogą usuwać notatki ze swoich projektów"
  on notes for delete
  to authenticated
  using (project_id in (
    select id from travel_projects where user_id = auth.uid()
  ));

-- Odmowa dostępu dla anon (nieuwierzytelnionych)
create policy "Anonimowi użytkownicy nie mają dostępu do notatek"
  on notes for all
  to anon
  using (false);

-- Tabela config_data
create table config_data (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null unique references notes(id) on delete cascade,
  arrival_date date not null,
  departure_date date not null,
  num_days integer not null check (num_days > 0),
  num_people integer not null check (num_people > 0)
);

-- Dodajemy trigger do automatycznego wyliczania num_days
create or replace function calculate_num_days()
returns trigger as $$
begin
  new.num_days := (new.departure_date - new.arrival_date)::integer + 1;
  return new;
end;
$$ language plpgsql;

create trigger set_config_num_days
  before insert or update of arrival_date, departure_date on config_data
  for each row
  execute function calculate_num_days();

-- RLS dla config_data
alter table config_data enable row level security;

create policy "Użytkownicy mogą wyświetlać konfiguracje ze swoich notatek"
  on config_data for select
  to authenticated
  using (note_id in (
    select id from notes where project_id in (
      select id from travel_projects where user_id = auth.uid()
    )
  ));

create policy "Użytkownicy mogą tworzyć konfiguracje w swoich notatkach"
  on config_data for insert
  to authenticated
  with check (note_id in (
    select id from notes where project_id in (
      select id from travel_projects where user_id = auth.uid()
    )
  ));

create policy "Użytkownicy mogą aktualizować konfiguracje w swoich notatkach"
  on config_data for update
  to authenticated
  using (note_id in (
    select id from notes where project_id in (
      select id from travel_projects where user_id = auth.uid()
    )
  ));

create policy "Użytkownicy mogą usuwać konfiguracje ze swoich notatek"
  on config_data for delete
  to authenticated
  using (note_id in (
    select id from notes where project_id in (
      select id from travel_projects where user_id = auth.uid()
    )
  ));

-- Odmowa dostępu dla anon (nieuwierzytelnionych)
create policy "Anonimowi użytkownicy nie mają dostępu do konfiguracji"
  on config_data for all
  to anon
  using (false);

-- Tabela note_tags
create table note_tags (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references notes(id) on delete cascade,
  tag_name text not null,
  created_at timestamptz not null default now(),
  constraint unique_tag_per_note unique (note_id, tag_name)
);

-- RLS dla note_tags
alter table note_tags enable row level security;

create policy "Użytkownicy mogą wyświetlać tagi ze swoich notatek"
  on note_tags for select
  to authenticated
  using (note_id in (
    select id from notes where project_id in (
      select id from travel_projects where user_id = auth.uid()
    )
  ));

create policy "Użytkownicy mogą tworzyć tagi w swoich notatkach"
  on note_tags for insert
  to authenticated
  with check (note_id in (
    select id from notes where project_id in (
      select id from travel_projects where user_id = auth.uid()
    )
  ));

create policy "Użytkownicy mogą aktualizować tagi w swoich notatkach"
  on note_tags for update
  to authenticated
  using (note_id in (
    select id from notes where project_id in (
      select id from travel_projects where user_id = auth.uid()
    )
  ));

create policy "Użytkownicy mogą usuwać tagi ze swoich notatek"
  on note_tags for delete
  to authenticated
  using (note_id in (
    select id from notes where project_id in (
      select id from travel_projects where user_id = auth.uid()
    )
  ));

-- Odmowa dostępu dla anon (nieuwierzytelnionych)
create policy "Anonimowi użytkownicy nie mają dostępu do tagów"
  on note_tags for all
  to anon
  using (false);

-- Tabela travel_plans
create table travel_plans (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references travel_projects(id) on delete cascade,
  version_name text not null,
  content jsonb not null,
  is_outdated boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint unique_version_per_project unique (project_id, version_name)
);

-- RLS dla travel_plans
alter table travel_plans enable row level security;

create policy "Użytkownicy mogą wyświetlać plany ze swoich projektów"
  on travel_plans for select
  to authenticated
  using (project_id in (
    select id from travel_projects where user_id = auth.uid()
  ));

create policy "Użytkownicy mogą tworzyć plany w swoich projektach"
  on travel_plans for insert
  to authenticated
  with check (project_id in (
    select id from travel_projects where user_id = auth.uid()
  ));

create policy "Użytkownicy mogą aktualizować plany w swoich projektach"
  on travel_plans for update
  to authenticated
  using (project_id in (
    select id from travel_projects where user_id = auth.uid()
  ));

create policy "Użytkownicy mogą usuwać plany ze swoich projektów"
  on travel_plans for delete
  to authenticated
  using (project_id in (
    select id from travel_projects where user_id = auth.uid()
  ));

-- Odmowa dostępu dla anon (nieuwierzytelnionych)
create policy "Anonimowi użytkownicy nie mają dostępu do planów"
  on travel_plans for all
  to anon
  using (false);

-- Indeksy
create index idx_notes_project_position on notes(project_id, position);
create index idx_notes_priority on notes(project_id, priority);
create index idx_notes_content_fts on notes using gin (to_tsvector('simple', content));
create index idx_note_tags_note_id on note_tags(note_id);
create index idx_projects_user on travel_projects(user_id);
create index idx_plans_project on travel_plans(project_id);
create index idx_plans_content_jsonb on travel_plans using gin (content jsonb_path_ops);

-- Trigger do oznaczania planów jako nieaktualnych - poprawiony, by obsługiwał DELETE
create or replace function mark_plans_outdated() returns trigger as $$
declare
  proj_id uuid;
begin
  -- Określamy project_id w zależności od operacji
  if (tg_op = 'DELETE') then
    proj_id := old.project_id;
  else
    proj_id := new.project_id;
  end if;

  -- Aktualizacja planów
  update travel_plans
    set is_outdated = true, updated_at = now()
    where project_id = proj_id;
    
  -- Aktualizacja projektu
  update travel_projects
    set last_notes_update_at = now()
    where id = proj_id;
    
  if (tg_op = 'DELETE') then
    return old;
  else
    return new;
  end if;
end;
$$ language plpgsql;

create trigger notes_update_trigger
  after insert or update or delete on notes
  for each row execute function mark_plans_outdated(); 