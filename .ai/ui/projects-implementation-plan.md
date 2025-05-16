# API Endpoint Implementation Plan: Travel Projects Endpoints

## 1. Przegląd punktów końcowych

Punkty końcowe zarządzają zasobami `travel_projects`.

| Endpoint                | Metoda | Cel                         |
| ----------------------- | ------ | --------------------------- |
| `/projects`             | GET    | Lista projektów użytkownika |
| `/projects/{projectId}` | GET    | Szczegóły projektu          |
| `/projects`             | POST   | Utworzenie projektu         |
| `/projects/{projectId}` | PATCH  | Aktualizacja projektu       |
| `/projects/{projectId}` | DELETE | Usunięcie projektu          |

## 2. Szczegóły żądania

### a) GET /projects (Lista projektów)

- Parametry query
  - `sort_by` _(opc.)_: `created_at | updated_at | name` _(domyślnie `updated_at`)_
  - `order` _(opc.)_: `asc | desc` _(domyślnie `desc`)_
  - `page` _(opc.)_: `int` _(domyślnie 1)_
  - `limit` _(opc.)_: `int` _(domyślnie 20, max 50)_
- Nagłówki: `Authorization: Bearer <JWT>`

### b) GET /projects/{projectId}

- Path param: `projectId` (uuid)
- Nagłówki: `Authorization`

### c) POST /projects

- Body: `CreateProjectDTO`

```json
{
  "name": "string (3-100 znaków)"
}
```

- Nagłówki: `Authorization`, `Content-Type: application/json`
- Walidacja: unikalna nazwa per użytkownik, max 50 projektów

### d) PATCH /projects/{projectId}

- Body: jw.
- Walidacja: unikalna nazwa per użytkownik

### e) DELETE /projects/{projectId}

- Path param: `projectId` (uuid)
- Nagłówki: `Authorization`
- Walidacja: sprawdzenie czy istnieje i należy do użytkownika

## 3. Wykorzystywane typy

```typescript
// Entity
interface Project {
  id: string;
  user_id: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

// DTO
interface ProjectListItemDTO {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

interface ProjectDetailDTO {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  has_config_note: boolean;
  note_count: number;
  plan_count: number;
}

interface CreateProjectDTO {
  name: string;
}

interface UpdateProjectDTO {
  name: string;
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

| Endpoint                     | 200                                     | 201                | 204 | 400 | 401 | 404 | 409 |
| ---------------------------- | --------------------------------------- | ------------------ | --- | --- | --- | --- | --- |
| GET /projects                | `PaginatedResponse<ProjectListItemDTO>` | —                  | —   | ✔︎ | ✔︎ | —   | —   |
| GET /projects/{projectId}    | `ProjectDetailDTO`                      | —                  | —   | —   | ✔︎ | ✔︎ | —   |
| POST /projects               | —                                       | `ProjectDetailDTO` | —   | ✔︎ | ✔︎ | —   | ✔︎ |
| PATCH /projects/{projectId}  | `ProjectDetailDTO`                      | —                  | —   | ✔︎ | ✔︎ | ✔︎ | ✔︎ |
| DELETE /projects/{projectId} | —                                       | —                  | ✔︎ | —   | ✔︎ | ✔︎ | —   |

## 5. Przepływ danych

1. **Middleware** pobiera `supabase` z `context.locals` oraz weryfikuje JWT.
2. **Kontroler Astro** waliduje parametry zapytania przy pomocy `zod`.
3. Kontroler wywołuje `ProjectService`:
   - `list({ userId, pagination, sort })`
   - `getById({ userId, projectId })`
   - `create({ userId, dto })`
   - `update({ userId, projectId, dto })`
   - `remove({ userId, projectId })`
4. `ProjectService` używa Supabase klienta do operacji; RLS zapewnia bezpieczeństwo.
5. Wynik DTO jest konwertowany do JSON i zwracany.

## 6. Względy bezpieczeństwa

- JWT wymagany ➜ brak tokena ⟶ 401.
- RLS w bazie zapewnia dostęp tylko do projektów właściciela.
- Walidacja `name` długość/unikalność per użytkownik (max 50 aktywnych projektów).
- Ochrona przed SQLi zapewniona przez Supabase query builder.

## 7. Obsługa błędów

- **400**: zod error, `limit >50`, `sort_by` nieobsługiwany.
- **401**: brak/nieprawidłowy JWT.
- **404**: projekt nie należy do użytkownika lub nie istnieje.
- **409**: konflikt nazwy projektu (nazwa już istnieje dla tego użytkownika).
- **500**: nieoczekiwany błąd — log do `console.error` oraz (TODO) `error_logs` table.

## 8. Rozważania dotyczące wydajności

- Indeks `idx_projects_user_id` + `idx_projects_user_id_name` (dla unikalności).
- Paginacja zapobiega pobieraniu całości danych.
- Limit 50 projektów per użytkownik.

## 9. Etapy wdrożenia

1. Utworzenie plików `src/pages/api/projects/*.ts` (GET list / POST create).
2. Utworzenie plików `src/pages/api/projects/[projectId].ts` (GET, PATCH, DELETE).
3. Dodanie `ProjectService` w `src/lib/services/project.service.ts`.
4. Definicje schematów zod w `src/lib/validation/project.schema.ts`.
5. Implementacja walidacji + mapowanie do DTO.
6. Middleware auth ⟶ `src/middleware/index.ts`.
7. Testy unitowe i integracyjne (Vitest).
