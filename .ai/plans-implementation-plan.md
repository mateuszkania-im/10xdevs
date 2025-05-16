# API Endpoint Implementation Plan: Travel Plans Endpoints

## 1. Przegląd punktów końcowych

Punkty końcowe zarządzają zasobami `travel_plans`.

| Endpoint                                      | Metoda | Cel                 |
| --------------------------------------------- | ------ | ------------------- |
| `/projects/{projectId}/plans`                 | GET    | Lista planów        |
| `/projects/{projectId}/plans/{planId}`        | GET    | Pobranie planu      |
| `/projects/{projectId}/plans/generate`        | POST   | Wygenerowanie planu |
| `/projects/{projectId}/plans/{planId}`        | PATCH  | Aktualizacja planu  |
| `/projects/{projectId}/plans/{planId}`        | DELETE | Usunięcie planu     |
| `/projects/{projectId}/plans/{planId}/export` | GET    | Eksport do PDF      |
| `/projects/{projectId}/plans/compare`         | GET    | Porównanie planów   |

## 2. Szczegóły żądania

### a) GET /projects/{projectId}/plans

- Path param: `projectId` (uuid)
- Query params:
  - `include_outdated` _(opc.)_: `boolean` (domyślnie false)
  - `sort_by` _(opc.)_: `created_at|updated_at|version_name` (domyślnie `created_at`)
  - `order` _(opc.)_: `asc|desc` (domyślnie `desc`)
  - `page` _(opc.)_: `int` (domyślnie 1)
  - `limit` _(opc.)_: `int` (domyślnie 20, max 50)
- Nagłówki: `Authorization`

### b) GET /projects/{projectId}/plans/{planId}

- Path params: `projectId`, `planId` (uuid)
- Nagłówki: `Authorization`

### c) POST /projects/{projectId}/plans/generate

- Body: `GeneratePlanDTO`

```json
{ "version_name": "string (1-50 znaków)" }
```

- Walidacja: projekt musi mieć notatkę konfiguracyjną, unikalna `version_name` w projekcie, max 20 planów per projekt

### d) PATCH /projects/{projectId}/plans/{planId}

- Body: `UpdatePlanDTO` (pola opcjonalne)

```json
{
  "version_name": "string (1-50 znaków)",
  "content": {
    /* Struktura PlanContent */
  }
}
```

- Walidacja: unikalna `version_name`, poprawna struktura `content`

### e) DELETE /projects/{projectId}/plans/{planId}

- Walidacja: plan musi należeć do projektu użytkownika

### f) GET /projects/{projectId}/plans/{planId}/export

- Query params: `format` _(opc.)_ ⇒ `pdf` (domyślnie)
- Odpowiedź: `application/pdf` (binary)
- Wykorzystuje bibliotekę: pdf-lib v1.17.1

### g) GET /projects/{projectId}/plans/compare

- Query params:
  - `plan1_id` _(uuid, wymagany)_
  - `plan2_id` _(uuid, wymagany)_
- Walidacja: oba plany muszą należeć do projektu

## 3. Wykorzystywane typy

```typescript
// Entity
interface TravelPlan {
  id: string;
  project_id: string;
  version_name: string;
  content: PlanContent;
  is_outdated: boolean;
  created_at: Date;
  updated_at: Date;
}

interface PlanContent {
  days: PlanDay[];
  summary: string;
  recommendations: string[];
}

interface PlanDay {
  day_number: number;
  activities: PlanActivity[];
}

interface PlanActivity {
  id: string;
  time: string;
  title: string;
  description: string;
  location?: string;
  duration?: number;
}

// DTOs
interface TravelPlanListItemDTO {
  id: string;
  version_name: string;
  is_outdated: boolean;
  created_at: string;
  updated_at: string;
}

interface TravelPlanDetailDTO {
  id: string;
  version_name: string;
  content: PlanContent;
  is_outdated: boolean;
  created_at: string;
  updated_at: string;
}

interface GeneratePlanDTO {
  version_name: string;
}

interface UpdatePlanDTO {
  version_name?: string;
  content?: PlanContent;
}

interface PlanComparisonDTO {
  plan1: TravelPlanDetailDTO;
  plan2: TravelPlanDetailDTO;
  differences: PlanDifference[];
}

interface PlanDifference {
  type: "added" | "removed" | "modified";
  path: string;
  value1?: any;
  value2?: any;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}
```

## 4. Szczegóły odpowiedzi

| Endpoint      | 200                                        | 201                   | 204 | 400 | 401 | 404 | 409 |
| ------------- | ------------------------------------------ | --------------------- | --- | --- | --- | --- | --- |
| GET list      | `PaginatedResponse<TravelPlanListItemDTO>` | —                     | —   | ✔︎ | ✔︎ | ✔︎ | —   |
| GET plan      | `TravelPlanDetailDTO`                      | —                     | —   | —   | ✔︎ | ✔︎ | —   |
| POST generate | —                                          | `TravelPlanDetailDTO` | —   | ✔︎ | ✔︎ | ✔︎ | ✔︎ |
| PATCH plan    | `TravelPlanDetailDTO`                      | —                     | —   | ✔︎ | ✔︎ | ✔︎ | ✔︎ |
| DELETE plan   | —                                          | —                     | ✔︎ | —   | ✔︎ | ✔︎ | —   |
| GET export    | binary/pdf                                 | —                     | —   | ✔︎ | ✔︎ | ✔︎ | —   |
| GET compare   | `PlanComparisonDTO`                        | —                     | —   | ✔︎ | ✔︎ | ✔︎ | —   |

## 5. Przepływ danych

1. **Middleware** autoryzuje JWT i wystawia `supabase`.
2. Kontrolery w odpowiednich plikach `src/pages/api/...`
3. Walidacja `zod` ➜ przekazanie do `PlanService`.
4. `PlanService` implementuje wszystkie metody:
   - `generate` ➜ transakcja: pobiera notatki, buduje plan
   - `exportPdf` ➜ wykorzystuje bibliotekę `pdf-lib` v1.17.1
   - `compare` ➜ algorytm porównujący struktury JSON
5. Rezultaty mapowane do DTO.

## 6. Względy bezpieczeństwa

- JWT + RLS chronią dane.
- Sprawdzanie czy plany należą do projektu użytkownika.
- Walidacja limitów (max 20 planów per projekt).

## 7. Obsługa błędów

- **400**: zod validation, niepoprawny JSON planu.
- **401**: nieautoryzowany.
- **404**: projekt lub plan nie znaleziony.
- **409**: konflikt `version_name`.
- **500**: problem generowania PDF lub inny.

## 8. Rozważania dotyczące wydajności

- Indeksy na `project_id`, `is_outdated`.
- Paginacja ogranicza rozmiar odpowiedzi.
- Cache dla wygenerowanych PDF-ów.

## 9. Etapy wdrożenia

1. Stworzenie `PlanService` `src/lib/services/plan.service.ts`.
2. Schematy Zod: `plan.schema.ts`.
3. Instalacja i konfiguracja `pdf-lib` v1.17.1.
4. Implementacja endpointów API.
5. Testy (Vitest).
