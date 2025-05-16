# Plan wdrożenia GitHub Actions z GitHub Pages dla projektu CityHooper

## 1. Cele CI/CD

- Automatyzacja procesu testowania i budowania aplikacji
- Zapewnienie spójności kodu poprzez linting i testy
- Automatyczne wdrażanie na GitHub Pages po zatwierdzeniu zmian w głównej gałęzi

## 2. Struktura plików

```
.github/
  workflows/
    ci.yml       # Workflow dla testów i lintingu
    deploy.yml   # Workflow dla wdrażania na GitHub Pages
```

## 3. Workflow Integracji Ciągłej (ci.yml)

```yaml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Run linters
        run: npm run lint

  test:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
```

## 4. Workflow Wdrożeniowy na GitHub Pages (deploy.yml)

```yaml
name: Deploy to GitHub Pages

on:
  # Uruchamia workflow przy każdym push do gałęzi main
  push:
    branches: [ main ]
  # Pozwala na ręczne uruchomienie workflow z zakładki Actions
  workflow_dispatch:

# Pozwala odpowiednim jobom na klonowanie repozytorium i tworzenie deployment
permissions:
  contents: read
  pages: write
  id-token: write

# Pozwala na jedno równoczesne wdrożenie
concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Build with Astro
        run: npm run build
      - name: Setup Pages
        uses: actions/configure-pages@v4
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

## 5. Konfiguracja projektu dla GitHub Pages

### Aktualizacja pliku astro.config.mjs

Należy dostosować plik `astro.config.mjs` aby działał poprawnie z GitHub Pages:

```js
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://NAZWA_UŻYTKOWNIKA.github.io',
  base: '/NAZWA_REPOZYTORIUM', // Usuń tę linijkę jeśli używasz własnej domeny
  integrations: [react(), tailwind()],
  output: 'static', // Upewnij się, że generowany jest statyczny output
});
```

### Dodanie pliku .nojekyll

GitHub Pages domyślnie używa Jekyll do przetwarzania stron. Aby wyłączyć to zachowanie, należy utworzyć pusty plik `.nojekyll` w katalogu `public/`:

```bash
touch public/.nojekyll
```

## 6. Plan wdrożenia

1. **Przygotowanie środowiska lokalnego**:
   - Upewnij się, że projekt zawiera skrypty `lint`, `test` i `build` w `package.json`
   - Upewnij się, że projekt posiada odpowiednie testy
   - Dostosuj plik `astro.config.mjs` zgodnie z powyższym przykładem

2. **Utworzenie plików konfiguracyjnych**:
   - Utwórz strukturę katalogów `.github/workflows/`
   - Utwórz pliki `ci.yml` i `deploy.yml` z powyższą konfiguracją
   - Dodaj pusty plik `.nojekyll` w katalogu `public/`

3. **Włączenie GitHub Pages w repozytorium**:
   - Przejdź do ustawień repozytorium na GitHub
   - W sekcji "Pages" wybierz źródło "GitHub Actions"

4. **Wdrożenie i testowanie**:
   - Wykonaj push do gałęzi `main`
   - Monitoruj wykonanie workflow w zakładce Actions w GitHub
   - Sprawdź czy strona została poprawnie wdrożona pod adresem `https://NAZWA_UŻYTKOWNIKA.github.io/NAZWA_REPOZYTORIUM`

5. **Opcjonalnie: Konfiguracja własnej domeny**:
   - W ustawieniach GitHub Pages podaj własną domenę
   - Skonfiguruj rekordy DNS u swojego dostawcy domeny zgodnie z instrukcjami GitHub
   - Pamiętaj o usunięciu parametru `base` z pliku `astro.config.mjs` jeśli używasz własnej domeny

## 7. Ograniczenia i uwagi

1. **Aplikacje statyczne vs SSR**:
   - GitHub Pages obsługuje tylko statyczne pliki HTML, CSS i JavaScript
   - Jeśli aplikacja korzysta z renderowania po stronie serwera (SSR), konieczne będzie zmodyfikowanie jej do generowania statycznych plików

2. **Integracja z backendem**:
   - Dla funkcji wymagających backendu (np. integracja z Supabase) należy korzystać z API dostępnych z poziomu przeglądarki
   - Sekrety i dane wrażliwe powinny być obsługiwane przez bezpieczne API, nie przez GitHub Pages

3. **Limity GitHub Pages**:
   - Rozmiar strony jest ograniczony do 1 GB
   - Miesięczny limit transferu wynosi 100 GB
   - Czas budowy strony jest ograniczony do 10 minut 