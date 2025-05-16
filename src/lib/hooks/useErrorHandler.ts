import { useEffect, useState } from "react";
import { useToast } from "../../components/ui/toast/use-toast";
import { createTranslationService, defaultLanguage } from "../i18n/translations";

/**
 * Hook do obsługi błędów w komponentach React z obsługą ponownych prób
 * @param options Opcje konfiguracyjne
 * @returns Obiekt z funkcjami i stanem do obsługi błędów
 */
export function useErrorHandler(options?: { maxRetries?: number; retryDelay?: number; language?: string }) {
  const { toast } = useToast();
  const [isError, setIsError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Domyślne opcje
  const maxRetries = options?.maxRetries || 3;
  const retryDelay = options?.retryDelay || 2000;

  // Obsługa tłumaczeń dla komunikatów błędów
  const t = createTranslationService(options?.language === "en" ? "en" : defaultLanguage).t;

  // Resetowanie stanu błędu po zakończeniu ładowania
  useEffect(() => {
    if (!loading && isError) {
      const timer = setTimeout(() => {
        setIsError(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [loading, isError]);

  /**
   * Wykonuje operację asynchroniczną z obsługą błędów i automatycznymi ponownymi próbami
   * @param operation Funkcja asynchroniczna do wykonania
   * @param errorMessage Opcjonalny niestandardowy komunikat błędu
   * @returns Wynik operacji lub undefined w przypadku błędu
   */
  const executeWithRetry = async <T>(operation: () => Promise<T>, errorMessage?: string): Promise<T | undefined> => {
    setLoading(true);

    try {
      const result = await operation();
      setIsError(false);
      setRetryCount(0);
      return result;
    } catch (error) {
      setIsError(true);

      // Wyświetl komunikat błędu
      toast({
        title: t("errors", "errorOccurred"),
        description: errorMessage || getErrorMessage(error),
        variant: "destructive",
      });

      // Automatyczna ponowna próba, jeśli nie przekroczono limitu
      if (retryCount < maxRetries) {
        setRetryCount((prev) => prev + 1);

        // Czekaj określony czas przed ponowną próbą
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        return executeWithRetry(operation, errorMessage);
      }

      return undefined;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Pobiera czytelny komunikat błędu z różnych formatów błędów
   * @param error Obiekt błędu
   * @returns Czytelny komunikat błędu
   */
  const getErrorMessage = (error: unknown): string => {
    if (typeof error === "string") return error;
    if (error instanceof Error) return error.message;
    if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
      return error.message;
    }
    return t("errors", "unknownError");
  };

  return {
    executeWithRetry,
    isError,
    loading,
    retryCount,
    resetError: () => setIsError(false),
    getErrorMessage,
  };
}
