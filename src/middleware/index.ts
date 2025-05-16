import { defineMiddleware } from "astro:middleware";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../db/database.types";

export const onRequest = defineMiddleware(async (context, next) => {
  // Logowanie dla debugowania
  console.log(`[Middleware] Ścieżka: ${context.url.pathname}`);

  // Pobieranie zmiennych środowiskowych - bezpośrednio z process.env
  const supabaseUrl =
    process.env.PUBLIC_SUPABASE_URL ||
    // Astro/Vite expose PUBLIC_* oraz VITE_* na import.meta.env
    import.meta.env.PUBLIC_SUPABASE_URL ||
    import.meta.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    import.meta.env.SUPABASE_URL;

  const supabaseAnonKey =
    process.env.PUBLIC_SUPABASE_ANON_KEY ||
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY ||
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    import.meta.env.SUPABASE_ANON_KEY;

  // Logowanie pobranych wartości
  console.log(`[Middleware] Odczytany supabaseUrl: ${supabaseUrl}`);
  console.log(`[Middleware] Odczytany supabaseAnonKey: ${typeof supabaseAnonKey === 'string' ? supabaseAnonKey.substring(0, 10) + '...' : supabaseAnonKey}`); // Loguj tylko fragment klucza

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Middleware] Krytyczny błąd: Brak supabaseUrl lub supabaseAnonKey. Zmienne z process.env:', {
      PUBLIC_SUPABASE_URL_EXISTS: !!process.env.PUBLIC_SUPABASE_URL,
      PUBLIC_SUPABASE_ANON_KEY_EXISTS: !!process.env.PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_URL_EXISTS: !!process.env.SUPABASE_URL, // Sprawdź też bez prefixu, na wszelki wypadek
      SUPABASE_ANON_KEY_EXISTS: !!process.env.SUPABASE_ANON_KEY, // Sprawdź też bez prefixu
    });
    // Można tu rzucić błąd lub zwrócić odpowiedź błędu, zamiast pozwalać na kontynuację z nieudaną inicjalizacją klienta
    return new Response("Internal Server Error - Supabase configuration missing in middleware", { status: 500 });
  }

  // Tworzenie klienta Supabase bezpośrednio w middleware
  const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
  });

  // Ustawienie klienta supabase w kontekście
  context.locals.supabase = supabaseClient;

  // Sprawdzenie czy żądanie jest do API
  const pathname = context.url.pathname;

  // Sprawdź sesję z ciasteczek - Supabase używa sb-access-token i sb-refresh-token
  try {
    // Pobierz wszystkie ciasteczka
    const cookieHeader = context.request.headers.get("cookie");

    if (cookieHeader) {
      // Pobierz ciasteczka sesji Supabase
      const allCookies = Object.fromEntries(
        cookieHeader.split("; ").map((cookie) => {
          const [name, value] = cookie.split("=");
          return [name, value];
        })
      );

      // Znajdź ciasteczko sesji Supabase
      const supabaseCookieName = Object.keys(allCookies).find(
        (name) => name.startsWith("sb-") && name.includes("auth-token")
      );

      console.log("[Middleware] Znalezione ciasteczko Supabase:", supabaseCookieName);

      if (supabaseCookieName) {
        const token = decodeURIComponent(allCookies[supabaseCookieName]);
        try {
          // Parsuj token do JSON
          const tokenData = JSON.parse(token);
          console.log("[Middleware] Token zawiera access_token:", !!tokenData?.access_token);
          console.log("[Middleware] Token zawiera refresh_token:", !!tokenData?.refresh_token);

          if (tokenData?.access_token && tokenData?.refresh_token) {
            // Ustaw sesję w kliencie Supabase
            const { data, error } = await supabaseClient.auth.setSession({
              access_token: tokenData.access_token,
              refresh_token: tokenData.refresh_token,
            });

            console.log("[Middleware] Wynik setSession:", !!data?.user, error?.message);

            if (!error && data?.user) {
              // Dodaj użytkownika do kontekstu locals
              context.locals.user = data.user;
              console.log("[Middleware] Zalogowany użytkownik:", data.user.email);
            }
          }
        } catch (err) {
          console.error("[Middleware] Błąd parsowania tokenu:", err);
        }
      }
    } else {
      console.log("[Middleware] Brak ciasteczek w żądaniu");
    }
  } catch (err) {
    console.error("[Middleware] Błąd weryfikacji sesji:", err);
  }

  // Guard chronionych ścieżek /app/*
  if (pathname.startsWith("/app")) {
    // Jeżeli nie mamy usera w locals to przekieruj na 401
    if (!context.locals.user) {
      console.log("[Middleware] Brak użytkownika w kontekście dla ścieżki /app/* - przekierowanie na 401");
      console.log(`[Middleware] Pełna ścieżka: ${context.url.pathname}`);
      console.log(`[Middleware] Metoda: ${context.request.method}`);
      console.log(`[Middleware] Headers: ${JSON.stringify(Object.fromEntries(context.request.headers.entries()))}`);

      try {
        const redirectUrl = new URL("/401", context.url);
        console.log(`[Middleware] Przekierowanie na: ${redirectUrl.toString()}`);
        return Response.redirect(redirectUrl, 302);
      } catch (error) {
        console.error("[Middleware] Błąd podczas przekierowania:", error);
        // Awaryjne zwrócenie błędu 401 bez przekierowania
        return new Response("Unauthorized", { status: 401 });
      }
    } else {
      console.log("[Middleware] Użytkownik zweryfikowany, dostęp do /app/* dozwolony");
    }
  }

  // Obsługa Astro fallback do stron statusowych
  if (pathname.startsWith("/404") || pathname.startsWith("/401") || pathname.startsWith("/500")) {
    console.log(`[Middleware] Obsługa strony statusowej: ${pathname}`);
    return next();
  }

  if (pathname.startsWith("/api/")) {
    // Pobranie nagłówka autoryzacji
    const authHeader = context.request.headers.get("Authorization");

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];

      try {
        // Weryfikacja JWT i pobranie informacji o użytkowniku
        const {
          data: { user },
          error,
        } = await supabaseClient.auth.getUser(token);

        if (!error && user) {
          // Dodanie informacji o użytkowniku do kontekstu
          context.locals.user = user;
        }
      } catch (error) {
        console.error("Error verifying JWT:", error);
      }
    }
  }

  return next();
});
