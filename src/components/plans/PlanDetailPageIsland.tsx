import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import PlanDetailPage from "./PlanDetailPage";

// Utworzenie instancji QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minut
      retry: 1,
    },
  },
});

interface PlanDetailPageIslandProps {
  projectId: string;
  planId: string;
}

export function PlanDetailPageIsland({ projectId, planId }: PlanDetailPageIslandProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <PlanDetailPage projectId={projectId} planId={planId} />
    </QueryClientProvider>
  );
}
