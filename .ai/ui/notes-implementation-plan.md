# API Endpoint Implementation Plan: Notes Endpoints

## 1. Przegląd punktów końcowych

Punkty końcowe zarządzają zasobami `notes` oraz notatką konfiguracyjną.

| Endpoint                               | Metoda | Cel                          |
| -------------------------------------- | ------ | ---------------------------- |
| `/projects/{projectId}/notes`          | GET    | Lista notatek                |
| `/projects/{projectId}/notes/{noteId}` | GET    | Pobranie notatki             |
| `/projects/{projectId}/notes`          | POST   | Utworzenie notatki           |
| `/projects/{projectId}/config-note`    | POST   | Utworzenie notatki konfig.   |
| `/projects/{projectId}/notes/{noteId}` | PATCH  | Aktualizacja notatki         |
| `/projects/{projectId}/config-note`    | PATCH  | Aktualizacja notatki konfig. |
| `/projects/{projectId}/notes/{noteId}` | DELETE | Usunięcie notatki            |
| `/projects/{projectId}/notes/reorder`  | POST   | Zmiana pozycji notatek       |

## 2. Szczegóły żądania

### a) GET /projects/{projectId}/notes

- Path param: `projectId` (uuid)
- Query params:
  - `sort_by` _(opc.)_: `position|priority|created_at|updated_at|title` (domyślnie `position`)
  - `order` _(opc.)_: `asc|desc` (domyślnie `asc` dla `position`, `desc` dla innych)
  - `page` _(opc.)_: `int` (domyślnie 1)
  - `limit` _(opc.)_: `int` (domyślnie 20, max 50)
  - `tag` _(opc.)_: `string` (filtr tagu)
  - `search` _(opc.)_: `string` (pełnotekstowo)
- Nagłówki: `Authorization`

### b) GET /projects/{projectId}/notes/{noteId}

- Path params: `projectId`, `noteId` (uuid)
- Nagłówki: `Authorization`

### c) POST /projects/{projectId}/notes

- Body: `CreateNoteDTO`

```json
{
  "title": "string (3-200 znaków)",
  "content": "string | null",
  "priority": 0,
  "tags": ["string (max 30 znaków, max 20 tagów)"]
}
```

- Walidacja: max 100 notatek per projekt, max 20 tagów, każdy max 30 znaków

### d) POST /projects/{projectId}/config-note

- Body: `CreateConfigNoteDTO`

```json
{
  "title": "string (3-200 znaków)",
  "content": "string",
  "arrival_date": "YYYY-MM-DD",
  "departure_date": "YYYY-MM-DD",
  "num_days": 1,
  "num_people": 1
}
```

- Walidacja: tylko jedna notatka konfig per projekt

### e) PATCH /projects/{projectId}/notes/{noteId}

- Body: `UpdateNoteDTO` (pola opc.)
- Walidacja: jak w POST

### f) PATCH /projects/{projectId}/config-note

- Body: `UpdateConfigNoteDTO` (pola opc.)
- Walidacja: jak w POST config

### g) DELETE /projects/{projectId}/notes/{noteId}

- Walidacja: nie można usunąć notatki konfig. przez ten endpoint

### h) POST /projects/{projectId}/notes/reorder

- Body: `ReorderNotesDTO`

```json
{
  "note_positions": [{ "id": "uuid", "position": 0 }]
}
```

- Walidacja: wszystkie notatki muszą należeć do projektu

## 3. Wykorzystywane typy

```typescript
// Entities
interface Note {
  id: string;
  project_id: string;
  title: string;
  content: string | null;
  position: number;
  priority: number;
  is_config_note: boolean;
  config_data: ConfigData | null;
  created_at: Date;
  updated_at: Date;
}

interface ConfigData {
  arrival_date: Date;
  departure_date: Date;
  num_days: number;
  num_people: number;
}

interface NoteTag {
  note_id: string;
  tag: string;
}

// DTOs
interface NoteListItemDTO {
  id: string;
  title: string;
  is_config_note: boolean;
  position: number;
  priority: number;
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface NoteDetailDTO {
  id: string;
  title: string;
  content: string | null;
  is_config_note: boolean;
  position: number;
  priority: number;
  tags: string[];
  config_data?: {
    arrival_date: string;
    departure_date: string;
    num_days: number;
    num_people: number;
  };
  created_at: string;
  updated_at: string;
}

// Request DTOs zgodnie z dokumentacją wyżej

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

| Endpoint          | 200                                  | 201             | 204 | 400 | 401 | 404 | 409 |
| ----------------- | ------------------------------------ | --------------- | --- | --- | --- | --- | --- |
| GET notes         | `PaginatedResponse<NoteListItemDTO>` | —               | —   | ✔︎ | ✔︎ | ✔︎ | —   |
| GET note          | `NoteDetailDTO`                      | —               | —   | —   | ✔︎ | ✔︎ | —   |
| POST notes        | —                                    | `NoteDetailDTO` | —   | ✔︎ | ✔︎ | ✔︎ | —   |
| POST config-note  | —                                    | `NoteDetailDTO` | —   | ✔︎ | ✔︎ | ✔︎ | ✔︎ |
| PATCH note        | `NoteDetailDTO`                      | —               | —   | ✔︎ | ✔︎ | ✔︎ | —   |
| PATCH config-note | `NoteDetailDTO`                      | —               | —   | ✔︎ | ✔︎ | ✔︎ | —   |
| DELETE note       | —                                    | —               | ✔︎ | —   | ✔︎ | ✔︎ | —   |
| POST reorder      | `SuccessResponse`                    | —               | —   | ✔︎ | ✔︎ | ✔︎ | —   |

## 5. Przepływ danych

1. **Middleware** uwierzytelnia JWT i zapewnia `supabase` w `locals`.
2. Kontrolery w `src/pages/api/projects/[projectId]/notes/*`:
   - `index.ts` ➜ list / create regular
   - `[noteId].ts` ➜ get / patch / delete
   - `config-note.ts` ➜ create / patch
   - `reorder.ts` ➜ reorder
3. Walidacja wejścia przy pomocy schematów `zod`.
4. Wywołanie `NoteService` z odpowiednimi metodami.
5. `NoteService` wykonuje zapytania w transakcjach gdzie to potrzebne:
   - Operacja reorder zawsze w transakcji
   - Operacje na tagach w transakcji
6. Zwraca DTO ➜ serializacja JSON.

## 6. Względy bezpieczeństwa

- JWT + RLS (projekt należy do użytkownika).
- Constraint `one_config_per_project` chroni przed wieloma notatkami konfig.
- Limit 100 notatek per projekt, 20 tagów per notatka.

## 7. Obsługa błędów

- **400**: walidacja danych, `sort_by` nieobsługiwany, przekroczenie limitów.
- **401**: brak/nieprawidłowy JWT.
- **404**: brak projektu/notatki.
- **409**: próba utworzenia drugiej notatki konfiguracyjnej.
- **500**: błąd wewnętrzny – log.

## 8. Rozważania dotyczące wydajności

- Indeksy na `project_id`, `position`, `priority` i FTS index.
- Paginacja ogranicza rozmiar odpowiedzi.
- Operacja reorder tylko na zmienionych wierszach.

## 9. Etapy wdrożenia

1. Utworzenie `NoteService` w `src/lib/services/note.service.ts`.
2. Schematy Zod w `src/lib/validation/note.schema.ts`.
3. Implementacja endpointów API.
4. Testy (Vitest).
