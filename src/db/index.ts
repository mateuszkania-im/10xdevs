/**
 * Plik indeksowy dla modułu db, eksportujący funkcje i typy związane z bazą danych
 */

import type { Database } from "./database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

// Przechowujemy instancje klientów
let _supabaseClient: SupabaseClient<Database> | null = null;
let _supabaseServer: SupabaseClient<Database> | null = null;

/**
 * Funkcja tworząca klienta Supabase
 * Decyduje czy używać klienta po stronie serwera czy klienta, w zależności od środowiska
 * @param accessToken Opcjonalny token dostępu do wykorzystania w środowisku serwerowym
 */
export async function createClient(accessToken?: string): Promise<SupabaseClient<Database>> {
  // W środowisku przeglądarki używamy klienta, w przeciwnym razie używamy serwera
  if (typeof window !== "undefined") {
    // Lazy-loading klienta przeglądarki
    if (!_supabaseClient) {
      // Używamy dynamicznego importu ESM zamiast require
      const moduleClient = await import("./supabase.client");
      _supabaseClient = moduleClient.supabaseClient;
    }
    return _supabaseClient;
  }

  // W przypadku środowiska serwerowego, sprawdzamy czy potrzebujemy utworzyć nowego klienta z tokenem
  if (accessToken) {
    // Dynamicznie importujemy moduł serwerowy
    const moduleServer = await import("./supabase.server");
    // Tworzymy nowego klienta z tokenem dostępu
    return moduleServer.createServerClientWithToken(accessToken);
  }

  // Lazy-loading standardowego klienta serwerowego bez tokenu
  if (!_supabaseServer) {
    // Używamy dynamicznego importu ESM zamiast require
    const moduleServer = await import("./supabase.server");
    _supabaseServer = moduleServer.supabaseServer;
  }
  return _supabaseServer;
}

// Dla kompatybilności wstecznej - synchroniczna wersja, która zwraca istniejącego klienta
// lub tworzy nowego w sposób nieasynchroniczny (tylko w środowisku przeglądarki)
export function createClientSync(): SupabaseClient<Database> {
  // Sprawdź czy jesteśmy w przeglądarce
  if (typeof window !== "undefined") {
    if (!_supabaseClient) {
      // Importuj bezpośrednio klienta (powinien być już zaimportowany wcześniej)
      try {
        // @ts-ignore - Astro obsługuje import.meta.glob
        const modules = import.meta.glob("./supabase.client.ts", { eager: true });
        _supabaseClient = modules["./supabase.client.ts"].supabaseClient;
      } catch (err) {
        console.error("Błąd podczas importowania klienta Supabase:", err);
        throw new Error("Nie można zainicjalizować klienta Supabase. Odśwież stronę i spróbuj ponownie.");
      }
    }
    return _supabaseClient;
  }

  throw new Error("createClientSync może być używane tylko w środowisku przeglądarki");
}

// Eksportujemy typy
export type { Database };
