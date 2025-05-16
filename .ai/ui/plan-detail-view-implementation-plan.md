# Plan implementacji widoku planu podróży

## 1. Przegląd

Widok planu podróży prezentuje szczegółowy plan wygenerowany przez AI, podzielony na dni i aktywności. Umożliwia przeglądanie, edycję i eksport planu do PDF. Prezentuje również status planu (czy jest aktualny) i umożliwia nawigację do innych wersji planu.

## 2. Routing widoku

Ścieżka: `/app/projects/:projectId/plans/:planId` (chroniona). SSR z dynamic params; revalidation 60 s.

## 3. Struktura komponentów

```
<AppShell>
  ├── <ProjectSidebar>   // lista projektów (reuse)
  └── <PlanDetailPage>
        ├── <PlanHeader>
        │     ├── <PlanTitle> (edytowalny inline)
        │     ├── <OutdatedBadge> (warunkowy)
        │     └── <PlanActions> (dropdown: eksport, usuń)
        ├── <DayAccordion>
        │     └── <ActivityItem> x N (per dzień)
        ├── <ExportPDFButton>
        └── <Toast />
```

## 4. Szczegóły komponentów

### PlanHeader

- Opis: Nagłówek planu z tytułem, statusem i akcjami.
- Elementy: `<header>`, `<h1>` (edytowalny), badge, dropdown.
- Interakcje:
  - Edycja tytułu inline (double-click) → PATCH.
  - Dropdown akcji: eksport, usuń.
- Walidacja: Tytuł 1-50 znaków.
- Typy: `TravelPlanDetailDTO`.
- Propsy: `{ plan: TravelPlanDetailDTO; onUpdate(); onDelete(); onExport(); }`.

### OutdatedBadge

- Opis: Oznaczenie planu jako nieaktualnego (notatki zmienione po wygenerowaniu).
- Elementy: shadcn/ui `Badge` z ikoną.
- Interakcje: hover tooltip z wyjaśnieniem.
- Propsy: `{ isOutdated: boolean }`.

### DayAccordion

- Opis: Lista akordeonów z dniami podróży.
- Elementy: shadcn/ui `Accordion`, nagłówki z datami, zawartość z aktywnościami.
- Interakcje: Rozwijanie/zwijanie dni.
- Walidacja: brak.
- Typy: `PlanDay[]`.
- Propsy: `{ days: PlanDay[] }`.

### ActivityItem

- Opis: Element aktywności w ramach dnia (np. zwiedzanie, posiłek).
- Elementy: `<div>`, czas, nazwa, opis, ikona typu.
- Interakcje: Edycja inline (opcjonalnie).
- Typy: `PlanActivity`.
- Propsy: `{ activity: PlanActivity; onUpdate?(); }`.

### ExportPDFButton

- Opis: Przycisk eksportu do PDF.
- Elementy: `<Button>` + ikona.
- Interakcje: klik → GET `/projects/{id}/plans/{planId}/export?format=pdf`.
- Propsy: `{ projectId: string; planId: string }`.

## 5. Typy

```ts
import type { TravelPlanDetailDTO, PlanDay, PlanActivity, UpdatePlanDTO } from "@/types";

interface PlanTitleUpdateVM {
  version_name: string;
}
```

## 6. Zarządzanie stanem

- React Query:
  - `usePlan(projectId, planId)` → GET `/projects/{id}/plans/{planId}`.
  - `useUpdatePlan()` → PATCH plan.
  - `useDeletePlan()` → DELETE plan.
- Lokalny stan:
  - Accordion expand/collapse.
  - Edycja inline tytułu.

## 7. Integracja API

| Akcja       | Endpoint                               | Metoda | Req               | Res                   |
| ----------- | -------------------------------------- | ------ | ----------------- | --------------------- |
| get plan    | `/projects/{id}/plans/{planId}`        | GET    | ---               | `TravelPlanDetailDTO` |
| update plan | `/projects/{id}/plans/{planId}`        | PATCH  | `UpdatePlanDTO`   | dto                   |
| delete plan | `/projects/{id}/plans/{planId}`        | DELETE | ---               | ---                   |
| export PDF  | `/projects/{id}/plans/{planId}/export` | GET    | query: format=pdf | binary PDF            |

## 8. Interakcje użytkownika

- Expand/collapse dni w akordeonie.
- Edycja tytułu planu inline (double-click).
- Eksport do PDF → pobieranie pliku.
- Usunięcie planu → confirm dialog → DELETE → redirect do projektu.

## 9. Warunki i walidacja

- Tytuł planu 1-50 znaków.
- Plan oznaczony jako nieaktualny gdy `is_outdated === true`.
- Edycja content (activities) opcjonalna w MVP.

## 10. Obsługa błędów

- 404 plan → redirect `/404`.
- PDF export fail → error toast.
- Update fail → rollback optimistic + toast.

## 11. Kroki implementacji

1. Stwórz stronę `src/pages/app/projects/[projectId]/plans/[planId]/index.astro`.
2. Zaimplementuj React Query hooki dla planu.
3. Zbuduj komponent `PlanHeader` z edycją inline.
4. Dodaj `DayAccordion` z `ActivityItem`.
5. Zaimplementuj eksport PDF przez fetch + blob.
6. Obsłuż usuwanie planu.
7. Dodaj UX szczegóły: print-friendly styles, ikony typów aktywności.
8. Dodaj badge nieaktualności + tooltip.
