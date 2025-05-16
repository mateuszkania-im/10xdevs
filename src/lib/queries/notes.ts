import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  NoteListItemDTO,
  NoteDetailDTO,
  CreateNoteDTO,
  UpdateNoteDTO,
  CreateConfigNoteDTO,
  UpdateConfigNoteDTO,
  PaginatedResponse,
  ReorderNotesDTO,
} from "@/types";

// Funkcje pomocnicze do komunikacji z API
async function fetchNotes(
  projectId: string,
  params?: {
    search?: string;
    tag?: string;
    sortBy?: string;
    order?: string;
    page?: number;
    limit?: number;
  }
): Promise<PaginatedResponse<NoteListItemDTO>> {
  const searchParams = new URLSearchParams();

  if (params?.search) {
    searchParams.set("search", params.search);
  }

  if (params?.tag) {
    searchParams.set("tag", params.tag);
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

  const url = `/api/projects/${projectId}/notes${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Wystąpił błąd podczas pobierania notatek");
  }

  return response.json();
}

async function fetchNoteDetail(projectId: string, noteId: string): Promise<NoteDetailDTO> {
  const response = await fetch(`/api/projects/${projectId}/notes/${noteId}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Wystąpił błąd podczas pobierania notatki");
  }

  return response.json();
}

async function createNote(projectId: string, data: CreateNoteDTO): Promise<NoteDetailDTO> {
  const response = await fetch(`/api/projects/${projectId}/notes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const errorMessage = error.message || "Wystąpił błąd podczas tworzenia notatki";

    if (response.status === 409) {
      throw new Error(`${errorMessage}. Żaden z istniejących planów nie zostanie oznaczony jako nieaktualny.`);
    }

    throw new Error(errorMessage);
  }

  return response.json();
}

async function createConfigNote(projectId: string, data: CreateConfigNoteDTO): Promise<NoteDetailDTO> {
  const response = await fetch(`/api/projects/${projectId}/notes/config-note`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Wystąpił błąd podczas tworzenia notatki konfiguracyjnej");
  }

  return response.json();
}

async function updateNote(projectId: string, noteId: string, data: UpdateNoteDTO): Promise<NoteDetailDTO> {
  const response = await fetch(`/api/projects/${projectId}/notes/${noteId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Wystąpił błąd podczas aktualizacji notatki");
  }

  return response.json();
}

async function updateConfigNote(projectId: string, data: UpdateConfigNoteDTO): Promise<NoteDetailDTO> {
  const response = await fetch(`/api/projects/${projectId}/notes/config-note`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Wystąpił błąd podczas aktualizacji notatki konfiguracyjnej");
  }

  return response.json();
}

async function deleteNote(projectId: string, noteId: string): Promise<void> {
  const response = await fetch(`/api/projects/${projectId}/notes/${noteId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Wystąpił błąd podczas usuwania notatki");
  }
}

async function reorderNotes(projectId: string, data: ReorderNotesDTO): Promise<void> {
  const response = await fetch(`/api/projects/${projectId}/notes/reorder`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Wystąpił błąd podczas zmiany kolejności notatek");
  }
}

async function fetchConfigNote(projectId: string): Promise<NoteDetailDTO> {
  const response = await fetch(`/api/projects/${projectId}/notes/config-note`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Wystąpił błąd podczas pobierania notatki konfiguracyjnej");
  }

  return response.json();
}

// Nowa funkcja pomocnicza do sprawdzania istnienia notatki konfiguracyjnej
async function checkHasConfigNote(projectId: string): Promise<boolean> {
  const response = await fetch(`/api/projects/${projectId}/notes/config-note`);
  
  if (response.status === 404) {
    return false;
  }
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Wystąpił błąd podczas sprawdzania notatki konfiguracyjnej");
  }
  
  return true;
}

// React Query Hooks
export function useNotes(
  projectId: string,
  params?: {
    search?: string;
    tag?: string;
    sortBy?: string;
    order?: string;
    page?: number;
    limit?: number;
  }
) {
  return useQuery({
    queryKey: ["notes", projectId, params],
    queryFn: () => fetchNotes(projectId, params),
    staleTime: 15000, // 15 sekund zgodnie z planem (revalidation 15s)
  });
}

export function useNoteDetail(projectId: string, noteId: string) {
  return useQuery({
    queryKey: ["note", projectId, noteId],
    queryFn: () => fetchNoteDetail(projectId, noteId),
    staleTime: 15000,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: CreateNoteDTO }) => createNote(projectId, data),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ["notes", projectId] });
    },
  });
}

export function useCreateConfigNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: CreateConfigNoteDTO }) =>
      createConfigNote(projectId, data),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ["notes", projectId] });
      queryClient.invalidateQueries({ queryKey: ["configNote", projectId] });
      queryClient.invalidateQueries({ queryKey: ["plans", projectId] });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, noteId, data }: { projectId: string; noteId: string; data: UpdateNoteDTO }) =>
      updateNote(projectId, noteId, data),
    onSuccess: (_, { projectId, noteId }) => {
      queryClient.invalidateQueries({ queryKey: ["notes", projectId] });
      queryClient.invalidateQueries({ queryKey: ["note", projectId, noteId] });
    },
  });
}

export function useUpdateConfigNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: UpdateConfigNoteDTO }) =>
      updateConfigNote(projectId, data),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ["notes", projectId] });
      queryClient.invalidateQueries({ queryKey: ["configNote", projectId] });
      queryClient.invalidateQueries({ queryKey: ["plans", projectId] });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, noteId }: { projectId: string; noteId: string }) => deleteNote(projectId, noteId),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ["notes", projectId] });
    },
  });
}

export function useReorderNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: ReorderNotesDTO }) => reorderNotes(projectId, data),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ["notes", projectId] });
    },
  });
}

export function useConfigNote(projectId: string) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["configNote", projectId],
    queryFn: () => fetchConfigNote(projectId),
    staleTime: 15000,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans", projectId] });
    }
  });
}
