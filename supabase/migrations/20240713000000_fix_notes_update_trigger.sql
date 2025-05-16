-- Migracja naprawiająca trigger notes_update_trigger
-- Problem: Aktualnie trigger oznacza wszystkie plany jako nieaktualne po dodaniu nowej notatki
-- Rozwiązanie: Modyfikacja funkcji tak, aby trigger nie reagował na dodawanie notatek (INSERT)

-- Drop istniejącego triggera
drop trigger if exists notes_update_trigger on notes;

-- Aktualizacja funkcji mark_plans_outdated, aby obsługiwała tylko UPDATE i DELETE
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

-- Utworzenie nowego triggera tylko dla operacji UPDATE i DELETE
create trigger notes_update_trigger
  after update or delete on notes
  for each row execute function mark_plans_outdated();

-- Utworzenie dodatkowego triggera dla INSERT, który tylko aktualizuje last_notes_update_at
create or replace function update_project_timestamp() returns trigger as $$
begin
  -- Aktualizacja tylko timestampa projektu bez oznaczania planów jako nieaktualne
  update travel_projects
    set last_notes_update_at = now()
    where id = new.project_id;
    
  return new;
end;
$$ language plpgsql;

create trigger notes_insert_trigger
  after insert on notes
  for each row execute function update_project_timestamp(); 