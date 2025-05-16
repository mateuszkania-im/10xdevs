# Plan Testów Projektu CityHooper

## 1. Wprowadzenie i Cele Testowania

### 1.1. Wprowadzenie

Niniejszy dokument przedstawia plan testów dla aplikacji CityHooper. Celem projektu jest dostarczenie platformy do zarządzania projektami, planami i notatkami, z wykorzystaniem nowoczesnego stosu technologicznego obejmującego Astro, React, TypeScript, Tailwind CSS, Shadcn/ui, Supabase oraz Openrouter.ai. Plan ten określa strategię, zakres, zasoby i harmonogram działań testowych mających na celu zapewnienie wysokiej jakości produktu finalnego.

### 1.2. Cele Testowania

Główne cele procesu testowania to:

*   Weryfikacja, czy aplikacja spełnia zdefiniowane wymagania funkcjonalne i niefunkcjonalne.
*   Identyfikacja i zaraportowanie defektów oprogramowania.
*   Zapewnienie stabilności, niezawodności i wydajności aplikacji.
*   Potwierdzenie, że aplikacja jest intuicyjna, użyteczna i dostępna dla użytkowników.
*   Minimalizacja ryzyka związanego z wdrożeniem aplikacji na środowisko produkcyjne.
*   Weryfikacja poprawnej integracji z usługami zewnętrznymi (Supabase, Openrouter.ai).
*   Zapewnienie bezpieczeństwa danych użytkowników i systemu.

## 2. Zakres Testów

### 2.1. Funkcjonalności objęte testami:

*   **Moduł Uwierzytelniania:**
    *   Rejestracja nowych użytkowników.
    *   Logowanie istniejących użytkowników.
    *   Wylogowywanie.
    *   Obsługa błędnych danych logowania/rejestracji.
    *   Ochrona tras wymagających zalogowania (middleware).
    *   Zarządzanie sesją użytkownika.
*   **Zarządzanie Projektami:**
    *   Tworzenie nowego projektu.
    *   Wyświetlanie listy projektów.
    *   Wyświetlanie szczegółów projektu.
    *   Edycja danych projektu.
    *   Usuwanie projektu.
    *   Walidacja danych formularza projektu.
*   **Zarządzanie Planami (w kontekście projektu):**
    *   Tworzenie nowego planu dla projektu.
    *   Generowanie planu (jeśli dotyczy, z uwzględnieniem integracji z AI).
    *   Wyświetlanie listy planów w projekcie.
    *   Wyświetlanie szczegółów planu.
    *   Edycja planu.
    *   Usuwanie planu.
    *   Porównywanie planów.
    *   Walidacja danych formularza planu.
*   **Zarządzanie Notatkami (w kontekście projektu):**
    *   Tworzenie nowej notatki dla projektu.
    *   Wyświetlanie listy notatek w projekcie.
    *   Wyświetlanie szczegółów notatki.
    *   Edycja notatki.
    *   Usuwanie notatki.
    *   Walidacja danych formularza notatki.
*   **Interfejs Użytkownika (UI):**
    *   Nawigacja główna i boczna.
    *   Responsywność interfejsu na różnych urządzeniach (desktop, tablet, mobile).
    *   Poprawność wyświetlania elementów UI (komponenty Shadcn/ui, AcertinityUI, własne).
    *   Przełączanie motywu (ciemny/jasny).
    *   Wyświetlanie powiadomień i komunikatów (np. toasty).
*   **API Backendowe:**
    *   Wszystkie endpointy CRUD dla projektów, planów, notatek.
    *   Obsługa parametrów zapytań (sortowanie, filtrowanie - jeśli zaimplementowane).
    *   Walidacja danych wejściowych po stronie serwera.
    *   Poprawność kodów odpowiedzi HTTP.
    *   Autoryzacja dostępu do endpointów.
*   **Integracja z AI (Openrouter.ai):**
    *   Poprawność wysyłania żądań do modelu AI.
    *   Poprawność przetwarzania odpowiedzi z modelu AI.
    *   Obsługa błędów komunikacji z AI.

### 2.2. Funkcjonalności wyłączone z testów (jeśli dotyczy):

