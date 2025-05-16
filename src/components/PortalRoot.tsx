import React, { createContext, useContext, useRef, useState, useEffect } from "react";
import { QueryProvider } from "./providers";
import { ThemeProvider } from "./ThemeProvider";

interface PortalContextType {
  portalRoot: HTMLDivElement | null;
}

const PortalContext = createContext<PortalContextType>({ portalRoot: null });

export function usePortal() {
  return useContext(PortalContext);
}

interface PortalRootProps {
  children: React.ReactNode;
}

export function PortalRoot({ children }: PortalRootProps) {
  const portalRootRef = useRef<HTMLDivElement | null>(null);
  const [portalContext, setPortalContext] = useState<PortalContextType>({ portalRoot: null });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    console.log("PortalRoot: Komponent zamontowany, ref=", portalRootRef.current);
    if (portalRootRef.current) {
      setPortalContext({ portalRoot: portalRootRef.current });
      console.log("PortalRoot: Ustawiono kontekst portalu", portalRootRef.current);
    } else {
      console.warn("PortalRoot: Element ref nie został przypisany!");
    }
    setIsMounted(true);
  }, []);

  console.log("PortalRoot: Renderowanie, ref=", portalRootRef.current, "portalContext=", portalContext);

  return (
    <QueryProvider>
      <ThemeProvider>
        <PortalContext.Provider value={portalContext}>
          {children}
          <div id="portal-root" ref={portalRootRef} className="fixed inset-0 z-40 pointer-events-none" />
        </PortalContext.Provider>
      </ThemeProvider>
    </QueryProvider>
  );
}

// Używamy eksportu nazwanego jako domyślnego dla kompatybilności z istniejącymi importami
const PortalRootExport = PortalRoot;
export default PortalRootExport;
