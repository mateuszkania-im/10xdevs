# Dokument wymagań produktu (PRD) - VibeTravels

## 1. Przegląd produktu

VibeTravels to aplikacja mobilna i webowa, której głównym celem jest ułatwienie planowania angażujących i ciekawych wycieczek. Wykorzystując możliwości sztucznej inteligencji, aplikacja pozwala użytkownikom na przekształcanie prostych notatek o miejscach i celach podróży w szczegółowe plany podróży.

Główne funkcje aplikacji obejmują:

- Tworzenie i zarządzanie projektami podróży
- Zapisywanie i organizowanie notatek w ramach projektów
- Generowanie szczegółowych planów podróży w oparciu o notatki użytkownika
- Tworzenie alternatywnych wersji planów podróży
- Eksport planów do formatu PDF

Aplikacja została zaprojektowana jako minimalna wersja produktu (MVP), która koncentruje się na kluczowych funkcjonalnościach umożliwiających użytkownikom skuteczne planowanie podróży z wykorzystaniem AI.

## 2. Problem użytkownika

Planowanie angażujących i interesujących wycieczek jest trudne i czasochłonne. Użytkownicy często napotykają na następujące problemy:

- Trudności w organizacji luźnych pomysłów i notatek dotyczących miejsc do odwiedzenia
- Brak umiejętności lub czasu na przekształcenie zebranych informacji w spójny plan podróży
- Niepewność co do tego, jak optymalnie zaplanować czas podczas wycieczki
- Trudności w uwzględnieniu wszystkich istotnych szczegółów podczas planowania

VibeTravels rozwiązuje te problemy poprzez:

- Dostarczenie intuicyjnego narzędzia do organizowania notatek związanych z podróżą
- Wykorzystanie sztucznej inteligencji do przekształcania zebranych notatek w szczegółowe, spersonalizowane plany podróży
- Oferowanie możliwości tworzenia alternatywnych planów, umożliwiając użytkownikom wybór najlepszej opcji

## 3. Wymagania funkcjonalne

### 3.1 System kont użytkowników

- Autentykacja użytkowników z wykorzystaniem Supabase Auth
- Rejestracja nowych użytkowników
- Logowanie istniejących użytkowników
- Odzyskiwanie dostępu do konta

### 3.2 Zarządzanie projektami podróży

- Tworzenie nowych projektów podróży
- Edycja istniejących projektów
- Usuwanie projektów
- Przeglądanie listy projektów
- Filtrowanie i sortowanie projektów

### 3.3 Zarządzanie notatkami

- Hierarchiczna struktura: Użytkownik → Projekty podróży → Notatki
- Tworzenie nowych notatek w ramach projektu
- Edycja i usuwanie notatek
- Kategoryzowanie notatek za pomocą tagów
- Określanie priorytetów notatek (miejsca obowiązkowe vs opcjonalne)
- Drag-and-drop do organizowania notatek

### 3.4 Obowiązkowa notatka konfiguracyjna

- Każdy projekt musi zawierać notatkę konfiguracyjną
- Notatka konfiguracyjna zawiera:
  - Daty przyjazdu/wyjazdu
  - Liczbę dni
  - Liczbę osób
- Wyraźne oznaczenie notatki konfiguracyjnej jako wymaganej
- Walidacja poprawności danych w notatce konfiguracyjnej

### 3.5 Generowanie planów podróży

- Przycisk "Generuj plan" dostępny tylko gdy istnieje obowiązkowa notatka konfiguracyjna
- Wykorzystanie OpenRouter do integracji z AI
- Inteligentny prompt konwertujący notatki na plan podróży
- Możliwość generowania alternatywnych planów z tych samych notatek
- Oznaczenie planów wersjami (Plan A, Plan B, itp.)

### 3.6 Format planu podróży

- Struktura dzień po dniu
- Harmonogram dla każdego dnia z sugerowanymi:
  - Aktywnościami
  - Atrakcjami
  - Posiłkami
- Krótkie uzasadnienie dla każdego elementu planu

### 3.7 Edycja i eksport planu

