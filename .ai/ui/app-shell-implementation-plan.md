# Plan implementacji AppShell

## 1. Przegląd

AppShell to bazowy layout dla wszystkich chronionych widoków aplikacji, zapewniający spójny interfejs nawigacyjny. Składa się z górnego paska (TopBar) oraz bocznego panelu (SideNav) z listą projektów użytkownika. AppShell obsługuje również elementy globalne takie jak system powiadomień i portale dla modali.

## 2. Routing widoku

Komponent reużywalny, stosowany we wszystkich podstronach `/app/*`. Brak dedykowanej trasy.

## 3. Struktura komponentów

```
<AppShell>
  ├── <TopBar>
  │     ├── <Logo>
  │     ├── <SearchBar> (opcjonalnie)
  │     └── <UserMenu>
  ├── <SideNav>
  │     ├── <ProjectList>
  │     │     └── <ProjectListItem> x N
  │     └── <NewProjectButton>
  ├── <PortalRoot /> (dla modali)
  ├── <ToastProvider />
  └── <main>
        └── {children} // slot na zawartość podstron
```

## 4. Szczegóły komponentów

### TopBar

- Opis: Górna belka z logo, wyszukiwarką, menu użytkownika.
- Elementy: `<header>` fixed top, logo, opcjonalne pola.
- Interakcje: Klik logo → `/app/projects`, toggle sidebar (mobile).
- Propsy: brak.

### UserMenu

- Opis: Dropdown z avatarem użytkownika i opcjami.
- Elementy: shadcn/ui `DropdownMenu`, avatar, menu items.
- Interakcje: wylogowanie, ustawienia (opcjonalnie).
- Propsy: `{ user }` (z useAuth).

### SideNav

- Opis: Boczna nawigacja z listą projektów.
- Elementy: `<nav>`, lista projektów, sticky button.
- Interakcje: toggle collapse (desktop), slide-in/out (mobile).
- Propsy: `{ collapsed?: boolean; onToggleCollapse?() }`.

### ProjectList

- Opis: Lista projektów użytkownika z active state.
- Elementy: `<ul>`, `<ProjectListItem>` x N.
- Interakcje: klik → navigate, active highlight.
- Typy: `ProjectListItemDTO[]`.
- Propsy: `{ projects: ProjectListItemDTO[]; activeId?: string }`.

### ProjectListItem

- Opis: Element listy projektów.
- Elementy: `<li>`, link, nazwa, badge.
- Interakcje: klik → navigate, hover, active.
- Propsy: `{ project: ProjectListItemDTO; isActive: boolean }`.

## 5. Typy

```ts
import type { ProjectListItemDTO } from "@/types";

interface AppShellProps {
  children: ReactNode;
  activeProjectId?: string;
}
```

## 6. Zarządzanie stanem

- Auth context (`useAuth()`) dla danych użytkownika i wylogowania.
- React Query `useProjects()` dla listy projektów w SideNav.
- LocalStorage dla zapamiętania collapsed state SideNav.
- Responsive state (useMediaQuery) dla mobile detection.

## 7. Integracja API

| Akcja         | Endpoint       | Metoda | Req | Res                                     |
| ------------- | -------------- | ------ | --- | --------------------------------------- |
| list projects | `/projects`    | GET    | --- | `PaginatedResponse<ProjectListItemDTO>` |
| logout        | `auth/signout` | POST   | --- | ---                                     |

## 8. Interakcje użytkownika

- Toggle SideNav: desktop → collapsed/expanded; mobile → slide-in/out.
- Klik projektu → navigate do strony projektu + highlight active.
- Klik avatar → dropdown menu + wylogowanie.
- Resize window → responsywne dostosowanie interfejsu.

## 9. Warunki i walidacja

- Route guard dla wszystkich `/app/*` w middleware.
- Sprawdzanie sesji i przekierowanie do `/401` jeśli wygasła/brak tokena.

## 10. Obsługa błędów

- Auth session expired → toast + redirect do `/`.
- API error przy ładowaniu projektów → retry + error state w SideNav.

## 11. Kroki implementacji

1. Stwórz plik `src/layouts/AppShell.astro`.
2. Zaimplementuj `<TopBar>` z logo i UserMenu.
3. Zbuduj `<SideNav>` z ProjectList i toggle.
4. Dodaj context providers (ToastProvider, PortalRoot).
5. Zintegruj z autentykacją (SideNav preload projects).
6. Dodaj obsługę responsywności (CSS/JS breakpoints).
7. Zintegruj Toast system z react-hot-toast lub shadcn/ui Toast.
8. Zoptymalizuj SSR dla szybkiego hydration (minimalizuj client islands).
9. Dodaj `useProjectNavigation` hook dla aktywnego projektu.
10. Dodaj testy dostępności (keyboard nav, screen readers).