*   (Na tym etapie zakłada się pełne pokrycie kluczowych funkcjonalności. Ewentualne wyłączenia zostaną udokumentowane w przyszłości, jeśli zajdzie taka potrzeba.)

## 3. Typy Testów do Przeprowadzenia

*   **Testy Jednostkowe (Unit Tests):**
    *   **Cel:** Weryfikacja poprawności działania małych, izolowanych fragmentów kodu (funkcje, komponenty React, moduły w `src/lib/`).
    *   **Narzędzia:** Vitest/Jest, React Testing Library, TypeScript.
    *   **Zakres:** Logika biznesowa w serwisach, helperach, walidatorach; renderowanie i podstawowe interakcje komponentów React; funkcje użytkowe.
*   **Testy Integracyjne (Integration Tests):**
    *   **Cel:** Weryfikacja poprawnej współpracy między różnymi modułami i komponentami aplikacji.
    *   **Narzędzia:** Vitest/Jest, React Testing Library, Supertest (dla API), mocki Supabase SDK i Openrouter.ai API.
    *   **Zakres:**
        *   Integracja komponentów frontendowych (np. formularz -> wywołanie serwisu).
        *   Integracja frontend-backend (komponenty React/Astro <-> endpointy API Astro).
        *   Integracja endpointów API z logiką Supabase (mockowaną).
        *   Integracja z mockowanym API Openrouter.ai.
*   **Testy End-to-End (E2E Tests):**
    *   **Cel:** Weryfikacja kompletnych przepływów użytkownika w aplikacji, symulując rzeczywiste interakcje.
    *   **Narzędzia:** Playwright lub Cypress.
    *   **Zakres:** Kluczowe scenariusze użytkownika, np. rejestracja -> logowanie -> stworzenie projektu -> dodanie planu -> wylogowanie. Testowanie nawigacji, formularzy, wyświetlania danych.
*   **Testy API:**
    *   **Cel:** Bezpośrednie testowanie endpointów API backendowego w celu weryfikacji ich funkcjonalności, niezawodności, wydajności i bezpieczeństwa.
    *   **Narzędzia:** Postman, Insomnia, lub biblioteki do testów HTTP w kodzie (np. Supertest zintegrowany z Vitest/Jest).
    *   **Zakres:** Wszystkie endpointy zdefiniowane w `src/pages/api/`, weryfikacja metod HTTP, payloadów, nagłówków, kodów odpowiedzi, walidacji.
*   **Testy Wydajnościowe (Performance Tests):**
    *   **Cel:** Ocena responsywności i stabilności aplikacji pod obciążeniem.
    *   **Narzędzia:** Lighthouse, WebPageTest, k6 (dla API).
    *   **Zakres:** Czas ładowania kluczowych stron (np. lista projektów), czas odpowiedzi API pod obciążeniem, wykorzystanie zasobów.
*   **Testy Bezpieczeństwa (Security Tests):**
    *   **Cel:** Identyfikacja podatności aplikacji na zagrożenia.
    *   **Narzędzia:** OWASP ZAP (manualnie/automatycznie), skanery podatności, przeglądy kodu pod kątem bezpieczeństwa.
    *   **Zakres:** Testy penetracyjne (SQL Injection, XSS, CSRF), weryfikacja mechanizmów autentykacji i autoryzacji, bezpieczeństwo sesji, konfiguracja Supabase RLS.
*   **Testy Użyteczności (Usability Tests):**
    *   **Cel:** Ocena łatwości obsługi, intuicyjności i ogólnego doświadczenia użytkownika (UX).
    *   **Metody:** Testy z użytkownikami (obserwacja), analiza heurystyczna.
    *   **Zakres:** Nawigacja, zrozumiałość interfejsu, przepływy zadań.
*   **Testy Dostępności (Accessibility Tests):**
    *   **Cel:** Zapewnienie, że aplikacja jest użyteczna dla osób z różnymi niepełnosprawnościami, zgodnie ze standardami WCAG.
    *   **Narzędzia:** axe DevTools, Lighthouse, manualne testy z czytnikami ekranu.
    *   **Zakres:** Kontrast, nawigacja klawiaturą, etykiety ARIA, semantyka HTML.