- Możliwość ręcznej modyfikacji wygenerowanego planu
- Funkcja eksportu do PDF (przycisk "Eksportuj do PDF")
- Opcja porównania różnych wersji planów

### 3.8 Interfejs użytkownika

- Responsywny design działający na urządzeniach mobilnych i desktopowych
- Wykorzystanie Tailwind i shadcn dla spójnego designu
- Minimalistyczny interfejs zgodny z założeniami MVP
- Intuicyjna nawigacja i przejrzysta hierarchia informacji

### 3.9 Główne widoki

- Lista projektów podróży
- Widok projektu z notatkami (z możliwością drag-and-drop)
- Edytor notatek
- Widok wygenerowanego planu

## 4. Granice produktu

### 4.1 W zakresie MVP

- System kont użytkowników (Supabase Auth)
- Tworzenie i zarządzanie projektami podróży
- Tworzenie, edycja i organizowanie notatek
- Obowiązkowa notatka konfiguracyjna dla każdego projektu
- Generowanie planów podróży przy użyciu AI (OpenRouter)
- Generowanie alternatywnych wersji planów
- Eksport planów do PDF
- Responsywny interfejs użytkownika

### 4.2 Poza zakresem MVP

- Współdzielenie planów między użytkownikami
- Zarządzanie multimediami (zdjęcia miejsc)
- Zaawansowane planowanie logistyki
- Rozbudowany onboarding użytkowników
- Personalizacja interfejsu
- Bogata obsługa i analiza multimediów
- Zaawansowane planowanie czasu i logistyki

## 5. Historyjki użytkowników

### Uwierzytelnianie i zarządzanie kontem

#### US-001

- Tytuł: Rejestracja nowego użytkownika
- Opis: Jako nowy użytkownik, chcę utworzyć konto w aplikacji, aby móc korzystać z jej funkcjonalności.
- Kryteria akceptacji:
  1. Użytkownik może wprowadzić adres e-mail i hasło
  2. System waliduje poprawność adresu e-mail i siłę hasła
  3. Po pomyślnej rejestracji, użytkownik otrzymuje powiadomienie o sukcesie
  4. Użytkownik może od razu korzystać z aplikacji po rejestracji

#### US-002

- Tytuł: Logowanie istniejącego użytkownika
- Opis: Jako zarejestrowany użytkownik, chcę zalogować się do swojego konta, aby uzyskać dostęp do moich projektów i notatek.
- Kryteria akceptacji:
  1. Użytkownik może wprowadzić swój adres e-mail i hasło
  2. System weryfikuje poprawność danych logowania
  3. Po pomyślnym logowaniu, użytkownik jest przekierowywany do widoku listy projektów
  4. Jeśli dane logowania są niepoprawne, użytkownik otrzymuje stosowny komunikat

#### US-003

- Tytuł: Odzyskiwanie dostępu do konta
- Opis: Jako użytkownik, który zapomniał hasła, chcę mieć możliwość odzyskania dostępu do konta.
- Kryteria akceptacji:
  1. Użytkownik może zainicjować proces resetowania hasła poprzez podanie adresu e-mail
  2. System wysyła link do resetowania hasła na podany adres e-mail
  3. Użytkownik może ustawić nowe hasło po kliknięciu w link
  4. Po pomyślnym zresetowaniu hasła, użytkownik może zalogować się używając nowego hasła

### Zarządzanie projektami podróży

#### US-004

- Tytuł: Tworzenie nowego projektu podróży
- Opis: Jako użytkownik, chcę utworzyć nowy projekt podróży, aby rozpocząć planowanie wycieczki.
- Kryteria akceptacji:
  1. Użytkownik może utworzyć nowy projekt z poziomu listy projektów
  2. System wymaga podania nazwy projektu
  3. Nowy projekt jest dodawany do listy projektów użytkownika
  4. Po utworzeniu projektu, użytkownik jest przekierowywany do widoku tego projektu

#### US-005

- Tytuł: Przeglądanie listy projektów
- Opis: Jako użytkownik, chcę przeglądać listę moich projektów podróży, aby mieć do nich łatwy dostęp.
- Kryteria akceptacji:
  1. Lista projektów jest wyświetlana po zalogowaniu
  2. Projekty są wyświetlane w formie listy lub siatki
  3. Dla każdego projektu wyświetlana jest jego nazwa
  4. Użytkownik może kliknąć na projekt, aby przejść do jego szczegółów

