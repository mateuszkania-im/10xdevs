import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Utworzenie instancji QueryClient, która będzie współdzielona między wszystkimi komponentami
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minut
      retry: 1,
    },
  },
});

/**
 * HOC (Higher Order Component) do opakowywania komponentów klienckich React
 * w QueryClientProvider, umożliwiając korzystanie z React Query.
 *
 * Użycie: export default withQueryClient(MojKomponent);
 */
export default function withQueryClient<P extends object>(Component: React.ComponentType<P>) {
  // Zwracamy nowy komponent, który renderuje oryginalny komponent wewnątrz QueryClientProvider
  return function WithQueryClientWrapper(props: P) {
    return (
      <QueryClientProvider client={queryClient}>
        <Component {...props} />
      </QueryClientProvider>
    );
  };
}