*   **Testy Wizualnej Regresji (Visual Regression Tests):**
    *   **Cel:** Wykrywanie niezamierzonych zmian w wyglądzie interfejsu użytkownika.
    *   **Narzędzia:** Percy, Applitools, Playwright/Cypress z funkcją porównywania screenshotów.
    *   **Zakres:** Kluczowe strony i komponenty.

## 4. Scenariusze Testowe dla Kluczowych Funkcjonalności

(Przykładowe scenariusze, do rozwinięcia)

### 4.1. Rejestracja Użytkownika
| ID Scenariusza | Opis                                                                 | Kroki Testowe                                                                                                                                    | Oczekiwany Rezultat                                                                                             | Priorytet |
| -------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- | --------- |
| TC_AUTH_REG_01 | Pomyślna rejestracja nowego użytkownika z poprawnymi danymi           | 1. Otwórz stronę główną. 2. Kliknij "Zarejestruj się". 3. Wypełnij formularz poprawnym adresem email i hasłem. 4. Zaakceptuj regulamin. 5. Kliknij "Zarejestruj". | Użytkownik zostaje zarejestrowany i zalogowany. Przekierowanie na stronę aplikacji (np. dashboard).                | Wysoki    |
| TC_AUTH_REG_02 | Próba rejestracji z już istniejącym adresem email                    | 1. Otwórz stronę główną. 2. Kliknij "Zarejestruj się". 3. Wypełnij formularz adresem email, który już istnieje w systemie. 4. Kliknij "Zarejestruj". | Komunikat błędu "Użytkownik o tym adresie email już istnieje". Użytkownik nie zostaje zarejestrowany.             | Wysoki    |
| TC_AUTH_REG_03 | Próba rejestracji z niepoprawnym formatem email                      | 1. Otwórz stronę główną. 2. Kliknij "Zarejestruj się". 3. Wpisz w pole email "niepoprawnyemail". 4. Wypełnij resztę pól. 5. Kliknij "Zarejestruj".    | Komunikat błędu walidacji przy polu email. Użytkownik nie zostaje zarejestrowany.                               | Średni    |
| TC_AUTH_REG_04 | Próba rejestracji ze zbyt krótkim hasłem                             | 1. Otwórz stronę główną. 2. Kliknij "Zarejestruj się". 3. Wpisz hasło krótsze niż wymagane. 4. Wypełnij resztę pól. 5. Kliknij "Zarejestruj".        | Komunikat błędu walidacji przy polu hasła. Użytkownik nie zostaje zarejestrowany.                                | Średni    |

### 4.2. Logowanie Użytkownika
| ID Scenariusza | Opis                                                                 | Kroki Testowe                                                                                                                            | Oczekiwany Rezultat                                                                          | Priorytet |
| -------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | --------- |
| TC_AUTH_LOG_01 | Pomyślne logowanie z poprawnymi danymi                               | 1. Otwórz stronę główną. 2. Kliknij "Zaloguj się". 3. Wpisz poprawny email i hasło zarejestrowanego użytkownika. 4. Kliknij "Zaloguj". | Użytkownik zostaje zalogowany. Przekierowanie na stronę aplikacji (np. dashboard).         | Wysoki    |
| TC_AUTH_LOG_02 | Próba logowania z niepoprawnym hasłem                                | 1. Otwórz stronę główną. 2. Kliknij "Zaloguj się". 3. Wpisz poprawny email i niepoprawne hasło. 4. Kliknij "Zaloguj".                    | Komunikat błędu "Nieprawidłowy email lub hasło". Użytkownik nie zostaje zalogowany.         | Wysoki    |
| TC_AUTH_LOG_03 | Próba logowania z nieistniejącym adresem email                       | 1. Otwórz stronę główną. 2. Kliknij "Zaloguj się". 3. Wpisz email, który nie istnieje w systemie. 4. Kliknij "Zaloguj".                   | Komunikat błędu "Nieprawidłowy email lub hasło". Użytkownik nie zostaje zalogowany.         | Wysoki    |