#### US-006

- Tytuł: Edycja projektu podróży
- Opis: Jako użytkownik, chcę edytować istniejący projekt podróży, aby zaktualizować jego nazwę.
- Kryteria akceptacji:
  1. Użytkownik może edytować nazwę projektu
  2. System zapisuje zmiany po zatwierdzeniu przez użytkownika
  3. Zaktualizowana nazwa projektu jest wyświetlana na liście projektów

#### US-007

- Tytuł: Usuwanie projektu podróży
- Opis: Jako użytkownik, chcę usunąć projekt podróży, którego już nie potrzebuję.
- Kryteria akceptacji:
  1. Użytkownik może usunąć projekt z poziomu listy projektów lub z widoku szczegółów projektu
  2. System wymaga potwierdzenia operacji usuwania
  3. Po usunięciu, projekt znika z listy projektów
  4. Wszystkie notatki i plany związane z projektem są również usuwane

### Zarządzanie notatkami

#### US-008

- Tytuł: Tworzenie notatki konfiguracyjnej
- Opis: Jako użytkownik, chcę utworzyć obowiązkową notatkę konfiguracyjną, aby określić podstawowe parametry mojej podróży.
- Kryteria akceptacji:
  1. System wymaga utworzenia notatki konfiguracyjnej dla każdego projektu
  2. Notatka konfiguracyjna zawiera pola: daty przyjazdu/wyjazdu, liczba dni, liczba osób
  3. System waliduje wprowadzone dane
  4. Notatka konfiguracyjna jest wyraźnie oznaczona jako wymagana

#### US-009

- Tytuł: Tworzenie notatki
- Opis: Jako użytkownik, chcę tworzyć notatki w ramach mojego projektu podróży, aby zapisywać informacje o miejscach i atrakcjach.
- Kryteria akceptacji:
  1. Użytkownik może utworzyć nową notatkę z poziomu widoku projektu
  2. System umożliwia wprowadzenie tytułu i treści notatki
  3. Użytkownik może opcjonalnie dodać tagi/kategorie do notatki
  4. Użytkownik może określić priorytet notatki
  5. Nowa notatka jest dodawana do projektu

#### US-010

- Tytuł: Edycja notatki
- Opis: Jako użytkownik, chcę edytować istniejące notatki, aby aktualizować lub uzupełniać informacje.
- Kryteria akceptacji:
  1. Użytkownik może edytować tytuł, treść, tagi i priorytet notatki
  2. System zapisuje zmiany po zatwierdzeniu przez użytkownika
  3. Zaktualizowane informacje są natychmiast widoczne w widoku projektu

#### US-011

- Tytuł: Usuwanie notatki
- Opis: Jako użytkownik, chcę usuwać notatki, których już nie potrzebuję.
- Kryteria akceptacji:
  1. Użytkownik może usunąć notatkę z poziomu widoku projektu
  2. System wymaga potwierdzenia operacji usuwania
  3. Po usunięciu, notatka znika z widoku projektu

#### US-012

- Tytuł: Organizowanie notatek metodą drag-and-drop
- Opis: Jako użytkownik, chcę móc organizować notatki metodą przeciągnij i upuść, aby uporządkować je według mojego uznania.
- Kryteria akceptacji:
  1. Użytkownik może przeciągać notatki w widoku projektu
  2. Notatki można upuszczać w różnych miejscach interfejsu
  3. System zapisuje nowy układ notatek
  4. Notatki pozostają w zdefiniowanym układzie po ponownym wczytaniu projektu

### Generowanie i zarządzanie planami

#### US-013

- Tytuł: Generowanie planu podróży
- Opis: Jako użytkownik, chcę wygenerować plan podróży na podstawie moich notatek, aby mieć szczegółowy harmonogram wycieczki.
- Kryteria akceptacji:
  1. Przycisk "Generuj plan" jest dostępny tylko gdy istnieje obowiązkowa notatka konfiguracyjna
  2. System wykorzystuje OpenRouter do komunikacji z AI
  3. Generowanie planu uwzględnia wszystkie notatki w projekcie
  4. Wygenerowany plan ma strukturę dzień po dniu
  5. Każdy element planu zawiera krótkie uzasadnienie

