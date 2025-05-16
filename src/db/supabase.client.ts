import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

// Pobierz URL i klucz API z zmiennych środowiskowych
// Przed użyciem upewnij się, że te zmienne są zdefiniowane w pliku .env
// Nie używaj nieprawidłowych domyślnych wartości
const supabaseUrl = import.meta.env.NEXT_PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

// Sprawdź czy zmienne środowiskowe są zdefiniowane
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Brakujące zmienne środowiskowe Supabase. Sprawdź plik .env!");
}

// Sprawdź czy jesteśmy w środowisku przeglądarki
const isBrowser = typeof window !== "undefined";

// Tworzymy storage dostosowany do środowiska (przeglądarka vs SSR)
const customStorage = {
  getItem: (key: string): string | null => {
    if (!isBrowser) return null;
    const matches = document.cookie.match(new RegExp(`(^| )${key}=([^;]+)`));
    return matches ? decodeURIComponent(matches[2]) : null;
  },
  setItem: (key: string, value: string): void => {
    if (!isBrowser) return;
    const maxAge = 60 * 60 * 24 * 7; // 7 dni
    document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax; ${window.location.protocol === "https:" ? "Secure;" : ""}`;
  },
  removeItem: (key: string): void => {
    if (!isBrowser) return;
    document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  },
};

// Tworzymy klienta z odpowiednimi opcjami dla obsługi sesji
export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Używamy ciasteczek zamiast localStorage dla lepszego bezpieczeństwa
    storage: customStorage,
  },
});
