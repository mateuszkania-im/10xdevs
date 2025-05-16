# Plan implementacji widoku Dashboard / Lista projektów

## 1. Przegląd

Dashboard to chroniona strona aplikacyjna prezentująca listę projektów podróży użytkownika. Umożliwia tworzenie, filtrowanie, sortowanie i kasowanie projektów. Głównym celem jest szybki dostęp do projektów oraz płynne przejście do widoku projektu.

## 2. Routing widoku

Ścieżka: `/app/projects` (chroniona przez middleware auth). SSR; revalidation 30 s.

## 3. Struktura komponentów

```
<AppShell>
  ├── <SideNav> (lista projektów)
  └── <DashboardProjectsPage>
        ├── <ProjectFilters>
        ├── <ProjectGrid>
        │     └── <ProjectCard> x N
        ├── <EmptyState> (gdy brak projektów)
        ├── <NewProjectButton>
        │     └── <NewProjectModal />
        └── <Toast />
```

## 4. Szczegóły komponentów

### ProjectFilters

- Opis: paski wyszukiwania, sortowania i filtrów.
- Elementy: `<input type="search">`, `<Select>` sort_by, `<Select>` order.
- Interakcje: zmiana wartości → aktualizacja paramów URL i refetch.
- Walidacja: sort_by ∈ {created_at, updated_at, name}; order ∈ {asc, desc}.
- Typy: `ProjectFilterState { search?: string; sortBy?: 'created_at'|'updated_at'|'name'; order?: 'asc'|'desc' }`.
- Propsy: `{ value: ProjectFilterState; onChange(value) }`.

### ProjectCard

- Opis: Prezentuje pojedynczy projekt (nazwa, daty, badge config).
- Elementy: `<article>`, `<h3>`, meta `<p>`, badge.
- Interakcje: klik → `navigate('/app/projects/{id}')`; menu (edit/delete).
- Walidacja: brak.
- Typy: `ProjectListItemDTO`.
- Propsy: `{ project: ProjectListItemDTO; onEdit(id); onDelete(id) }`.

### ProjectGrid

- Opis: responsywna siatka ProjectCard.
- Elementy: `<section class="grid">`.
- Interakcje: brak.
- Walidacja: brak.
- Typy: `ProjectListItemDTO[]`.
- Propsy: `{ projects: ProjectListItemDTO[] }`.

### NewProjectButton

- Opis: Floating Action Button otwierający modal.
- Elementy: `<Button icon="plus">`.
- Interakcje: klik → open modal.
- Walidacja: brak.
- Typy: brak.
- Propsy: none.

### NewProjectModal

- Opis: Modal formularza tworzenia projektu.
- Elementy: `<Dialog>`, `<Form>` -> Input name.
- Interakcje: submit → POST /projects → toast.
- Walidacja: nazwa 3-100 znaków.
- Typy: `CreateProjectDTO`, `CreateProjectVM { name: string }`.
- Propsy: `{ isOpen: boolean; onClose(); }`.

### EmptyState

- Opis: Widok pustej listy.
- Elementy: ilustracja + CTA tworzenia projektu.
- Interakcje: klik CTA → open modal.

## 5. Typy

```ts
import type { ProjectListItemDTO, CreateProjectDTO } from "@/types";

interface ProjectFilterState {
  search?: string;
  sortBy?: "created_at" | "updated_at" | "name";
  order?: "asc" | "desc";
}

interface CreateProjectVM {
  name: string; // 3-100 znaków
}
```

## 6. Zarządzanie stanem

- React Query:
  - `useProjects(query): { data, isLoading }` → fetch GET `/projects` z paramami.
  - `useCreateProject()` → POST `/projects` i `queryClient.invalidate('projects')`.
- Lokalny state filtrów w URLSearchParams (hook `useProjectFilters`).
- Modal open state w `useDisclosure`.

## 7. Integracja API

| Akcja          | Endpoint         | Metoda | DTO Req            | DTO Res                                 |
| -------------- | ---------------- | ------ | ------------------ | --------------------------------------- |
| list projects  | `/projects`      | GET    | ---                | `PaginatedResponse<ProjectListItemDTO>` |
| create project | `/projects`      | POST   | `CreateProjectDTO` | `ProjectDetailDTO`                      |
| update project | `/projects/{id}` | PATCH  | `UpdateProjectDTO` | dto                                     |
| delete project | `/projects/{id}` | DELETE | ---                | ---                                     |

## 8. Interakcje użytkownika

- Wpisanie w search → debounce 300 ms → aktualizacja listy.
- Zmiana sortowania → odświeżenie listy.
- Klik + → modal → walidacja → sukces → karta pojawia się z animacją.
- Klik karta → przejście do widoku projektu.
- Menu karta → "Edytuj" otwiera prompt rename; "Usuń" → potwierdzenie → DELETE.

## 9. Warunki i walidacja

- Nazwa projektu 3-100 znaków; unikać duplikatów (sprawdzane serwerowo 409 Conf).
- Limit 50 projektów (jeśli GET zwraca `total >= 50`, disable przycisk + i toast).

## 10. Obsługa błędów

- 401 → redirect do `/` + toast "Sesja wygasła".
- 409 przy tworzeniu → error toast "Projekt o tej nazwie już istnieje".
- Network error → retry React Query + toast.

## 11. Kroki implementacji

1. Utwórz stronę `src/pages/app/projects/index.astro` z `AppShell` i `DashboardProjectsPage` (React island).
2. Zaimplementuj hook `useProjectFilters` (sync z URL).
3. Utwórz React Query hooki `useProjects`, `useCreateProject`, `useUpdateProject`, `useDeleteProject` w `src/lib/queries/projects.ts`.
4. Zbuduj komponenty: `ProjectFilters.tsx`, `ProjectGrid.tsx`, `ProjectCard.tsx` (shadcn Card), `NewProjectButton.tsx`, `NewProjectModal.tsx`.
5. Dodaj walidację zod dla formularza.
6. Dodaj optimistic update przy delete (cache remove).
7. Pokryj testami (unit: walidacja; integration: create flow).
8. Sprawdź RWD (grid cols: 1-sm, 2-md, 3-lg, 4-xl).
