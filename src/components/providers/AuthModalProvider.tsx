import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

// Definicja typu dla zakładki w AuthModal
export type AuthModalTab = "signin" | "signup" | "reset-password";

// Interfejs dla kontekstu AuthModal
interface AuthModalContextType {
  isOpen: boolean;
  activeTab: AuthModalTab;
  openModal: (tab?: AuthModalTab) => void;
  closeModal: () => void;
  setTab: (tab: AuthModalTab) => void;
}

// Utworzenie kontekstu z domyślnymi wartościami
const defaultValue: AuthModalContextType = {
  isOpen: false,
  activeTab: "signin",
  openModal: () => {},
  closeModal: () => {},
  setTab: () => {},
};

// Utworzenie kontekstu z bezpiecznymi wartościami domyślnymi
const AuthModalContext = createContext<AuthModalContextType>(defaultValue);

// Hook do używania kontekstu AuthModal
export function useAuthModal() {
  const context = useContext(AuthModalContext);
  return context;
}

// Interfejs dla propsów komponentu providera
interface AuthModalProviderProps {
  children: React.ReactNode;
}

// Provider dla AuthModal
export function AuthModalProvider({ children }: AuthModalProviderProps) {
  // Sprawdzenie, czy działamy w środowisku przeglądarki
  // Usunięto stan isMounted, ponieważ łączymy logikę
  // const [isMounted, setIsMounted] = useState(false);

  // Stan dla modalu
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AuthModalTab>("signin");

  // Funkcja do otwierania modalu
  const openModal = useCallback((tab: AuthModalTab = "signin") => {
    console.log("AuthModalProvider: Otwieram modal z zakładką:", tab);
    setActiveTab(tab);
    setIsOpen(true);
  }, []);

  // Funkcja do zamykania modalu
  const closeModal = useCallback(() => {
    console.log("AuthModalProvider: Zamykam modal");
    setIsOpen(false);
  }, []);

  // Funkcja do zmiany zakładki
  const setTab = useCallback((tab: AuthModalTab) => {
    setActiveTab(tab);
  }, []);

  // Łączymy logikę montowania i nasłuchiwania zdarzeń w jednym useEffect
  useEffect(() => {
    // Ten efekt uruchamia się tylko po stronie klienta po zamontowaniu
    console.log("AuthModalProvider: Komponent zamontowany, dodaję nasłuchiwanie na zdarzenie open-auth-modal");

    const handleOpenAuthModal = (event: CustomEvent<{ tab?: AuthModalTab }>) => {
      console.log("AuthModalProvider: Otrzymano zdarzenie open-auth-modal z zakładką:", event.detail.tab);
      const tab = event.detail.tab || "signup";
      openModal(tab); // Wywołujemy openModal zdefiniowane powyżej
    };

    // Dodanie nasłuchiwania zdarzenia
    document.addEventListener("open-auth-modal", handleOpenAuthModal as EventListener);

    // Usunięcie nasłuchiwania po odmontowaniu komponentu
    return () => {
      console.log("AuthModalProvider: Usuwam nasłuchiwanie na zdarzenie open-auth-modal");
      document.removeEventListener("open-auth-modal", handleOpenAuthModal as EventListener);
    };
    // Zależność od openModal gwarantuje, że używamy stabilnej funkcji
  }, [openModal]);

  // Usunięto osobny useEffect dla isMounted
  // useEffect(() => {
  //   console.log('AuthModalProvider: Komponent zamontowany');
  //   setIsMounted(true);
  // }, []);

  // Dodaję konsolę logowanie, aby sprawdzić wartości kontekstu
  console.log("AuthModalProvider: Renderowanie z isOpen=", isOpen, "activeTab=", activeTab);

  // Zwracamy provider z wartością kontekstu
  return (
    <AuthModalContext.Provider
      value={{
        isOpen,
        activeTab,
        openModal,
        closeModal,
        setTab,
      }}
    >
      {children}
    </AuthModalContext.Provider>
  );
}