### 4.3. Tworzenie Nowego Projektu
| ID Scenariusza | Opis                                                                 | Kroki Testowe                                                                                                                                                               | Oczekiwany Rezultat                                                                                                | Priorytet |
| -------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------- |
| TC_PROJ_NEW_01 | Pomyślne stworzenie nowego projektu z wymaganymi danymi               | 1. Zaloguj się do aplikacji. 2. Przejdź do listy projektów. 3. Kliknij "Dodaj projekt". 4. Wypełnij nazwę projektu. 5. Kliknij "Zapisz".                                          | Projekt zostaje stworzony i pojawia się na liście projektów. Użytkownik może zostać przekierowany do widoku projektu. | Wysoki    |
| TC_PROJ_NEW_02 | Próba stworzenia projektu bez podania nazwy (pole wymagane)          | 1. Zaloguj się do aplikacji. 2. Przejdź do listy projektów. 3. Kliknij "Dodaj projekt". 4. Pozostaw pole nazwy puste. 5. Kliknij "Zapisz".                                           | Komunikat błędu walidacji przy polu nazwy. Projekt nie zostaje stworzony.                                            | Średni    |

### 4.4. Dodawanie Planu do Projektu
| ID Scenariusza | Opis                                                                 | Kroki Testowe                                                                                                                                                                      | Oczekiwany Rezultat                                                                                             | Priorytet |
| -------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------- |
| TC_PLAN_NEW_01 | Pomyślne dodanie nowego planu do istniejącego projektu               | 1. Zaloguj się i przejdź do widoku istniejącego projektu. 2. Przejdź do sekcji "Plany". 3. Kliknij "Dodaj plan". 4. Wypełnij wymagane pola formularza planu. 5. Kliknij "Zapisz".     | Plan zostaje stworzony i pojawia się na liście planów w danym projekcie.                                         | Wysoki    |
| TC_PLAN_NEW_02 | Próba dodania planu z wykorzystaniem generatora AI (jeśli dotyczy)   | 1. Zaloguj się i przejdź do widoku istniejącego projektu. 2. Przejdź do sekcji "Plany". 3. Kliknij "Generuj plan" (lub analogiczna opcja). 4. Podaj dane wejściowe dla AI. 5. Uruchom generowanie. | Plan zostaje wygenerowany na podstawie danych wejściowych i pojawia się na liście planów.                       | Wysoki    |

### 4.5. Testy API (Przykłady)
| ID Scenariusza | Metoda | Endpoint                          | Opis                                                              | Oczekiwany Kod Odpowiedzi | Oczekiwany Body (Fragment) / Nagłówki | Priorytet |
| -------------- | ------ | --------------------------------- | ----------------------------------------------------------------- | ------------------------- | --------------------------------------- | --------- |
| TC_API_PROJ_01 | GET    | `/api/projects`                   | Pobranie listy projektów (dla zalogowanego użytkownika)           | 200 OK                    | Lista projektów w formacie JSON         | Wysoki    |
| TC_API_PROJ_02 | POST   | `/api/projects`                   | Stworzenie nowego projektu z poprawnymi danymi                    | 201 Created               | Dane stworzonego projektu               | Wysoki    |
| TC_API_PROJ_03 | POST   | `/api/projects`                   | Próba stworzenia projektu z niepoprawnymi danymi (błąd walidacji) | 400 Bad Request           | Komunikat błędu walidacji             | Wysoki    |
| TC_API_PROJ_04 | GET    | `/api/projects/{projectId}`       | Pobranie istniejącego projektu                                    | 200 OK                    | Dane projektu                           | Wysoki    |
| TC_API_PROJ_05 | GET    | `/api/projects/{nonExistentId}`   | Próba pobrania nieistniejącego projektu                           | 404 Not Found             |                                         | Wysoki    |
| TC_API_PROJ_06 | PUT    | `/api/projects/{projectId}`       | Aktualizacja istniejącego projektu                                | 200 OK                    | Zaktualizowane dane projektu            | Wysoki    |
| TC_API_PROJ_07 | DELETE | `/api/projects/{projectId}`       | Usunięcie istniejącego projektu                                   | 204 No Content            |                                         | Wysoki    |
| TC_API_PLAN_01 | GET    | `/api/projects/{projectId}/plans` | Pobranie listy planów dla projektu                                | 200 OK                    | Lista planów dla projektu               | Wysoki    |

