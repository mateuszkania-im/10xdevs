import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateNoteDTO, UpdateNoteDTO, CreateConfigNoteDTO, UpdateConfigNoteDTO, NoteDetailDTO } from "@/types";

/**
 * Hook do operacji CRUD dla notatek
 * @returns Funkcje do operacji na notatkach oraz status ładowania
 */
export function useUpsertNote() {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  // Invalidacja cache po operacjach CRUD
  const invalidateNoteQueries = (projectId: string) => {
    queryClient.invalidateQueries({
      queryKey: ["notes", projectId],
    });
    queryClient.invalidateQueries({
      queryKey: ["projects", projectId],
    });
    
    // Dodatkowa invalidacja dla planów i statusu notatki konfiguracyjnej
    queryClient.invalidateQueries({
      queryKey: ["plans", projectId],
    });
    
    // Ten klucz używamy w naszej implementacji
    queryClient.invalidateQueries({
      queryKey: ["hasConfigNote", projectId],
    });
  };

  // Mutacja dla tworzenia zwykłej notatki
  const createNoteMutation = useMutation({
    mutationFn: async (params: { projectId: string; data: CreateNoteDTO }) => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/projects/${params.projectId}/notes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(params.data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Error ${response.status}`);
        }

        return (await response.json()) as NoteDetailDTO;
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: (_, variables) => {
      invalidateNoteQueries(variables.projectId);
    },
  });

  // Mutacja dla tworzenia notatki konfiguracyjnej
  const createConfigNoteMutation = useMutation({
    mutationFn: async (params: { projectId: string; data: CreateConfigNoteDTO }) => {
      setIsLoading(true);
      try {
        // Debugowanie - sprawdzenie, czy wszystkie pola są poprawnie przesyłane
        console.log("createConfigNote - Dane przed wysłaniem do API:", {
          projectId: params.projectId,
          data: {
            ...params.data,
            destination: params.data.destination || "",
            travel_style: params.data.travel_style || "zwiedzanie",
            budget: params.data.budget || "",
            interests: params.data.interests || [],
            accommodation_address: params.data.accommodation_address || "",
          },
        });

        // Zapewniamy, że wszystkie pola które w bazie są NOT NULL mają wartości
        const dataToSend = {
          ...params.data,
          destination: params.data.destination || "",
          travel_style: params.data.travel_style || "zwiedzanie",
          budget: params.data.budget || "",
          interests: params.data.interests || [],
          accommodation_address: params.data.accommodation_address || "",
        };

        const response = await fetch(`/api/projects/${params.projectId}/notes/config-note`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(dataToSend),
        });

        if (!response.ok) {
          // Dodatkowe logowanie błędów
          const errorData = await response.json();
          console.error("API Error:", {
            status: response.status,
            statusText: response.statusText,
            data: errorData,
          });
          throw new Error(errorData.message || `Error ${response.status}`);
        }

        const responseData = await response.json();
        console.log("API Response:", responseData);
        return responseData as NoteDetailDTO;
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: (_, variables) => {
      invalidateNoteQueries(variables.projectId);
    },
  });

  // Mutacja dla aktualizacji zwykłej notatki
  const updateNoteMutation = useMutation({
    mutationFn: async (params: { projectId: string; noteId: string; data: UpdateNoteDTO }) => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/projects/${params.projectId}/notes/${params.noteId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(params.data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Error ${response.status}`);
        }

        return (await response.json()) as NoteDetailDTO;
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: (_, variables) => {
      invalidateNoteQueries(variables.projectId);
    },
  });

  // Mutacja dla aktualizacji notatki konfiguracyjnej
  const updateConfigNoteMutation = useMutation({
    mutationFn: async (params: { projectId: string; noteId: string; data: UpdateConfigNoteDTO }) => {
      setIsLoading(true);
      try {
        // Debugowanie - sprawdzenie, czy wszystkie pola są poprawnie przesyłane
        console.log("updateConfigNote - Dane przed wysłaniem do API:", {
          projectId: params.projectId,
          noteId: params.noteId,
          data: params.data,
        });

        // Przygotowanie danych z uwzględnieniem NOT NULL constraints
        const dataToSend = { ...params.data };

        // Zapewniamy, że pola tekstowe nigdy nie są null lub undefined
        // ale pozwalamy na przekazanie pustych stringów, które są dopuszczalne w bazie
        if (dataToSend.destination === undefined || dataToSend.destination === null) dataToSend.destination = "";
        if (dataToSend.travel_style === undefined || dataToSend.travel_style === null)
          dataToSend.travel_style = "zwiedzanie";
        if (dataToSend.budget === undefined || dataToSend.budget === null) dataToSend.budget = "";
        if (dataToSend.accommodation_address === undefined || dataToSend.accommodation_address === null)
          dataToSend.accommodation_address = "";
        if (dataToSend.interests === undefined || dataToSend.interests === null) dataToSend.interests = [];

        // W rzeczywistości, notes/config-note obsługuje szukanie konfiguracyjnej notatki po projekcie,
        // ale na wszelki wypadek uwzględnimy też noteId w URL dla przyszłych zmian API
        const response = await fetch(`/api/projects/${params.projectId}/notes/config-note`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(dataToSend),
        });

        if (!response.ok) {
          // Dodatkowe logowanie błędów
          const errorData = await response.json();
          console.error("API Error:", {
            status: response.status,
            statusText: response.statusText,
            data: errorData,
          });
          throw new Error(errorData.error || errorData.message || `Error ${response.status}`);
        }

        const responseData = await response.json();
        console.log("API Response (update):", responseData);
        return responseData as NoteDetailDTO;
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: (_, variables) => {
      invalidateNoteQueries(variables.projectId);
    },
  });

  // Pomocnicze funkcje do wygodnego używania mutacji
  const upsertNote = {
    createNote: (projectId: string, data: CreateNoteDTO) => createNoteMutation.mutateAsync({ projectId, data }),

    createConfigNote: (projectId: string, data: CreateConfigNoteDTO) =>
      createConfigNoteMutation.mutateAsync({ projectId, data }),

    updateNote: (projectId: string, noteId: string, data: UpdateNoteDTO) =>
      updateNoteMutation.mutateAsync({ projectId, noteId, data }),

    updateConfigNote: (projectId: string, noteId: string, data: UpdateConfigNoteDTO) =>
      updateConfigNoteMutation.mutateAsync({ projectId, noteId, data }),
  };

  return {
    upsertNote,
    isLoading:
      isLoading ||
      createNoteMutation.isPending ||
      createConfigNoteMutation.isPending ||
      updateNoteMutation.isPending ||
      updateConfigNoteMutation.isPending,
  };
}
