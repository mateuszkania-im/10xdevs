-- Migracja naprawiająca istniejące plany oznaczone jako nieaktualne
-- Ta migracja aktualizuje wszystkie plany, które mogły zostać nieprawidłowo oznaczone jako nieaktualne
-- przez poprzednią implementację triggera

-- Ustawienie is_outdated = false dla wszystkich planów
update travel_plans
set is_outdated = false, updated_at = now()
where is_outdated = true; 