## 5. Środowisko Testowe

*   **Środowisko Deweloperskie (Lokalne):**
    *   Opis: Lokalne maszyny deweloperów.
    *   Cel: Testy jednostkowe, wczesne testy integracyjne, debugowanie.
    *   Konfiguracja: Zbliżona do produkcyjnej, Supabase lokalnie (jeśli możliwe) lub dedykowana instancja deweloperska Supabase, mockowane API Openrouter.
*   **Środowisko Testowe/Staging:**
    *   Opis: Dedykowany serwer (np. DigitalOcean) z konfiguracją jak najbardziej zbliżoną do produkcyjnej.
    *   Cel: Główne miejsce przeprowadzania testów integracyjnych, E2E, API, wydajnościowych, UAT.
    *   Konfiguracja: Dedykowana instancja Supabase, dostęp do (być może ograniczonego lub testowego) API Openrouter.ai.
*   **Środowisko Produkcyjne:**
    *   Opis: Rzeczywiste środowisko, na którym działa aplikacja dla użytkowników końcowych.
    *   Cel: Testy dymne (smoke tests) po wdrożeniu, monitorowanie.
    *   Konfiguracja: Pełna infrastruktura produkcyjna.

## 6. Narzędzia do Testowania

*   **Frameworki do testów jednostkowych i integracyjnych JS/TS:** Vitest (preferowany) lub Jest.
*   **Biblioteka do testowania komponentów React:** React Testing Library.
*   **Framework do testów E2E:** Playwright (preferowany) lub Cypress.
*   **Testowanie API:** Postman, Insomnia, lub biblioteki HTTP (np. Supertest, `fetch` w testach).
*   **Testy Wydajnościowe:** Google Lighthouse, WebPageTest, k6.
*   **Testy Dostępności:** axe DevTools, Lighthouse.
*   **Testy Wizualnej Regresji:** Rozważenie narzędzi takich jak Percy, Applitools (zależne od budżetu i potrzeb).
*   **Zarządzanie Testami i Błędami:** JIRA, TestRail, Xray (lub prostsze rozwiązania jak GitHub Issues z etykietami).
*   **CI/CD:** GitHub Actions (do automatyzacji uruchamiania testów).
*   **Mockowanie:** Biblioteki do mockowania (np. wbudowane w Vitest/Jest, `msw` - Mock Service Worker).

## 7. Harmonogram Testów

(Przykładowy, do dostosowania do cyklu życia projektu i sprintów)

*   **Faza 1: Planowanie i przygotowanie testów** (Tydzień X)
    *   Finalizacja planu testów.
    *   Przygotowanie środowisk testowych.
    *   Konfiguracja narzędzi.
    *   Tworzenie początkowych przypadków testowych.
*   **Faza 2: Realizacja Testów (równolegle z developmentem, iteracyjnie)**
    *   **Sprint 1-N:**
        *   Testy jednostkowe i integracyjne dla nowych funkcjonalności (ciągłe).
        *   Testy API dla nowych endpointów (po implementacji).
        *   Testy E2E dla zrealizowanych przepływów użytkownika (pod koniec sprintu).
        *   Testy regresji (automatyczne i manualne).
*   **Faza 3: Testy Systemowe i Akceptacyjne (przed wydaniem)** (Tydzień Y-Z)
    *   Pełne testy regresji.
    *   Testy wydajnościowe.
    *   Testy bezpieczeństwa.
    *   Testy użyteczności i dostępności.
    *   UAT (User Acceptance Tests) z udziałem klienta/product ownera.
*   **Faza 4: Testy Po-Wdrożeniowe** (Po każdym wdrożeniu)
    *   Testy dymne (smoke tests) na środowisku produkcyjnym.

## 8. Kryteria Akceptacji Testów

### 8.1. Kryteria Wejścia (Rozpoczęcia Testów):

