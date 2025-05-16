// @ts-check
import { defineConfig } from "astro/config";
import process from "node:process";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import node from "@astrojs/node";
import vercel from "@astrojs/vercel";

// Te zmienne będą przekazywane przez GitHub Actions do procesu budowania
// lub mogą być zdefiniowane w pliku .env dla lokalnego developmentu (z prefiksem VITE_)
// Korzystamy z process.env, ponieważ w fazie konfiguracji Astro `import.meta.env` nie zawiera jeszcze zmiennych bez prefiksu.
const IS_VERCEL = Boolean(process.env.VERCEL);

const GITHUB_USER = import.meta.env.VITE_GITHUB_USER || "mateuszkania-im"; // Domyślna wartość dla lokalnego dev
const REPO_NAME = import.meta.env.VITE_REPO_NAME || "10xdevs"; // Domyślna wartość dla lokalnego dev

const SITE_URL = import.meta.env.VITE_SITE_URL || `https://${GITHUB_USER}.vercel.app`;
const BASE_PATH = ""; // Vercel serwuje z root-a

// https://astro.build/config
export default defineConfig({
  output: "server",
  site: SITE_URL,
  base: BASE_PATH,
  integrations: [react(), sitemap()],
  server: { port: 3000 },
  vite: {
    plugins: [tailwindcss()],
    envPrefix: ["VITE_", "PUBLIC_"], // Upewnij się, że VITE_ jest dozwolonym prefiksem
    define: {
      // Zmienne przekazywane do kodu klienta muszą być jawnie zdefiniowane
      // Odczytujemy je z import.meta.env, które Vite wypełni na podstawie .env lub zmiennych przekazanych do build
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(import.meta.env.VITE_SUPABASE_URL),
      "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(import.meta.env.VITE_SUPABASE_ANON_KEY),
      "import.meta.env.VITE_BASE_PATH": JSON.stringify(BASE_PATH),
      "import.meta.env.VERCEL": JSON.stringify(IS_VERCEL),
      "import.meta.env.VITE_GITHUB_USER": JSON.stringify(GITHUB_USER),
      "import.meta.env.VITE_REPO_NAME": JSON.stringify(REPO_NAME),
    },
  },
  adapter: IS_VERCEL ? vercel() : node({ mode: "standalone" }),
  // Włącz sesje tylko lokalnie (Node adapter ma domyślny driver fs)
  ...(IS_VERCEL ? {} : { experimental: { session: true } }),
});
