import type {
  NoteListItemDTO,
  NoteDetailDTO,
  CreateNoteDTO,
  UpdateNoteDTO,
  CreateConfigNoteDTO,
  UpdateConfigNoteDTO,
  ReorderNotesDTO,
  PaginatedResponse,
  SuccessResponse,
} from "@/types";

/**
 * Pobiera listę notatek
 */
export async function fetchNotes(
  projectId: string,
  options?: {
    sortBy?: string;
    order?: "asc" | "desc";
    page?: number;
    limit?: number;
    tag?: string;
    search?: string;
  }
): Promise<PaginatedResponse<NoteListItemDTO>> {
  const searchParams = new URLSearchParams();

  if (options?.sortBy) searchParams.append("sort_by", options.sortBy);
  if (options?.order) searchParams.append("order", options.order);
  if (options?.page) searchParams.append("page", options.page.toString());
  if (options?.limit) searchParams.append("limit", options.limit.toString());
  if (options?.tag) searchParams.append("tag", options.tag);
  if (options?.search) searchParams.append("search", options.search);

  const response = await fetch(`/api/projects/${projectId}/notes?${searchParams.toString()}`);

  if (!response.ok) {
    throw new Error("Nie udało się pobrać notatek");
  }

  return await response.json();
}

/**
 * Pobiera szczegóły notatki
 */
export async function fetchNote(projectId: string, noteId: string): Promise<NoteDetailDTO> {
  const response = await fetch(`/api/projects/${projectId}/notes/${noteId}`);

  if (!response.ok) {
    throw new Error("Nie udało się pobrać notatki");
  }

  return await response.json();
}

/**
 * Tworzy nową notatkę
 */
export async function createNote(projectId: string, data: CreateNoteDTO): Promise<NoteDetailDTO> {
  const response = await fetch(`/api/projects/${projectId}/notes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Nie udało się utworzyć notatki");
  }

  return await response.json();
}

/**
 * Tworzy notatkę konfiguracyjną
 */
export async function createConfigNote(projectId: string, data: CreateConfigNoteDTO): Promise<NoteDetailDTO> {
  const response = await fetch(`/api/projects/${projectId}/notes/config-note`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Nie udało się utworzyć notatki konfiguracyjnej");
  }

  return await response.json();
}

/**
 * Aktualizuje notatkę
 */
export async function updateNote(projectId: string, noteId: string, data: UpdateNoteDTO): Promise<NoteDetailDTO> {
  const response = await fetch(`/api/projects/${projectId}/notes/${noteId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Nie udało się zaktualizować notatki");
  }

  return await response.json();
}

/**
 * Aktualizuje notatkę konfiguracyjną
 */
export async function updateConfigNote(
  projectId: string,
  noteId: string,
  data: UpdateConfigNoteDTO
): Promise<NoteDetailDTO> {
  const response = await fetch(`/api/projects/${projectId}/notes/config-note`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Nie udało się zaktualizować notatki konfiguracyjnej");
  }

  return await response.json();
}

/**
 * Usuwa notatkę
 */
export async function deleteNote(
  projectId: string,
  noteId: string
): Promise<{ success: boolean; projectUpdated: boolean }> {
  const response = await fetch(`/api/projects/${projectId}/notes/${noteId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Nie udało się usunąć notatki");
  }

  return await response.json();
}

/**
 * Zmienia kolejność notatek
 */
export async function reorderNotes(projectId: string, data: ReorderNotesDTO): Promise<SuccessResponse> {
  const response = await fetch(`/api/projects/${projectId}/notes/reorder`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Nie udało się zmienić kolejności notatek");
  }

  return await response.json();
}
