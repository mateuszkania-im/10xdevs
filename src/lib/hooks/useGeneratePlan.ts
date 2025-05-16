"use client";

import { useState } from "react";
import type { TravelPlanDetailDTO, GeneratePlanDTO } from "@/types";

interface UseGeneratePlanOptions {
  onProgress?: (progress: number, message: string) => void;
}

interface UseGeneratePlanReturn {
  mutate: (data: GeneratePlanDTO) => Promise<TravelPlanDetailDTO | null>;
  progress: number;
  log: string[];
  isGenerating: boolean;
  error: Error | null;
  abort: () => void;
}

/**
 * Hook do obsługi generowania planu podróży
 * @param projectId ID projektu
 * @param options Opcje konfiguracyjne
 */
export function useGeneratePlan(projectId: string, options?: UseGeneratePlanOptions): UseGeneratePlanReturn {
  const [progress, setProgress] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  /**
   * Obsługa streamu z serwera
   */
  const handleStream = async (response: Response): Promise<TravelPlanDetailDTO | null> => {
    if (!response.body) {
      throw new Error("Nie otrzymano odpowiedzi z serwera");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let decodedChunk = "";
    let result: TravelPlanDetailDTO | null = null;

    try {
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;

        if (done) break;

        // Dekoduj otrzymane dane
        const chunk = decoder.decode(value, { stream: true });
        decodedChunk += chunk;

        // Przetwarzanie linii z chunka
        const lines = decodedChunk.split("\n");
        decodedChunk = lines.pop() || ""; // Ostatnia linia może być niekompletna

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            // Sprawdź, czy linia zawiera dane o postępie
            if (line.startsWith("progress:")) {
              const progressValue = parseInt(line.substring(9), 10);
              setProgress(progressValue);
              if (options?.onProgress) {
                options.onProgress(progressValue, "");
              }
              continue;
            }

            // Sprawdź, czy linia zawiera wiadomość tekstową
            if (line.startsWith("message:")) {
              const message = line.substring(8);
              setLog((prev) => [...prev, message]);
              if (options?.onProgress) {
                options.onProgress(progress, message);
              }
              continue;
            }

            // Sprawdź, czy to kompletna odpowiedź JSON
            if (line.startsWith("{") && line.includes("content")) {
              result = JSON.parse(line) as TravelPlanDetailDTO;
            }
          } catch (e) {
            console.error("Błąd podczas przetwarzania streamu:", e);
            setLog((prev) => [...prev, `Błąd: ${(e as Error).message}`]);
          }
        }
      }

      return result;
    } catch (e) {
      if ((e as Error).name === "AbortError") {
        setLog((prev) => [...prev, "Generowanie zostało anulowane"]);
        return null;
      }
      throw e;
    }
  };

  /**
   * Główna funkcja do generowania planu
   */
  const mutate = async (data: GeneratePlanDTO): Promise<TravelPlanDetailDTO | null> => {
    setError(null);
    setProgress(0);
    setLog([]);
    setIsGenerating(true);

    const controller = new AbortController();
    setAbortController(controller);

    try {
      const response = await fetch(`/api/projects/${projectId}/plans/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        signal: controller.signal,
      });

      if (!response.ok) {
        // Sprawdź, czy to błąd duplikatu wersji
        if (response.status === 409) {
          throw new Error("Wersja o takiej nazwie już istnieje");
        }
        throw new Error(`Błąd serwera: ${response.status}`);
      }

      // Obsługa streamu
      const result = await handleStream(response);
      setIsGenerating(false);
      setProgress(100);
      return result;
    } catch (e) {
      const error = e as Error;
      setError(error);
      setIsGenerating(false);
      setLog((prev) => [...prev, `Błąd: ${error.message}`]);
      return null;
    } finally {
      setAbortController(null);
    }
  };

  /**
   * Funkcja do anulowania generowania
   */
  const abort = () => {
    if (abortController) {
      abortController.abort();
      setIsGenerating(false);
      setLog((prev) => [...prev, "Generowanie zostało anulowane"]);
    }
  };

  return {
    mutate,
    progress,
    log,
    isGenerating,
    error,
    abort,
  };
}

export default useGeneratePlan;
