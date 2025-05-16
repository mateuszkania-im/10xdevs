# Plan implementacji widoku Generate Plan Modal

## 1. Przegląd

Generate Plan Modal to dwustopniowy wizard umożliwiający użytkownikowi zadanie dodatkowych pytań AI (opcjonalnie) i obserwację postępu generowania planu podróży. Komunikacja z backendem odbywa się przez endpoint POST `/projects/{id}/plans/generate` z wersjonowaniem planu.

## 2. Routing widoku

Internal modal (portal). Triggerowany z widoku projektu.

## 3. Struktura komponentów

```
<GeneratePlanModal>
  ├── <DialogHeader>
  │     └── Tytuł „Generuj plan”
  ├── <Stepper>
  │     ├── Krok 1 – <TextareaQnA>
  │     └── Krok 2 – <ProgressSection>
  ├── <DialogFooter>
  │     ├── <Button variant="secondary" onClick=onClose>Anuluj</Button>
  │     └── <Button onClick=onNext disabled={!isStepValid}>Dalej / Generuj</Button>
  └── <Toast />
```

## 4. Szczegóły komponentów

### GeneratePlanModal

- Opis: Wizard 2-krokowy.
- Elementy:
  - Stepper (shadcn `Stepper` when available or custom).
  - Textarea pytań (krok 1).
  - Progress bar + stream log (krok 2).
- Interakcje:
  - „Dalej” → walidacja wersji planu (unikalna nazwa) + start generowania.
  - Generowanie wysyła POST; podczas streamu aktualizuje progress.
  - „Anuluj” podczas generowania wysyła abort controller do fetch.
- Walidacja:
  - version_name 1-50 char, unikalna (409 → błąd).
- Typy: `GeneratePlanDTO`, `GeneratePlanVM { version_name: string; questions?: string }`.
- Propsy: `{ projectId: string; isOpen: boolean; onClose(); }`.

### ProgressSection

- Opis: Pokazuje `ProgressBar` (0-100 %) + spinner + log linii (stream chunk).
- Elementy: `ProgressBar`, `<pre>`.
- Obsługa streamu: `fetch` z `ReadableStream` → append tekst.

## 5. Typy

```ts
import type { GeneratePlanDTO, TravelPlanDetailDTO } from "@/types";

interface GeneratePlanVM {
  version_name: string;
  questions?: string;
}
```

## 6. Zarządzanie stanem

- React Hook Form dla kroku 1.
- `useGeneratePlan(projectId)` – custom hook z AbortController, zwraca `{ mutate, progress, data, error, isGenerating, abort }`.
- Step state w useState.

## 7. Integracja API

| Akcja         | Endpoint                        | Metoda | Req               | Res                   |
| ------------- | ------------------------------- | ------ | ----------------- | --------------------- |
| generate plan | `/projects/{id}/plans/generate` | POST   | `GeneratePlanDTO` | `TravelPlanDetailDTO` |

- Obsługa streamu progresu: backend może wysyłać event-stream; używać `fetch` + `textDecoder`.

## 8. Interakcje użytkownika

- Wprowadza nazwę wersji + pytania → klik „Generuj”.
- Podczas generowania widzi pasek postępu i log.
- Może kliknąć „Anuluj” → abort.
- Po sukcesie toast + redirect do widoku planu.

## 9. Warunki i walidacja

- version_name unikalna (handle 409).
- Musi istnieć config note (przycisk wywołujący modal disabled inaczej, walidacja już w widoku projektu).

## 10. Obsługa błędów

- 409 → toast „Wersja o takiej nazwie już istnieje”.
- Sieć → abort + toast.
- AI failure (5xx) → toast + możliwość ponownej próby.

## 11. Kroki implementacji

1. Utwórz `GeneratePlanModal.tsx` w `src/components`.
2. Dodaj zod schema `generatePlanSchema`.
3. Zaimplementuj hook `useGeneratePlan` z streamem.
4. Podłącz AbortController.
5. Dodaj UI Stepper + ProgressBar (shadcn/ui `Progress`).
6. Obsłuż sukces → `queryClient.invalidate('plans')` i redirect.
7. Unit tests: schema, hook (mock fetch stream).
