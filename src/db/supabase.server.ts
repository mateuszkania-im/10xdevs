import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

// W Astro zmienne środowiskowe po stronie serwera są dostępne przez:
// 1. import.meta.env w SSR komponentach
// 2. process.env w middleware i endpoints API

// Zmienne środowiskowe pobierane z process.env dla kodu serwerowego
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL || "https://localhost.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQ0NDMyMjAxLCJleHAiOjE5NjAwMDgyMDF9.jjPz4H5xxn0EGX-HzW6OEjQ_5WhAFKH3FV1g5xcPj7g";

// Sprawdź czy zmienne środowiskowe są zdefiniowane
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Brakujące zmienne środowiskowe Supabase. Sprawdź plik .env!");
}

// Utwórz klienta z domyślnymi lub rzeczywistymi wartościami
export const supabaseServer = createClient<Database>(supabaseUrl, supabaseAnonKey);

/**
 * Tworzy klienta Supabase z niestandardowym tokenem dostępu.
 * Przydatne dla uwierzytelnionych zapytań po stronie serwera.
 *
 * @param accessToken Token dostępu do użycia w zapytaniach do Supabase
 * @returns Klient Supabase z ustawionym tokenem dostępu
 */
export function createServerClientWithToken(accessToken: string): SupabaseClient<Database> {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    },
  });
}
