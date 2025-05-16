import { useState, useEffect } from "react";
import { supabaseClient } from "@/db/supabase.client";
import type { User } from "@supabase/supabase-js";

export interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  error: Error | null;
  signOut: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Pobierz dane użytkownika z Supabase Auth przy ładowaniu komponentu
    const fetchUser = async () => {
      try {
        setLoading(true);
        setError(null);

        // Pobierz dane sesji z supabase - będzie używać ciasteczek automatycznie
        const { data, error } = await supabaseClient.auth.getSession();

        if (error) {
          throw error;
        }

        if (data?.session?.user) {
          setUser(data.session.user);
        }
      } catch (err) {
        console.error("Błąd pobierania danych użytkownika:", err);
        setError(err instanceof Error ? err : new Error("Nieznany błąd"));
      } finally {
        setLoading(false);
      }
    };

    // Pobierz dane użytkownika
    fetchUser();

    // Nasłuchuj zmian sesji
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Wyczyść subskrypcję przy odmontowaniu komponentu
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Funkcja wylogowania
  const signOut = async () => {
    try {
      const { error } = await supabaseClient.auth.signOut();
      if (error) throw error;

      // Wyczyść lokalny stan
      setUser(null);

      // Przekieruj do strony głównej
      window.location.href = "/";
    } catch (err) {
      console.error("Błąd wylogowania:", err);
      throw err;
    }
  };

  return {
    user,
    loading,
    error,
    signOut,
  };
}