*   Dostępny plan testów.
*   Przygotowane środowisko testowe.
*   Funkcjonalności do testowania są zaimplementowane i wdrożone na środowisku testowym.
*   Dostępna dokumentacja (wymagania, specyfikacje API).
*   Zakończone testy jednostkowe i integracyjne przez deweloperów (dla danej funkcjonalności).

### 8.2. Kryteria Wyjścia (Zakończenia Testów):

*   Wykonano wszystkie zaplanowane przypadki testowe dla danego etapu/wydania.
*   Osiągnięto zdefiniowane pokrycie testami (np. XX% pokrycia kodu testami jednostkowymi, 100% pokrycia kluczowych scenariuszy E2E).
*   Wszystkie krytyczne i wysokie błędy zostały naprawione i retestowane pozytywnie.
*   Liczba otwartych błędów o niższym priorytecie jest na akceptowalnym poziomie (zgodnie z ustaleniami z zespołem/klientem).
*   Raport z testów został przygotowany i zaakceptowany.
*   Spełnione kryteria wydajnościowe i bezpieczeństwa (jeśli dotyczy danego etapu).

## 9. Role i Odpowiedzialności w Procesie Testowania

*   **Inżynier QA / Tester:**
    *   Tworzenie i aktualizacja planu testów.
    *   Projektowanie i wykonywanie przypadków testowych (manualnych i automatycznych).
    *   Raportowanie i śledzenie błędów.
    *   Przygotowywanie raportów z testów.
    *   Współpraca z deweloperami i analitykami.
    *   Utrzymanie i rozwój automatyzacji testów.
*   **Deweloperzy:**
    *   Pisanie testów jednostkowych i integracyjnych dla swojego kodu.
    *   Naprawa błędów zgłoszonych przez QA.
    *   Wsparcie QA w analizie problemów.
    *   Dbanie o testowalność kodu.
*   **Product Owner / Analityk Biznesowy:**
    *   Dostarczanie wymagań i kryteriów akceptacji.
    *   Udział w testach akceptacyjnych (UAT).
    *   Priorytetyzacja błędów.
*   **DevOps / Administrator Systemu:**
    *   Przygotowanie i utrzymanie środowisk testowych.
    *   Wsparcie w konfiguracji narzędzi CI/CD do automatyzacji testów.

## 10. Procedury Raportowania Błędów

*   **Narzędzie:** JIRA, GitHub Issues lub inne dedykowane narzędzie.
*   **Proces zgłaszania błędu:**
    1.  Sprawdzenie, czy błąd nie został już zgłoszony.
    2.  Stworzenie nowego zgłoszenia błędu.
*   **Elementy zgłoszenia błędu:**
    *   **Tytuł:** Krótki, zwięzły opis problemu.
    *   **ID Błędu:** (nadawane automatycznie przez system).
    *   **Środowisko:** Na którym wystąpił błąd (np. Test, Staging, wersja przeglądarki).
    *   **Wersja Aplikacji/Build:** Wersja oprogramowania, w której znaleziono błąd.
    *   **Kroki do Reprodukcji:** Szczegółowy opis kroków prowadzących do wystąpienia błędu.
    *   **Obserwowany Rezultat:** Co faktycznie się stało.
    *   **Oczekiwany Rezultat:** Co powinno się stać.
    *   **Priorytet:** (np. Krytyczny, Wysoki, Średni, Niski) - wpływ błędu na system i użytkownika.
    *   **Stopień Ważności/Severity:** (np. Krytyczny, Poważny, Drobny, Kosmetyczny) - techniczny aspekt błędu.
    *   **Załączniki:** Screenshoty, logi, nagrania wideo.
    *   **Zgłaszający:** Osoba, która znalazła błąd.
    *   **Przypisany do:** (początkowo może być puste lub przypisane do lidera zespołu QA/Dev).
*   **Cykl życia błędu:**
    *   Nowy -> Otwarty -> W Analizie -> W Realizacji (Naprawa) -> Gotowy do Testów -> Retest -> Zamknięty / Ponownie Otwarty.
*   **Regularne spotkania dotyczące statusu błędów.** 