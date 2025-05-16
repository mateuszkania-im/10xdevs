# Plan implementacji widoku Edytora Notatki

## 1. Przegląd

Edytor Notatki służy do tworzenia i aktualizacji notatek w projekcie, w tym notatki konfiguracyjnej. Renderowany jako drawer (desktop) lub pełnoekranowy modal (mobile). Zapewnia walidację pól, autosave draft oraz integrację z API notes.

## 2. Routing widoku

Internal state – nie zmienia URL lub dodaje `?noteId=edit` jako search param (opcjonalnie). Komponent mountowany portalowo w Projekt View.

## 3. Struktura komponentów

```
<NoteEditorModal>
  ├── <DialogHeader>
  │     └── Tytuł „Nowa notatka” / „Edytuj notatkę”
  ├── <Tabs> Config | Regular (jeśli to config note?)
  ├── <FormProvider>
  │     ├── <Input name="title" />
  │     ├── <RichTextEditor name="content" />
  │     ├── <TagInput name="tags" />
  │     ├── <PrioritySelector name="priority" />
  │     └── <ConfigFields> (arrival_date, departure_date, num_days, num_people) – tylko dla config note
  ├── <DialogFooter>
  │     ├── <Button variant="secondary">Anuluj</Button>
  │     └── <Button type="submit" disabled={isSubmitting}>Zapisz</Button>
  └── <Toast />
```

## 4. Szczegóły komponentów

### NoteEditorModal

- Opis: Formularz CRUD notatek.
- Elementy: shadcn/ui `Dialog`, React Hook Form (`FormProvider`), zod schema.
- Interakcje: submit → POST/ PATCH; autosave onBlur do localStorage (draft-key per project/noteId).
- Walidacja:
  - title: 3-200 char.
  - priority 0-10.
  - tags ≤ 20, pattern `/^[a-z0-9_-]{1,30}$/i`.
  - Jeśli config: daty wymagane, departure > arrival, num_days = diff, num_people 1-50.
- Typy: `CreateNoteDTO`, `UpdateNoteDTO`, `CreateConfigNoteDTO`, `UpdateConfigNoteDTO`, `NoteEditorVM`.
- Propsy: `{ mode: 'create'|'edit'; initialData?: NoteDetailDTO; projectId: string; onSuccess(); onClose(); }`.

## 5. Typy

```ts
import type { CreateNoteDTO, UpdateNoteDTO, CreateConfigNoteDTO, UpdateConfigNoteDTO, NoteDetailDTO } from "@/types";

interface NoteEditorVM {
  title: string;
  content: string | null;
  priority: number;
  tags: string[];
  isConfig: boolean;
  arrival_date?: string;
  departure_date?: string;
  num_days?: number;
  num_people?: number;
}
```

## 6. Zarządzanie stanem

- Lokalny React Hook Form state + zod resolver.
- Draft autosave hook `useDraftNote(projectId, noteId?)` (debounce 1 s, localStorage).
- Submit mutation React Query (`useUpsertNote`).

## 7. Integracja API

| Akcja         | Endpoint                        | Metoda | Req                   | Res             |
| ------------- | ------------------------------- | ------ | --------------------- | --------------- |
| create note   | `/projects/{id}/notes`          | POST   | `CreateNoteDTO`       | `NoteDetailDTO` |
| create config | `/projects/{id}/config-note`    | POST   | `CreateConfigNoteDTO` | `NoteDetailDTO` |
| update note   | `/projects/{id}/notes/{noteId}` | PATCH  | `UpdateNoteDTO`       | dto             |
| update config | `/projects/{id}/config-note`    | PATCH  | `UpdateConfigNoteDTO` | dto             |

## 8. Interakcje użytkownika

- Input focus pierwsze pole.
- Autosave draft (toast „Wersja robocza zapisana”).
- Submit → spinner → success → toast + invalidate notes list → close.
- Escape → onClose (jeśli nie submitting).

## 9. Warunki i walidacja

- Dla config note: single instance – przy create API może zwrócić 409; obsłużyć toast.
- Disable submit przy błędach.

## 10. Obsługa błędów

- 409 → toast „Notatka konfiguracyjna już istnieje”.
- 401 → global handler.
- Network → retry lub error toast.

## 11. Kroki implementacji

1. Utwórz `NoteEditorModal.tsx` w `src/components`.
2. Dodaj zod schema `noteEditorSchema`.
3. Implementuj `useDraftNote` helper.
4. Hooki React Query `useUpsertNote`.
5. Unit tests: schema, autosave.
