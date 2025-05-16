# Architektura UI dla City Hooper

## 1. Przegląd struktury UI

Aplikacja City Hooper składa się z publicznego obszaru marketingowego (Landing Page + modalne okna autentykacji) oraz chronionego obszaru aplikacyjnego dostępnego wyłącznie po zalogowaniu. Chroniony obszar korzysta z układu "Application Shell" (stała górna nawigacja + responsywny boczny panel), w którym renderowane są kontekstowe widoki dla projektów, notatek i planów.

## 2. Lista widoków

### 2.1 Landing Page

- **Ścieżka**: `/`
- **Cel**: Prezentacja wartości produktu i konwersja użytkowników do rejestracji/logowania.
- **Kluczowe informacje**: Sekcja hero z animacją przepływu "Notatki → AI → Plan", opis funkcji, CTA.
- **Kluczowe komponenty**: `NavbarPublic`, `HeroSection`, `FeatureGrid`, `HowItWorks`, `Footer`, `AuthModal`.
- **UX/AA/Security**: Wyraźne CTA, kontrast, semantyczne nagłówki, brak wrażliwych danych.

### 2.2 AuthModal (globalny komponent)

- **Ścieżka**: `N/A` (renderowany portalowo nad dowolnym widokiem)
- **Cel**: Logowanie, rejestracja, reset hasła (Supabase Auth).
- **Kluczowe informacje**: Formularze, walidacja pól.
- **Kluczowe komponenty**: `Tabs` (Login / Sign-up), `Input`, `Button`, `PasswordStrengthMeter`.
- **UX/AA/Security**: Maskowanie haseł, komunikaty błędów, obsługa Enter, focus trap, reCAPTCHA opcjonalnie.

### 2.3 Dashboard / Lista projektów

- **Ścieżka**: `/app/projects`
- **Cel**: Zarządzanie projektami podróży użytkownika.
- **Kluczowe informacje**: Karty projektów (nazwa, daty, status planów), filtr/sortowanie, licznik projektów.
- **Kluczowe komponenty**: `AppShell`, `ProjectCard`, `ProjectFilters`, `NewProjectButton`, `NewProjectModal`, `Toast`.
- **UX/AA/Security**: Optymistyczne dodawanie/edycja, aria-labels, dostęp tylko z ważnym JWT.

### 2.4 Widok projektu

- **Ścieżka**: `/app/projects/:projectId`
- **Cel**: Centralne miejsce pracy nad notatkami i planami jednego projektu.
- **Kluczowe informacje**: Trójdzielny layout (Sidebar lista projektów, Main panel – notatki, Right panel – szczegóły/edycja).
- **Kluczowe komponenty**: `ProjectSidebar`, `NoteBoard`, `NoteCard`, `ConfigNoteForm`, `NoteDetailDrawer`, `PlanList`, `GeneratePlanButton`, `GeneratePlanModal`, `Toast`.
- **UX/AA/Security**: Drag-and-drop notatek (keyboard accessible), wyraźne oznaczenie notatki konfiguracyjnej, blokada generowania planu dopóki brak config note.

### 2.5 Edytor notatki (drawer/modal)

- **Ścieżka**: `internal` (np. `/app/projects/:projectId/notes/:noteId/edit` jako state)
- **Cel**: Tworzenie i aktualizacja notatek, w tym konfiguracyjnej.
- **Kluczowe informacje**: Pola tytuł, treść (WYSIWYG), tagi, priorytet, specyficzne pola config.
- **Kluczowe komponenty**: `RichTextEditor`, `TagInput`, `PrioritySelector`, `DatePickerRange`, `NumberInput`, `SaveButton`.
- **UX/AA/Security**: Autosave draft, walidacja, aria-describedby, sanitizacja HTML z edytora.

### 2.6 Generate Plan Modal (wizard)

