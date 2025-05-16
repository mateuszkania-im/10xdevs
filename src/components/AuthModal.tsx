import React, { useState, useEffect } from "react";
import { useAuthModal, type AuthModalTab } from "./providers/AuthModalProvider";
import { useToast } from "./ToastProvider";
import { supabaseClient } from "@/db/supabase.client";
import { Button } from "./ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Modal, ModalBody, ModalContent } from "./ui/animated-modal";

export function AuthModal() {
  // Stan isMounted prawdopodobnie nie jest już potrzebny do kontrolowania renderowania,
  // ale zostawmy go na razie, jeśli jest używany gdzieś indziej (choć nie wygląda na to)
  const [isMounted, setIsMounted] = useState(false);

  // Pobieranie kontekstów
  const { isOpen, activeTab, closeModal, setTab } = useAuthModal();
  const { showToast } = useToast();

  // Stan formularzy
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Oznacz komponent jako zamontowany po renderowaniu po stronie klienta
  useEffect(() => {
    console.log("AuthModal: Komponent zamontowany");
    setIsMounted(true);
  }, []);

  console.log("AuthModal: Renderowanie z isOpen=", isOpen, "activeTab=", activeTab);

  // Obsługa logowania
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Brak potrzeby ręcznego zapisywania ciasteczek, Supabase zajmuje się sesją automatycznie
      // Użyjemy setTimeout, aby dać czas na przetworzenie sesji
      setTimeout(() => {
        // Przekierowanie do aplikacji
        window.location.href = "/app/projects";
      }, 300);
    } catch (error) {
      console.error("Błąd logowania:", error);
      let errorMessage = "Wystąpił błąd podczas logowania";

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      showToast(errorMessage, "error");
      setLoading(false);
    }
  };

  // Obsługa rejestracji
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    // Walidacja hasła
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
      const { error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        // Sprawdź, czy error ma kod wskazujący na już istniejące konto
        if (error.message.includes("already registered") || error.message.includes("already exists")) {
          showToast("Konto o tym adresie email już istnieje. Spróbuj się zalogować.", "warning");
          setTab("signin"); // Przełącz na zakładkę logowania
        } else {
          throw error;
        }
      } else {
        // Wyraźne powiadomienie o sukcesie rejestracji
        showToast("Rejestracja zakończona pomyślnie! Konto zostało utworzone.", "success");
        setTab("signin");
      }
    } catch (error) {
      console.error("Błąd rejestracji:", error);
      let errorMessage = "Wystąpił błąd podczas rejestracji";

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  // Obsługa resetu hasła
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      showToast("Wysłaliśmy instrukcje resetowania hasła na podany adres email.", "success");
      setTab("signin");
    } catch (error) {
      console.error("Błąd resetowania hasła:", error);
      let errorMessage = "Wystąpił błąd podczas wysyłania instrukcji resetowania hasła";

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  // Funkcja do obsługi zmiany stanu otwarcia modalu (z animated-modal)
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      console.log("AuthModal: Modal zamknięty przez onOpenChange (np. kliknięcie poza, escape, przycisk X)");
      // Resetowanie stanu po zamknięciu
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setLoading(false);
      closeModal(); // Wywołujemy closeModal z naszego providera
    }
  };

  // Komponent <Modal> jest teraz renderowany od razu,
  // a <ModalBody> wewnątrz niego decyduje, czy coś wyświetlić na podstawie propsa `open`.
  return (
    <Modal open={isOpen} onOpenChange={handleOpenChange}>
      <ModalBody className="p-0 max-w-md w-full">
        <ModalContent className="p-0">
          <div className="p-6 pb-0">
            <h2 className="text-2xl font-bold mb-4">
              {activeTab === "signin" ? "Logowanie" : activeTab === "signup" ? "Rejestracja" : "Reset hasła"}
            </h2>
          </div>

          <Tabs value={activeTab} onValueChange={(value) => setTab(value as AuthModalTab)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 px-6">
              <TabsTrigger value="signin" data-test-id="tab-signin">Logowanie</TabsTrigger>
              <TabsTrigger value="signup" data-test-id="tab-signup">Rejestracja</TabsTrigger>
              <TabsTrigger value="reset-password" data-test-id="tab-reset-password">Reset hasła</TabsTrigger>
            </TabsList>

            {/* Formularz logowania */}
            <TabsContent value="signin" className="p-6">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="signin-email" className="text-sm font-medium">
                    Email
                  </label>
                  <input
                    id="signin-email"
                    data-test-id="login-email"
                    type="email"
                    placeholder="twoj@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="signin-password" className="text-sm font-medium">
                      Hasło
                    </label>
                  </div>
                  <input
                    id="signin-password"
                    data-test-id="login-password"
                    type="password"
                    placeholder="Twoje hasło"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                  data-test-id="login-submit"
                >
                  {loading ? "Logowanie..." : "Zaloguj się"}
                </Button>
              </form>
            </TabsContent>

            {/* Formularz rejestracji */}
            <TabsContent value="signup" className="p-6">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="signup-email" className="text-sm font-medium">
                    Email
                  </label>
                  <input
                    id="signup-email"
                    data-test-id="register-email"
                    type="email"
                    placeholder="twoj@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="signup-password" className="text-sm font-medium">
                    Hasło
                  </label>
                  <input
                    id="signup-password"
                    data-test-id="register-password"
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
                    data-test-id="register-confirm-password"
                    type="password"
                    placeholder="Powtórz hasło"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading}
                  data-test-id="register-submit"
                >
                  {loading ? "Rejestracja..." : "Zarejestruj się"}
                </Button>
              </form>
            </TabsContent>

            {/* Formularz resetowania hasła */}
            <TabsContent value="reset-password" className="p-6">
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="reset-email" className="text-sm font-medium">
                    Email
                  </label>
                  <input
                    id="reset-email"
                    type="email"
                    placeholder="twoj@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Wysyłanie..." : "Wyślij link resetujący"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </ModalContent>
      </ModalBody>
    </Modal>
  );
}
