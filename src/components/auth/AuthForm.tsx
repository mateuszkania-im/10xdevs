import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabaseClient } from "@/db/supabase.client";
import { useToast } from "@/components/ToastProvider";

type AuthMode = "signin" | "signup" | "password-reset";

export default function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<AuthMode>("signin");
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "signin") {
        const { error } = await supabaseClient.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        // Przekierowanie do aplikacji
        window.location.href = "/app/projects";
      } else if (mode === "signup") {
        const { error } = await supabaseClient.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) throw error;

        // Wyraźne powiadomienie o sukcesie rejestracji
        showToast("Rejestracja zakończona pomyślnie! Konto zostało utworzone.", "success");

        setMode("signin");
      } else if (mode === "password-reset") {
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        });

        if (error) throw error;

        showToast("Wysłaliśmy instrukcje resetowania hasła na podany adres email.", "success");

        setMode("signin");
      }
    } catch (error) {
      console.error("Błąd autoryzacji:", error);

      if (error instanceof Error) {
        showToast(error.message, "error");
      } else {
        showToast("Wystąpił nieznany błąd podczas autoryzacji.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{mode === "signin" ? "Logowanie" : mode === "signup" ? "Rejestracja" : "Reset hasła"}</CardTitle>
        <CardDescription>
          {mode === "signin"
            ? "Wprowadź dane logowania do swojego konta"
            : mode === "signup"
              ? "Utwórz nowe konto"
              : "Wprowadź adres email, aby zresetować hasło"}
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="twoj@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {mode !== "password-reset" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium">
                  Hasło
                </label>
                {mode === "signin" && (
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline"
                    onClick={() => setMode("password-reset")}
                  >
                    Zapomniałem hasła
                  </button>
                )}
              </div>
              <input
                id="password"
                type="password"
                placeholder={mode === "signin" ? "Twoje hasło" : "Minimum 6 znaków"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" disabled={loading} className="w-full">
            {loading
              ? "Przetwarzanie..."
              : mode === "signin"
                ? "Zaloguj się"
                : mode === "signup"
                  ? "Zarejestruj się"
                  : "Wyślij link resetujący"}
          </Button>

          <div className="text-center text-sm">
            {mode === "signin" ? (
              <p>
                Nie masz konta?{" "}
                <button type="button" onClick={() => setMode("signup")} className="text-primary hover:underline">
                  Zarejestruj się
                </button>
              </p>
            ) : (
              <p>
                Masz już konto?{" "}
                <button type="button" onClick={() => setMode("signin")} className="text-primary hover:underline">
                  Zaloguj się
                </button>
              </p>
            )}
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