#### US-014

- Tytuł: Generowanie alternatywnych wersji planu
- Opis: Jako użytkownik, chcę wygenerować alternatywne wersje planu podróży, aby wybrać najlepszą opcję.
- Kryteria akceptacji:
  1. Użytkownik może wygenerować więcej niż jedną wersję planu
  2. Każda wersja planu jest oznaczona (Plan A, Plan B, itp.)
  3. System przechowuje wszystkie wygenerowane wersje planów
  4. Użytkownik może przeglądać różne wersje planów

#### US-015

- Tytuł: Edycja wygenerowanego planu
- Opis: Jako użytkownik, chcę ręcznie modyfikować wygenerowany plan, aby dostosować go do moich preferencji.
- Kryteria akceptacji:
  1. Użytkownik może edytować treść wygenerowanego planu
  2. System zapisuje zmiany wprowadzone przez użytkownika
  3. Zmodyfikowany plan zastępuje poprzednią wersję lub jest zapisywany jako nowa wersja

#### US-016

- Tytuł: Eksport planu do PDF
- Opis: Jako użytkownik, chcę eksportować plan podróży do pliku PDF, aby mieć do niego dostęp offline.
- Kryteria akceptacji:
  1. W widoku planu dostępny jest przycisk "Eksportuj do PDF"
  2. System generuje plik PDF zawierający plan podróży
  3. Użytkownik może pobrać wygenerowany plik PDF
  4. Plik PDF zawiera wszystkie informacje z planu w czytelnym formacie

#### US-017

- Tytuł: Porównanie różnych wersji planów
- Opis: Jako użytkownik, chcę porównać różne wersje planów, aby wybrać najlepszą opcję.
- Kryteria akceptacji:
  1. System umożliwia wyświetlenie dwóch wersji planów obok siebie
  2. Użytkownik może przełączać się między różnymi wersjami planów
  3. System wyraźnie oznacza różnice między wersjami planów

### Interfejs użytkownika

#### US-018

- Tytuł: Przeglądanie aplikacji na urządzeniach mobilnych
- Opis: Jako użytkownik mobilny, chcę korzystać z aplikacji na moim smartfonie lub tablecie.
- Kryteria akceptacji:
  1. Interfejs aplikacji jest responsywny i dostosowuje się do różnych rozmiarów ekranów
  2. Wszystkie funkcje są dostępne na urządzeniach mobilnych
  3. Interfejs na urządzeniach mobilnych zachowuje intuicyjność i łatwość użycia

#### US-019

- Tytuł: Nawigacja między widokami
- Opis: Jako użytkownik, chcę łatwo nawigować między różnymi widokami aplikacji.
- Kryteria akceptacji:
  1. Aplikacja posiada spójny system nawigacji
  2. Użytkownik może przechodzić między listą projektów, widokiem projektu, edytorem notatek i widokiem planu
  3. System zapamiętuje poprzedni widok i umożliwia powrót do niego

## 6. Metryki sukcesu

Sukces MVP będzie mierzony na podstawie następujących wskaźników:

1. Zaangażowanie użytkowników:
   - 90% użytkowników posiada wypełnione notatki konfiguracyjne w swoich projektach
   - 75% użytkowników generuje 3 lub więcej planów wycieczek na rok
2. Skuteczność generowania planów:
   - 80% wygenerowanych planów nie wymaga istotnych modyfikacji ze strony użytkownika
   - 70% użytkowników generuje alternatywne wersje planów dla przynajmniej jednego projektu
3. Satysfakcja użytkowników:
   - 85% użytkowników ocenia wygenerowane plany jako przydatne
   - 80% użytkowników powraca do aplikacji przy planowaniu kolejnej podróży
4. Techniczne wskaźniki wydajności:
   - Średni czas generowania planu poniżej 15 sekund
   - Wskaźnik błędów podczas generowania planów poniżej 5%
   - Dostępność aplikacji na poziomie 99,5%
