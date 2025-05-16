# Plan implementacji widoku Landing Page

## 1. Przegląd

Landing Page to publiczna strona marketingowa prezentująca główne zalety aplikacji City Hooper oraz konwertująca odwiedzających do rejestracji / logowania. Kluczowym celem jest wysoka konwersja CTA i zgodność z WCAG.

## 2. Routing widoku

Ścieżka: `/` (root). Strona generowana statycznie przez Astro (SSG) z włączonym View Transitions API.

## 3. Struktura komponentów

```
<LayoutPublic>
├── <NavbarPublic>
├── <HeroSection>
├── <FeatureGrid>
├── <HowItWorks>
├── <Footer>
└── <AuthModal />   (portal, React, global)
```

## 4. Szczegóły komponentów

### NavbarPublic

- Opis: Górna nawigacja; logo + linki + przycisk CTA "Zaloguj / Zarejestruj".
- Główne elementy: `<header>`, `<nav>`, `<a>` logo, lista linków, `<Button>` CTA.
- Obsługiwane interakcje: klik CTA → `openAuthModal('signup')`.
- Walidacja: brak.
- Typy: `NavLink { href: string; label: string }`.
- Propsy: `{ links: NavLink[] }`.

### HeroSection

- Opis: Sekcja hero z animacją przepływu "Notatki → AI → Plan" + główne CTA.
- Główne elementy: `<section>`, nagłówek `<h1>`, `<p>` opis, `<Button>` CTA.
- Interakcje: klik CTA → `openAuthModal('signup')`.
- Walidacja: brak.
- Typy: brak nowych.
- Propsy: brak (statyczna zawartość).

### FeatureGrid

- Opis: Grid 3-4 kart prezentujących kluczowe funkcje.
- Elementy: `<section>`, `<FeatureCard>` x N.
- Interakcje: hover animacje.
- Walidacja: brak.
- Typy: `Feature { icon: ReactNode; title: string; description: string }`.
- Propsy: `{ features: Feature[] }`.

### HowItWorks

- Opis: Sekcja krok-po-kroku (timeline) opisująca flow użytkownika.
- Elementy: `<section>`, lista `<StepItem>`.
- Interakcje: brak.
- Walidacja: brak.
- Typy: `Step { number: number; title: string; description: string }`.
- Propsy: `{ steps: Step[] }`.

### Footer

- Opis: Stopka z linkami informacyjnymi.
- Elementy: `<footer>`, lista linków.
- Interakcje: linki zewn./wewn.
- Walidacja: brak.
- Typy: `FooterLink { href: string; label: string }`.
- Propsy: `{ links: FooterLink[] }`.

### AuthModal

- Opis: Globalny modal (React + shadcn/ui dialog) z tabami "Logowanie" / "Rejestracja" / "Reset hasła".
- Elementy: `<Dialog>`, `<Tabs>`, `<Form>` (shadcn/ui `Input`, `Button`).
- Interakcje:
  - otwarcie/zamknięcie modal.
  - submit formularzy → wywołania Supabase Auth (`signInWithPassword`, `signUp`, `resetPasswordForEmail`).
- Walidacja: zod – e-mail (`email()`), hasło min 8 znaków + 1 cyfra + 1 lit. wielka.
- Typy: `AuthFormData { email: string; password: string; confirmPassword?: string }`.
- Propsy: none (zarządza globalny context / hook).

## 5. Typy

```ts
export interface NavLink {
  href: string;
  label: string;
}
export interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}
export interface Step {
  number: number;
  title: string;
  description: string;
}
export interface FooterLink {
  href: string;
  label: string;
}
export interface AuthFormData {
  email: string;
  password: string;
  confirmPassword?: string;
}
```

## 6. Zarządzanie stanem

- `useAuthModal()` – globalny hook (React context) przechowujący `{ isOpen, tab, open(tab?), close }`.
- `useAuth()` – wrapper nad Supabase (`user`, `signIn`, `signUp`, `signOut`, `resetPassword`).
- Lokalny stan formularzy zarządzany przez React Hook Form + zod resolver.

## 7. Integracja API

- Supabase Auth JS klient (już skonfigurowany w `src/lib/supabase.ts`).
- Akcje:
  - Rejestracja: `supabase.auth.signUp({ email, password })`.
  - Logowanie: `supabase.auth.signInWithPassword({ email, password })`.
  - Reset hasła: `supabase.auth.resetPasswordForEmail(email)`.
- Odpowiedzi typowane przez `@supabase/supabase-js`.

## 8. Interakcje użytkownika

1. Klik "Zaloguj / Zarejestruj" → otwarcie `AuthModal`.
2. Wybór tab "Rejestracja" → wypełnienie formularza → submit → spinner → sukces → toast + redirect do `/app/projects`.
3. Błąd → toast z komunikatem.
4. Zamknięcie modal przyciskiem `X` lub klawiszem `Esc`.

## 9. Warunki i walidacja

- Email: poprawny format.
- Hasło: min 8 znaków, 1 duża litera, 1 cyfra.
- Confirm password = password (tylko w rejestracji).
- Disable CTA przy niespełnionych warunkach.

## 10. Obsługa błędów

- Wyświetlanie komunikatów z Supabase (np. `User already registered`) w komponencie `FormError`.
- Sieć/offline → toast "Brak połączenia z internetem".
- Focus trap + aria-live dla komunikatów.

## 11. Kroki implementacji

1. Utwórz `LayoutPublic.astro` z Tailwind container + slot.
2. Zaimplementuj `NavbarPublic.astro` z przyciskiem CTA.
3. Dodaj `HeroSection.astro`, `FeatureGrid.astro`, `HowItWorks.astro`, `Footer.astro`.
4. Podmień zawartość `src/pages/index.astro` na powyższą strukturę.
5. Skonfiguruj React portal w `LayoutPublic` (`<AuthModal />`).
6. Zaimplementuj hook `useAuthModal` i provider w `src/components/providers/AuthModalProvider.tsx`.
7. Zbuduj `AuthModal.tsx` używając shadcn/ui `Dialog` i `Tabs` + React Hook Form.
8. Dodaj walidację zod i integrację z Supabase Auth + toasty (shadcn `useToast`).
9. Dodaj testy jednostkowe hooków i walidacji (Vitest + Testing Library).
10. Sprawdź dostępność (axe-core) i RWD.