- **Ścieżka**: `internal` modal
- **Cel**: Dwuetapowe generowanie planu z możliwością dodatkowych pytań.
- **Kluczowe informacje**: Krok 1 – pytania AI, Krok 2 – progress bar + wynik.
- **Kluczowe komponenty**: `Stepper`, `TextareaQnA`, `ProgressBar`, `AbortButton`, `Toast`.
- **UX/AA/Security**: Możliwość anulowania, wyraźne komunikaty, loading states.

### 2.7 Widok planu podróży

- **Ścieżka**: `/app/projects/:projectId/plans/:planId`
- **Cel**: Przegląd i edycja konkretnego planu.
- **Kluczowe informacje**: Timeline dni, lista aktywności, status czy przeterminowany.
- **Kluczowe komponenty**: `PlanHeader`, `DayAccordion`, `ActivityItem`, `ExportPDFButton`, `OutdatedBadge`.
- **UX/AA/Security**: Edycja inline, print-friendly styles, zabezpieczenie przed XSS w opisach.

### 2.8 Widok porównania planów

- **Ścieżka**: `/app/projects/:projectId/plans/compare?plan1=&plan2=`
- **Cel**: Równoległe porównanie dwóch wersji planu.
- **Kluczowe informacje**: Dwa kolumnowe panele, highlight różnic.
- **Kluczowe komponenty**: `PlanCompareGrid`, `DifferenceHighlighter`, `PlanSelectDropdown`.
- **UX/AA/Security**: Sticky headers, czytelne kolory, aria-live dla zmian.

### 2.9 Strony stanu

- **NotFound (`/404`)** i **Unauthorized (`/401`)** – informacyjne ekrany z CTA.

## 3. Mapa podróży użytkownika

1. **Wejście na Landing Page** → Użytkownik klika **"Zarejestruj się"**.
2. **AuthModal**: rejestracja → automatyczne logowanie.
3. **Redirect** do **Dashboard** – lista projektów pusta.
4. Kliknięcie **"Nowy projekt"** → **NewProjectModal** → zapis → redirect do **Widoku projektu**.
5. Automatyczne otwarcie **ConfigNoteForm** → użytkownik wypełnia dane → zapis.
6. Dodawanie notatek zwykłych przez **NoteBoard** / **RichTextEditor**.
7. Po spełnieniu wymagań klik **"Generuj plan"** → **GeneratePlanModal** (pytania → generowanie) → sukces.
8. Użytkownik przegląda **Widok planu**, ewentualnie edytuje, eksportuje PDF.
9. (Opcjonalnie) Generuje drugą wersję planu i przechodzi do **Widoku porównania**.
10. Powrót do **Dashboard** lub wylogowanie.

## 4. Układ i struktura nawigacji

- **Public Navbar** (`NavbarPublic`) – logo, linki info, przycisk logowania/rejestracji.
- **AppShell** (chronione):
  - **TopBar** – logo + `UserMenu` (avatar, ustawienia, wyloguj).
  - **SideNav** – lista projektów z quick-add + skróty (Dashboard, Ustawienia).
  - **MainArea** – dynamiczne widoki zgodnie z routerem.
- Nawigacja oparta o React Router (lub Astro view transition) z ochroną tras (RLS + token).

## 5. Kluczowe komponenty

`AppShell` – bazowy layout chronionej aplikacji.

`AuthModal` – zarządza wszystkimi flow autentykacji.

`NoteBoard` – responsywna siatka notatek z drag-and-drop i reorder API sync.

`RichTextEditor` – WYSIWYG z sanitizacją i wsparciem markdown.

`GeneratePlanModal` – wizard z komunikacją streamingową z endpointem /plans/generate.

`PlanCompareGrid` – komponent prezentujący dwa plany side-by-side z diffem.

`Toast` – globalny system powiadomień o stanie operacji asynchronicznych.

`ProjectSidebar` – lista projektów dostępna w każdym widoku aplikacji.
