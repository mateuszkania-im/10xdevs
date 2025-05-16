import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabaseClient } from "@/db/supabase.client";
import { useToast } from "@/components/ToastProvider";

export default function PasswordResetForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      showToast("Hasła nie są identyczne", "error");
      return;
    }

    if (password.length < 6) {
      showToast("Hasło musi mieć co najmniej 6 znaków", "error");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabaseClient.auth.updateUser({
        password,
      });

      if (error) throw error;

      setSuccess(true);
      showToast("Hasło zostało zmienione pomyślnie", "success");

      // Przekierowanie do strony logowania po 3 sekundach
      setTimeout(() => {
        window.location.href = "/auth";
      }, 3000);
    } catch (error) {
      console.error("Błąd resetowania hasła:", error);

      if (error instanceof Error) {
        showToast(error.message, "error");
      } else {
        showToast("Wystąpił nieznany błąd podczas resetowania hasła.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Hasło zmienione</CardTitle>
          <CardDescription>Twoje hasło zostało pomyślnie zmienione.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4 text-green-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <p className="text-center">Za chwilę zostaniesz przekierowany do strony logowania.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Ustaw nowe hasło</CardTitle>
        <CardDescription>Wpisz i potwierdź nowe hasło do swojego konta</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Nowe hasło
            </label>
            <input
              id="password"
              type="password"
              placeholder="Minimum 6 znaków"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="confirm-password" className="text-sm font-medium">
              Potwierdź hasło
            </label>
            <input
              id="confirm-password"
              type="password"
              placeholder="Powtórz hasło"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Przetwarzanie..." : "Zmień hasło"}
          </Button>

          <div className="text-center text-sm">
            <a href="/auth" className="text-primary hover:underline">
              Powrót do logowania
            </a>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
