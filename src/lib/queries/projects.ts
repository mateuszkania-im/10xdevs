import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ProjectListItemDTO,
  ProjectDetailDTO,
  CreateProjectDTO,
  UpdateProjectDTO,
  PaginatedResponse,
} from "@/types";
import type { ProjectFilterState } from "@/lib/hooks/useProjectFilters";

// Funkcje pomocnicze do komunikacji z API
async function fetchProjects(filters?: ProjectFilterState): Promise<PaginatedResponse<ProjectListItemDTO>> {
  const searchParams = new URLSearchParams();

  if (filters?.search) {
    searchParams.set("search", filters.search);
  }

  if (filters?.sortBy) {
    searchParams.set("sort_by", filters.sortBy);
  }

  if (filters?.order) {
    searchParams.set("order", filters.order);
  }

  if (filters?.page) {
    searchParams.set("page", filters.page.toString());
  }

  if (filters?.limit) {
    searchParams.set("limit", filters.limit.toString());
  }

  const url = `/api/projects${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Wystąpił błąd podczas pobierania projektów");
  }

  return response.json();
}

async function createProject(data: CreateProjectDTO): Promise<ProjectDetailDTO> {
  const response = await fetch("/api/projects", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Wystąpił błąd podczas tworzenia projektu");
  }

  return response.json();
}

async function updateProject(id: string, data: UpdateProjectDTO): Promise<ProjectDetailDTO> {
  const response = await fetch(`/api/projects/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Wystąpił błąd podczas aktualizacji projektu");
  }

  return response.json();
}

async function deleteProject(id: string): Promise<void> {
  const response = await fetch(`/api/projects/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Wystąpił błąd podczas usuwania projektu");
  }
}

// React Query Hooks
export function useProjects(filters?: ProjectFilterState) {
  const { search, sortBy, order, page, limit } = filters || {};

  return useQuery({
    queryKey: ["projects", search ?? "", sortBy ?? "", order ?? "", page ?? 1, limit ?? 20],
    queryFn: () => fetchProjects(filters),
    staleTime: 30000, // 30 sekund zgodnie z planem (revalidation 30s)
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProject,
    onSuccess: (data) => {
      queryClient.setQueriesData<PaginatedResponse<ProjectListItemDTO>>(
        { queryKey: ["projects"], type: "all" },
        (old) => {
          if (!old) return old;
          const newTotal = (old.pagination?.total ?? old.data?.length ?? 0) + 1;
          const limit = old.pagination?.limit ?? 20;
          return {
            ...old,
            data: [...(old.data || []), data],
            pagination: {
              ...old.pagination,
              total: newTotal,
              pages: Math.ceil(newTotal / limit),
            },
          };
        }
      );
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectDTO }) => updateProject(id, data),
    onSuccess: (updatedProject) => {
      queryClient.setQueriesData<PaginatedResponse<ProjectListItemDTO>>(
        { queryKey: ["projects"], type: "all" },
        (old) => {
          if (!old || !old.data) return old;
          return {
            ...old,
            data: old.data.map((project) =>
              project.id === updatedProject.id ? { ...project, ...updatedProject } : project
            ),
          };
        }
      );
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProject,
    onSuccess: (_, id) => {
      queryClient.setQueriesData<PaginatedResponse<ProjectListItemDTO>>(
        { queryKey: ["projects"], type: "all" },
        (old) => {
          if (!old || !old.data) return old;
          const newData = old.data.filter((project) => project.id !== id);
          const newTotal = (old.pagination?.total ?? old.data.length) - 1;
          const limit = old.pagination?.limit ?? 20;
          return {
            ...old,
            data: newData,
            pagination: {
              ...old.pagination,
              total: newTotal,
              pages: Math.ceil(newTotal / limit),
            },
          };
        }
      );
    },
  });
}
