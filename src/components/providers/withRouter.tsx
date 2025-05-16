import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

/**
 * HOC (Higher Order Component) do opakowywania komponentów klienckich React
 * w BrowserRouter, umożliwiając korzystanie z React Router.
 * Warunkowe renderowanie na kliencie, aby uniknąć błędów z document podczas SSR.
 *
 * Użycie: export default withRouter(MojKomponent);
 */
export default function withRouter<P extends object>(Component: React.ComponentType<P>) {
  return function WithRouterWrapper(props: P) {
    // Stan do śledzenia, czy jesteśmy po stronie klienta
    const [isClient, setIsClient] = useState(false);

    // Efekt wykonujący się tylko po stronie klienta
    useEffect(() => {
      setIsClient(true);
    }, []);

    // Renderowanie warunkowe - tylko na kliencie renderujemy z BrowserRouter
    if (!isClient) {
      // Komponent "pusty" podczas SSR
      return null;
    }

    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<Component {...props} />} />
        </Routes>
      </BrowserRouter>
    );
  };
}
