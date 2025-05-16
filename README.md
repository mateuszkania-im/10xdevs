# City Hooper

AI-powered travel planning application that transforms your travel notes into detailed trip itineraries.

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Testing](#testing)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)
- [Wdrażanie na GitHub Pages](#wdrazanie-na-github-pages)

## Project Description

City Hooper is a mobile and web application designed to simplify the process of planning engaging and interesting trips. Using artificial intelligence capabilities, the application allows users to transform simple notes about places and travel destinations into detailed travel plans.

### Key Features

- Create and manage travel projects
- Save and organize notes within projects
- Generate detailed travel plans based on user notes with AI
- Create alternative versions of travel plans
- Export plans to PDF format

The application is designed as a Minimum Viable Product (MVP) that focuses on key functionalities enabling users to effectively plan trips using AI.

## Tech Stack

### Frontend

- **Astro 5**: For building fast, efficient pages and applications with minimal JavaScript
- **React 19**: For interactive components where needed
- **TypeScript 5**: For static typing and better IDE support
- **Tailwind 4**: For convenient application styling
- **Shadcn/ui**: Library of accessible React components for UI
- **AcertenityUI**: Library of interactive components enhancing the application

### Backend

- **Supabase**: Comprehensive backend solution providing:
  - PostgreSQL database
  - SDK in multiple languages, serving as Backend-as-a-Service
  - Built-in user authentication
  - Open-source solution that can be hosted locally or on your own server

### AI Integration

- **Openrouter.ai**: Communication with AI models providing:
  - Access to a wide range of models (OpenAI, Anthropic, Google, etc.)
  - Financial limit settings for API keys

### CI/CD and Hosting

- **Github Actions**: For CI/CD pipeline creation
- **DigitalOcean**: For application hosting via docker image

## Getting Started Locally

### Prerequisites

- Node.js (v22.14.0) - we recommend using [nvm](https://github.com/nvm-sh/nvm) to manage Node.js versions
- Git

### Installation

1. Clone the repository

   ```
   git clone https://github.com/yourusername/cityhopper.git
   cd cityhopper
   ```

2. Install the correct Node.js version using nvm

   ```
   nvm use
   ```

3. Install dependencies

   ```
   npm install
   ```

4. Configure environment variables
   Create a `.env` file in the project root with necessary Supabase and OpenRouter credentials:

   ```
   PUBLIC_SUPABASE_URL=your_supabase_url
   PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   OPENROUTER_API_KEY=your_openrouter_api_key
   ```

5. Start the development server

   ```
   npm run dev
   ```

6. Open your browser and navigate to `http://localhost:4321`

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the project for production
- `npm run preview` - Preview the production build locally
- `npm run astro` - Run Astro CLI commands
- `npm run lint` - Run ESLint to check code quality
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run format` - Format code with Prettier

## Testing

The application uses Playwright for end-to-end testing. Current test coverage includes:

### Authentication Tests

- `tests/auth-login.spec.ts` - Tests the user login flow with a test account (pies@pies.pl), verifying successful login and redirect to the projects page.

### Notes Management Tests

- `tests/note-add.spec.ts` - Tests the note creation process after user login, including accessing a project and adding a new note with title and content.

To run the tests, use:

```
npx playwright test
```

## Project Scope

### In MVP Scope

- User account system (Supabase Auth)
- Creating and managing travel projects
- Creating, editing, and organizing notes
- Mandatory configuration note for each project
- Generating travel plans using AI (OpenRouter)
- Generating alternative plan versions
- Exporting plans to PDF
- Responsive user interface

### Out of MVP Scope

- Sharing plans between users
- Multimedia management (place photos)
- Advanced logistics planning
- Extensive user onboarding
- Interface personalization
- Rich multimedia handling and analysis
- Advanced time planning and logistics

## Project Status

This project is currently in the MVP development phase.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Wdrażanie na GitHub Pages

Projekt został skonfigurowany do automatycznego wdrażania na GitHub Pages za pomocą GitHub Actions. Wdrożenie obsługuje zarówno statyczną wersję frontendu, jak i integrację z Supabase jako backendem.

### Konfiguracja GitHub Pages

1. **Włącz GitHub Pages w ustawieniach repozytorium**:
   - Przejdź do "Settings" > "Pages"
   - W sekcji "Build and deployment" wybierz "GitHub Actions" jako źródło

2. **Dodaj wymagane sekrety** w ustawieniach repozytorium:
   - Przejdź do "Settings" > "Secrets and variables" > "Actions"
   - Dodaj następujące sekrety:
     - `SUPABASE_URL` - URL projektu Supabase
     - `SUPABASE_ANON_KEY` - Anonimowy klucz API Supabase

3. **Skonfiguruj URL przekierowania w Supabase**:
   - Przejdź do panelu Supabase, sekcja "Authentication" > "URL Configuration"
   - Dodaj następujące URL do "Redirect URLs":
     - `https://[TWOJA-NAZWA-UŻYTKOWNIKA].github.io/CityHooper/auth/callback`
   - Jeśli używasz OAuth, zaktualizuj również URL przekierowania w ustawieniach dostawcy OAuth

### Workflow GitHub Actions

Projekt zawiera dwa główne workflow:

1. **Deploy to GitHub Pages** (`.github/workflows/deploy.yml`):
   - Uruchamiany automatycznie przy każdym push do gałęzi `main`
   - Konwertuje aplikację serwerową na statyczną wersję dla GitHub Pages
   - Konfiguruje zmienne środowiskowe dla Supabase
   - Wdraża zbudowaną aplikację na GitHub Pages

2. **PR Validation** (`.github/workflows/pr-check.yml`):
   - Sprawdza poprawność pull requestów przed mergem do `main`
   - Uruchamia testy, linting i weryfikuje połączenie z Supabase
   - Zapobiega mergowaniu kodu, który nie przechodzi testów

### Ochrona gałęzi main

Aby zabezpieczyć główną gałąź:

1. Przejdź do "Settings" > "Branches"
2. W sekcji "Branch protection rules", kliknij "Add rule"
3. W polu "Branch name pattern" wpisz `main`
4. Zaznacz opcje:
   - "Require a pull request before merging"
   - "Require status checks to pass before merging"
   - W "Status checks that are required" wyszukaj i wybierz "build-test"
5. Kliknij "Save changes"

### Jak działa integracja z Supabase na GitHub Pages

Ponieważ GitHub Pages hostuje tylko statyczne pliki, integracja z Supabase działa w następujący sposób:

1. **Autentykacja** - Używamy flow PKCE dla bezpiecznej autentykacji
2. **Przekierowania** - Dynamicznie ustawiamy URL przekierowania z uwzględnieniem basePath
3. **API Calls** - Wszystkie wywołania API do Supabase są wykonywane bezpośrednio z przeglądarki klienta

### Lokalne testowanie konfiguracji GitHub Pages

Możesz przetestować konfigurację GitHub Pages lokalnie:

```bash
# Zasymuluj środowisko GitHub Pages
export GITHUB_PAGES=true
export BASE_PATH=/CityHooper
npm run build
npm run preview
```

### Debugowanie problemów

Jeśli napotkasz problemy z wdrożeniem:

1. **Sprawdź logi w GitHub Actions** - Przejdź do zakładki "Actions" i zbadaj logi z nieudanego wdrożenia
2. **Problemy z Supabase** - Upewnij się, że URL przekierowania są poprawne i że sekrety są prawidłowo skonfigurowane
3. **Problemy z asset paths** - Jeśli zasoby nie są ładowane, sprawdź czy basePath jest poprawnie skonfigurowany
4. **Cookie/Storage issues** - GitHub Pages działa na innej domenie, więc upewnij się, że sesje są poprawnie obsługiwane
