# Plan implementacji widoku porównania planów

## 1. Przegląd

Widok porównania planów umożliwia równoległe zestawienie dwóch wersji planu podróży wygenerowanych przez AI. Umożliwia identyfikację różnic między planami, ułatwiając wybór lepszej wersji. Kluczowe funkcje to wyróżnianie różnic i możliwość zmiany porównywanych planów.

## 2. Routing widoku

Ścieżka: `/app/projects/:projectId/plans/compare?plan1=:planId1&plan2=:planId2` (chroniona, parametry query).
SSR z query params; revalidation 60 s.

## 3. Struktura komponentów

```
<AppShell>
  ├── <ProjectSidebar>   // lista projektów (reuse)
  └── <PlanCompareView>
        ├── <CompareHeader>
        │     ├── <PlanSelectDropdown> (plan1)
        │     ├── <PlanSelectDropdown> (plan2)
        │     └── <CompareActions> (dropdown: eksport, powrót)
        ├── <PlanCompareGrid>
        │     ├── <PlanColumn> (plan1)
        │     │     └── <DaySection> x N
        │     │           └── <ActivityItem> x M
        │     └── <PlanColumn> (plan2)
        │           └── <DaySection> x N
        │                 └── <ActivityItem> x M
        └── <Toast />
```

## 4. Szczegóły komponentów

### CompareHeader

- Opis: Nagłówek z kontrolkami wyboru planów.
- Elementy: `<header>`, dwa `<PlanSelectDropdown>`, przyciski akcji.
- Interakcje:
  - Zmiana planu → update URL → refetch.
  - Akcje: powrót do projektu, eksport porównania (opcjonalnie).
- Walidacja: Wybrane plany muszą istnieć i być różne.
- Typy: `{ plan1, plan2 }`.
- Propsy: `{ plans: TravelPlanListItemDTO[]; selected: { plan1Id, plan2Id }; onSelectChange() }`.

### PlanSelectDropdown

- Opis: Dropdown do wyboru planu do porównania.
- Elementy: shadcn/ui `Select`.
- Interakcje: zmiana selekcji → update URL query params.
- Propsy: `{ plans: TravelPlanListItemDTO[]; value: string; onChange() }`.

### PlanCompareGrid

- Opis: Grid dwukolumnowy porównujący plany dzień po dniu.
- Elementy: `<div class="grid grid-cols-2">`, `<PlanColumn>` x 2.
- Typy: `PlanComparisonDTO`.
- Propsy: `{ comparison: PlanComparisonDTO }`.

### PlanColumn

- Opis: Kolumna prezentująca jeden plan.
- Elementy: `<div>`, `<h2>` (nazwa planu), lista `<DaySection>`.
- Propsy: `{ plan: TravelPlanDetailDTO }`.

### DaySection

- Opis: Sekcja dnia z aktywnościami i wyróżnionymi różnicami.
- Elementy: `<section>`, nagłówek dnia, lista `<ActivityItem>`.
- Interakcje: brak.
- Typy: `PlanDay`.
- Propsy: `{ day: PlanDay; differences?: boolean[] }`.

### DifferenceHighlighter

- Opis: Komponent wyróżniający różnice między planami.
- Elementy: `<div>` z styling highlight.
- Propsy: `{ children: ReactNode; isHighlighted: boolean }`.

## 5. Typy

```ts
import type { TravelPlanListItemDTO, TravelPlanDetailDTO, PlanDay, PlanActivity, PlanComparisonDTO } from "@/types";

interface QueryParams {
  plan1: string;
  plan2: string;
}
```

## 6. Zarządzanie stanem

- React Query:
  - `usePlans(projectId)` → GET `/projects/{id}/plans`.
  - `useCompare(projectId, plan1Id, plan2Id)` → GET `/projects/{id}/plans/compare?plan1_id=&plan2_id=`.
- URL state: query params `plan1` i `plan2`.

## 7. Integracja API

| Akcja         | Endpoint                       | Metoda | Req          | Res                                   |
| ------------- | ------------------------------ | ------ | ------------ | ------------------------------------- |
| list plans    | `/projects/{id}/plans`         | GET    | ---          | `ListResponse<TravelPlanListItemDTO>` |
| compare plans | `/projects/{id}/plans/compare` | GET    | query params | `PlanComparisonDTO`                   |

## 8. Interakcje użytkownika

- Zmiana wybranego planu w dropdown → update URL → refetch porównania.
- Scrollowanie synchroniczne obu kolumn.
- Klik "Powrót" → navigate do projektu.

## 9. Warunki i walidacja

- Plan1Id !== plan2Id (frontend validation).
- Oba plany muszą istnieć (404 check).
- Oba plany muszą należeć do projektu (server-side check).

## 10. Obsługa błędów

- 404 plany → redirect `/404`.
- Invalid params → toast + reset to first two plans.
- Empty plans list → redirect to project.

## 11. Kroki implementacji

1. Stwórz stronę `src/pages/app/projects/[projectId]/plans/compare.astro`.
2. Zaimplementuj React Query hook `useComparePlans`.
3. Zbuduj grid porównania z kolumnami.
4. Dodaj komponenty nagłówka z dropdownami.
5. Zaimplementuj highlight różnic (`DifferenceHighlighter`).
6. Obsłuż synchroniczne scrollowanie (utility hook `useSyncScroll`).
7. Implementuj URL synchronizację (useSearchParams).
8. Dodaj walidację wyboru planów.
