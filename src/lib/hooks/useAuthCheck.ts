import { useState, useEffect } from "react";
import { supabaseClient } from "@/db/supabase.client";
import type { User } from "@supabase/supabase-js";

/**
 * Hook zapewniający informacje o stanie uwierzytelnienia użytkownika
 *
 * @returns Obiekt zawierający:
 * - isLoading: czy trwa ładowanie stanu sesji
 * - isAuthenticated: czy użytkownik jest zalogowany
 * - user: obiekt użytkownika (jeśli zalogowany)
 */
export function useAuthCheck() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Pobierz aktualną sesję po zamontowaniu komponentu
    const checkAuth = async () => {
      try {
        const { data, error } = await supabaseClient.auth.getSession();

        if (error) {
          console.error("Błąd podczas pobierania sesji:", error);
          setIsAuthenticated(false);
          setUser(null);
        } else {
          setIsAuthenticated(!!data.session);
          setUser(data.session?.user || null);
        }
      } catch (err) {
        console.error("Błąd podczas sprawdzania uwierzytelnienia:", err);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Nasłuchuj zmian w stanie uwierzytelnienia
    const { data: authListener } = supabaseClient.auth.onAuthStateChange(async (event, session) => {
      console.log("Zmiana stanu uwierzytelnienia:", event);
      setIsAuthenticated(!!session);
      setUser(session?.user || null);
      setIsLoading(false);
    });

    // Wykonaj sprawdzenie początkowe
    checkAuth();

    // Oczyść nasłuchiwanie po odmontowaniu
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  return { isLoading, isAuthenticated, user };
}
