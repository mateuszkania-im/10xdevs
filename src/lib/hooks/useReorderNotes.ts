import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { reorderNotes } from "@/lib/api/notes";
import type { ReorderNotesDTO } from "@/types";

export function useReorderNotes() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  /**
   * Zmiana kolejności notatek w projekcie
   * @param projectId ID projektu
   * @param reorderData Dane o nowej kolejności notatek
   */
  const reorderProjectNotes = async (projectId: string, reorderData: ReorderNotesDTO) => {
    setIsLoading(true);

    try {
      await reorderNotes(projectId, reorderData);
      return true;
    } catch (error) {
      console.error("Błąd podczas zmiany kolejności notatek:", error);

      if (error instanceof Error) {
        toast({
          title: "Błąd",
          description: error.message || "Nie udało się zmienić kolejności notatek",
          variant: "destructive",
        });
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    reorderNotes: reorderProjectNotes,
    isLoading,
  };
}
