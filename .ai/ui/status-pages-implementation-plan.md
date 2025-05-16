# Plan implementacji stron statusowych

## 1. Przegląd

Strony statusowe służą do obsługi różnych stanów aplikacji, takich jak brak zasobu (404), brak autoryzacji (401), czy błąd serwera (500). Zapewniają użytkownikowi czytelną informację o problemie oraz sugestie możliwych działań. Są spójne wizualnie z resztą aplikacji i oferują prosty powrót do głównych funkcji.

## 2. Routing widoku

- Ścieżka `/404` - dla braku zasobu
- Ścieżka `/401` - dla braku autoryzacji
- Ścieżka `/500` - dla błędu serwera
- Dynamiczne przekierowania z middleware (np. 404 i middleware auth)

## 3. Struktura komponentów

```
<StatusPageLayout>
  ├── <StatusHeader>
  │     ├── <StatusIcon>
  │     └── <StatusTitle>
  ├── <StatusMessage>
  ├── <StatusActions>
  │     └── <Button> x N
  └── <BackToHomeLink>
```

## 4. Szczegóły komponentów

### StatusPageLayout

- Opis: Bazowy layout dla wszystkich stron statusowych.
- Elementy: `<main>` z centrowaniem treści, logo.
- Propsy: `{ children: ReactNode }`.

### StatusHeader

- Opis: Górna część strony z ikoną statusu i tytułem.
- Elementy: `<header>`, ikona, `<h1>`.
- Propsy: `{ icon: ReactNode; title: string; statusCode: number }`.

### StatusMessage

- Opis: Wiadomość wyjaśniająca błąd/status.
- Elementy: `<p>` z tekstem objaśniającym.
- Propsy: `{ message: string }`.

### StatusActions

- Opis: Zestaw przycisków akcji.
- Elementy: `<div>` z przyciskami.
- Propsy: `{ actions: { label: string; href: string; variant: string }[] }`.

### BackToHomeLink

- Opis: Link powrotu do strony głównej.
- Elementy: `<a>` z ikoną.
- Propsy: brak.

## 5. Typy

```ts
interface StatusPageProps {
  statusCode: 404 | 401 | 500;
  title: string;
  message: string;
  actions?: {
    label: string;
    href: string;
    variant: "default" | "outline" | "secondary";
  }[];
}
```

## 6. Zarządzanie stanem

- Brak złożonego stanu; strony są statyczne.
- Opcjonalnie: integracja z Analityką dla śledzenia błędów 404/500.

## 7. Integracja API

- Brak bezpośredniej integracji z API.
- Middleware przekierowuje do tych stron na podstawie odpowiedzi z API.

## 8. Interakcje użytkownika

- Klik "Wróć do strony głównej" → navigate do `/`.
- Klik na przyciski akcji → navigate do odpowiednich ścieżek.
- 401: "Zaloguj się" → otwiera AuthModal na `/`.

## 9. Warunki i walidacja

- Brak złożonej walidacji.
- Sprawdzenie statusCode dla wyboru odpowiedniej ikony/szablonu.

## 10. Obsługa błędów

- Strony same w sobie są obsługą błędów.
- W przypadku błędu podczas renderowania stron statusowych, defer do standardowego Astro error handling.

## 11. Kroki implementacji

1. Utwórz pliki stron: `src/pages/404.astro`, `src/pages/401.astro`, `src/pages/500.astro`.
2. Stwórz reużywalny layout `StatusPageLayout.astro`.
3. Implementuj komponenty shared: `StatusHeader`, `StatusMessage`, itp.
4. Dodaj middleware do przekierowań (`src/middleware.ts`) dla API errors i auth checks:
   ```ts
   // Przykład dla middleware
   if (response.status === 401) return Response.redirect(new URL("/401", request.url));
   if (response.status === 404) return Response.redirect(new URL("/404", request.url));
   ```
5. Dodaj ikony statusów (opcjonalnie: ilustracje).
6. Zapewnij responsywność i dostępność.
7. Zintegruj opcjonalnie z system analityki dla logowania błędów.
