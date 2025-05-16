import { useState, useCallback, useEffect } from "react";
import { debounce } from "@/lib/utils";
import type { NoteEditorVM } from "@/types";

/**
 * Hook do obsługi automatycznego zapisywania wersji roboczych notatek
 * @param projectId - ID projektu
 * @param noteId - opcjonalne ID notatki (w przypadku edycji)
 * @returns funkcje do zarządzania wersją roboczą
 */
export function useDraftNote(projectId: string, noteId?: string) {
  const [draftExists, setDraftExists] = useState<boolean>(false);
  const draftKey = noteId ? `draft_note_${projectId}_${noteId}` : `draft_note_${projectId}_new`;

  // Sprawdzenie czy istnieje wersja robocza przy inicjalizacji
  useEffect(() => {
    const draft = localStorage.getItem(draftKey);
    setDraftExists(!!draft);
  }, [draftKey]);

  // Zapisanie wersji roboczej do localStorage z debounce 1s
  const saveDraft = useCallback(
    debounce((formData: NoteEditorVM) => {
      try {
        localStorage.setItem(draftKey, JSON.stringify(formData));
        setDraftExists(true);
        // Opcjonalnie można tutaj wywołać toast z informacją o zapisaniu wersji roboczej
      } catch (error) {
        console.error("Błąd podczas zapisywania wersji roboczej:", error);
      }
    }, 1000),
    [draftKey]
  );

  // Wczytanie wersji roboczej
  const loadDraft = useCallback((): NoteEditorVM | null => {
    try {
      const draft = localStorage.getItem(draftKey);
      if (draft) {
        return JSON.parse(draft) as NoteEditorVM;
      }
      return null;
    } catch (error) {
      console.error("Błąd podczas wczytywania wersji roboczej:", error);
      return null;
    }
  }, [draftKey]);

  // Usunięcie wersji roboczej
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(draftKey);
      setDraftExists(false);
    } catch (error) {
      console.error("Błąd podczas usuwania wersji roboczej:", error);
    }
  }, [draftKey]);

  return {
    saveDraft,
    loadDraft,
    clearDraft,
    draftExists,
  };
}
