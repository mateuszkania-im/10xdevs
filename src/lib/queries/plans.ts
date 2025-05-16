import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  TravelPlanListItemDTO,
  TravelPlanDetailDTO,
  GeneratePlanDTO,
  UpdatePlanDTO,
  PaginatedResponse,
  PlanComparisonDTO,
} from "@/types";

// Funkcje pomocnicze do komunikacji z API
async function fetchPlans(
  projectId: string,
  params?: {
    includeOutdated?: boolean;
    sortBy?: string;
    order?: string;
    page?: number;
    limit?: number;
  }
): Promise<PaginatedResponse<TravelPlanListItemDTO>> {
  const searchParams = new URLSearchParams();

  if (params?.includeOutdated !== undefined) {
    searchParams.set("include_outdated", params.includeOutdated.toString());
  }

  if (params?.sortBy) {
    searchParams.set("sort_by", params.sortBy);
  }

  if (params?.order) {
    searchParams.set("order", params.order);
  }

  if (params?.page) {
    searchParams.set("page", params.page.toString());
  }

  if (params?.limit) {
    searchParams.set("limit", params.limit.toString());
  }

  const url = `/api/projects/${projectId}/plans${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Wystąpił błąd podczas pobierania planów");
  }

  return response.json();
}

async function fetchPlan(projectId: string, planId: string): Promise<TravelPlanDetailDTO> {
  const response = await fetch(`/api/projects/${projectId}/plans/${planId}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Wystąpił błąd podczas pobierania planu");
  }

  return response.json();
}

async function generatePlan(projectId: string, data: GeneratePlanDTO): Promise<TravelPlanDetailDTO> {
  const response = await fetch(`/api/projects/${projectId}/plans/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Wystąpił błąd podczas generowania planu");
  }

  return response.json();
}

async function updatePlan(projectId: string, planId: string, data: UpdatePlanDTO): Promise<TravelPlanDetailDTO> {
  const response = await fetch(`/api/projects/${projectId}/plans/${planId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Wystąpił błąd podczas aktualizacji planu");
  }

  return response.json();
}

async function deletePlan(projectId: string, planId: string): Promise<void> {
  const response = await fetch(`/api/projects/${projectId}/plans/${planId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Wystąpił błąd podczas usuwania planu");
  }
}

async function exportPlanToPdf(projectId: string, planId: string): Promise<Blob> {
  const response = await fetch(`/api/projects/${projectId}/plans/${planId}/export?format=pdf`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Wystąpił błąd podczas eksportu planu do PDF");
  }

  return response.blob();
}

async function comparePlans(projectId: string, plan1Id: string, plan2Id: string): Promise<PlanComparisonDTO> {
  const response = await fetch(`/api/projects/${projectId}/plans/compare?plan1_id=${plan1Id}&plan2_id=${plan2Id}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Wystąpił błąd podczas porównywania planów");
  }

  return response.json();
}

// React Query Hooks
export function usePlans(
  projectId: string,
  params?: {
    includeOutdated?: boolean;
    sortBy?: string;
    order?: string;
    page?: number;
    limit?: number;
  }
) {
  return useQuery({
    queryKey: ["plans", projectId, params],
    queryFn: () => fetchPlans(projectId, params),
    staleTime: 30000, // 30 sekund zgodnie z planem (revalidation 30s)
  });
}

export function usePlan(projectId: string, planId: string) {
  return useQuery({
    queryKey: ["plan", projectId, planId],
    queryFn: () => fetchPlan(projectId, planId),
    staleTime: 15000, // Zmniejszam czas świeżości danych, aby szybciej wykrywać zmiany
    refetchOnWindowFocus: true, // Odświeżaj przy powrocie do okna przeglądarki
  });
}

export function useGeneratePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: GeneratePlanDTO }) => generatePlan(projectId, data),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ["plans", projectId] });
    },
  });
}

export function useUpdatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, planId, data }: { projectId: string; planId: string; data: UpdatePlanDTO }) =>
      updatePlan(projectId, planId, data),
    onSuccess: (_, { projectId, planId }) => {
      queryClient.invalidateQueries({ queryKey: ["plans", projectId] });
      queryClient.invalidateQueries({ queryKey: ["plan", projectId, planId] });
    },
  });
}

export function useDeletePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, planId }: { projectId: string; planId: string }) => deletePlan(projectId, planId),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ["plans", projectId] });
    },
  });
}

export function useExportPlanToPdf() {
  return useMutation({
    mutationFn: ({ projectId, planId }: { projectId: string; planId: string }) => exportPlanToPdf(projectId, planId),
  });
}

export function useComparePlans(projectId: string, plan1Id: string, plan2Id: string) {
  return useQuery({
    queryKey: ["plan-comparison", projectId, plan1Id, plan2Id],
    queryFn: () => comparePlans(projectId, plan1Id, plan2Id),
    staleTime: 60000, // 60 sekund zgodnie z planem (revalidation 60s)
    enabled: Boolean(plan1Id && plan2Id && plan1Id !== plan2Id),
  });
}
