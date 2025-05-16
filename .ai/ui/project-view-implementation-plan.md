# Plan implementacji widoku Projektu

## 1. Przegląd

Widok Projektu to główne miejsce pracy nad jednym projektem podróży. Umożliwia przegląd i organizację notatek (drag-and-drop), edycję notatek (drawer), podgląd szczegółów, a także generowanie i listowanie planów podróży.

## 2. Routing widoku

Ścieżka: `/app/projects/:projectId` (chroniona). SSR z paramem dynamicznym; revalidation 15 s.

## 3. Struktura komponentów

```
<AppShell>
  ├── <ProjectSidebar>   // lista projektów (reuse)
  └── <ProjectPage>
        ├── <NoteBoard>
        │     ├── <NoteCard> x N (Draggable)
        │     └── <ConfigNoteCard> (wyróżniona)
        ├── <NoteDetailDrawer> (po prawej)
        ├── <GeneratePlanButton>
        ├── <PlanList>
        │     └── <PlanListItem> x N
        └── <GeneratePlanModal />  (portal)
```

## 4. Szczegóły komponentów

### NoteBoard

- Opis: responsywna siatka drag-and-drop notatek.
- Elementy: `<section class="grid">`, react-beautiful-dnd lub dnd-kit.
- Interakcje:
  - drag end → POST `/notes/reorder` z nową pozycją.
  - klik karta → open `NoteDetailDrawer`.
- Walidacja: limit 100 notatek na projekt.
- Typy: `NoteListItemDTO`.
- Propsy: `{ notes: NoteListItemDTO[] }`.

### NoteCard

- Opis: Prezentacja notatki; ikony tagów, priorytetu.
- Interakcje: klik → open drawer; menu edit/delete.
- Walidacja: brak.

### NoteDetailDrawer

- Opis: Prawy panel z odczytem notatki + akcje edit/delete.
- Elementy: `<Drawer>`, markdown viewer, przyciski.
- Interakcje: `Edit` → open `NoteEditorModal`; `Delete` → potwierdzenie.
- Typy: `NoteDetailDTO`.

### PlanList

- Opis: Lista wygenerowanych planów (wersje) dla projektu.
- Elementy: `<ul>` `<PlanListItem>`
- Interakcje: klik item → navigate `/app/projects/:projectId/plans/:planId`;
  menu compare (select 2). If two selected → navigate compare url.
- Typy: `TravelPlanListItemDTO[]`.

### GeneratePlanButton

- Opis: CTA widoczne tylko jeśli istnieje nota konfiguracyjna.
- Elementy: `<Button>` sticky bottom.
- Interakcje: klik → open GeneratePlanModal.
- Walidacja: disabled jeśli brak config note.

### GeneratePlanModal

- Patrz osobny plan.

## 5. Typy

```ts
import type { NoteListItemDTO, NoteDetailDTO, TravelPlanListItemDTO, ReorderNotesDTO } from "@/types";

interface DragEndEvent {
  activeId: string;
  overId: string;
}
```

## 6. Zarządzanie stanem

- React Query:
  - `useNotes(projectId)` GET `/projects/{id}/notes`.
  - `useReorderNotes()` POST reorder.
  - `usePlans(projectId)` GET `/projects/{id}/plans`.
- DND lokalny stan pozycji do czasu success (optimistic update).
- Drawer open state + selectedNoteId w `useProjectUI` hook.

## 7. Integracja API

| Akcja       | Endpoint                        | Metoda | Req               | Res                                   |
| ----------- | ------------------------------- | ------ | ----------------- | ------------------------------------- |
| list notes  | `/projects/{id}/notes`          | GET    | ---               | `ListResponse<NoteListItemDTO>`       |
| reorder     | `/projects/{id}/notes/reorder`  | POST   | `ReorderNotesDTO` | `SuccessResponse`                     |
| delete note | `/projects/{id}/notes/{noteId}` | DELETE | ---               | ---                                   |
| list plans  | `/projects/{id}/plans`          | GET    | ---               | `ListResponse<TravelPlanListItemDTO>` |

## 8. Interakcje użytkownika

- Drag note → update kolejności.
- Klik note → drawer.
- Edytuj → NoteEditorModal.
- Klik "Generuj plan" → modal.
- Klik plan na liście → widok planu.
- Checkboxy planów x2 → przycisk "Porównaj".

## 9. Warunki i walidacja

- Generuj plan disabled gdy `has_config_note === false`.
- Reorder: liczba pozycji = notes.length; pozycje unikalne.

## 10. Obsługa błędów

- Reorder fail → rollback optimistic i toast.
- 404 project → redirect `/404`.
- 401 → redirect `/`.

## 11. Kroki implementacji

1. Stwórz stronę `src/pages/app/projects/[projectId]/index.astro`.
2. Zaimplementuj hooki React Query (`useNotes`, `usePlans`, `useReorderNotes`).
3. Zbuduj `NoteBoard` z dnd-kit (SortableContext, arrayMove).
4. Dodaj `NoteDetailDrawer`.
5. Dodaj `PlanList` + selection compare logic.
6. Dodaj `GeneratePlanButton`.
7. Zintegruj z `GeneratePlanModal` (portal global).
8. Testy: drag reorder (integration), disabled button.
