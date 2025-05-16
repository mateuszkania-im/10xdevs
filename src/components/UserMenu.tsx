import React, { useEffect } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/hooks/useAuth";
import { supabaseClient } from "@/db/supabase.client";
import { LogOut } from "lucide-react";

const UserMenuComponent: React.FC = () => {
  const { user, signOut, loading } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  // Dodaję efekt, który sprawdza sesję przy montowaniu komponentu
  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabaseClient.auth.getSession();
      console.log("UserMenu - sesja:", data, error);
    };

    checkSession();
  }, []);

  // Placeholder jeśli trwa ładowanie danych użytkownika
  if (loading) {
    return <div className="h-8 w-8 animate-pulse rounded-full bg-muted"></div>;
  }

  // Placeholder jeśli nie ma zalogowanego użytkownika
  if (!user) {
    return (
      <a
        href="/login"
        className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90"
      >
        Zaloguj
      </a>
    );
  }

  // Pobierz dane do wyświetlenia
  const displayName = (user.user_metadata?.name as string) || user.email;
  const email = user.email;
  const initials = displayName ? displayName[0] : email?.[0] || "?";

  const handleLogout = () => {
    signOut();
    closeMenu();
  };

  return (
    <div className="relative flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleLogout} className="hidden md:flex items-center gap-1">
        <LogOut className="h-4 w-4" />
        <span>Wyloguj</span>
      </Button>

      <button
        onClick={toggleMenu}
        onKeyDown={(e) => e.key === "Enter" && toggleMenu()}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="flex items-center gap-2 rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        <Avatar>
          <span className="sr-only">{displayName}</span>
          <span className="flex h-full w-full items-center justify-center rounded-full bg-muted text-muted-foreground">
            {initials.toUpperCase()}
          </span>
        </Avatar>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={closeMenu}
            onKeyDown={(e) => e.key === "Escape" && closeMenu()}
            tabIndex={-1}
            role="button"
            aria-label="Zamknij menu"
          />
          <Card className="absolute right-0 top-full z-20 mt-2 w-56">
            <CardContent className="p-2">
              <div className="mb-2 p-2">
                <p className="font-medium">{displayName}</p>
                <p className="text-sm text-muted-foreground">{email}</p>
              </div>

              <div className="border-t pt-2">
                <Button variant="ghost" className="w-full justify-start" onClick={signOut}>
                  Wyloguj
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export { UserMenuComponent };
export default UserMenuComponent;
