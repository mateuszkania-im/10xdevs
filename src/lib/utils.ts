import dayjs from "dayjs";
import "dayjs/locale/pl";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { useState, useEffect } from "react";

// Ustawienie polskiego locale
dayjs.locale("pl");

/**
 * Łączy i optymalizuje klasy tailwind za pomocą twMerge i clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Hook do zarządzania parametrami URL w aplikacji klienckiej
 */
export function useSearchParams() {
  const [searchParams, setSearchParamsState] = useState<URLSearchParams>(
    typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams()
  );

  // Aktualizacja parametrów URL po zmianie stanu
  const setSearchParams = (params: URLSearchParams, replace = false) => {
    setSearchParamsState(params);

    if (typeof window !== "undefined") {
      const newUrl = new URL(window.location.href);
      newUrl.search = params.toString();

      // Użyj replaceState zamiast pushState, jeśli replace=true
      if (replace) {
        window.history.replaceState({}, "", newUrl.toString());
      } else {
        window.history.pushState({}, "", newUrl.toString());
      }
    }
  };

  // Nasłuchiwanie zmian w historii (przyciski wstecz/dalej)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePopState = () => {
      setSearchParamsState(new URLSearchParams(window.location.search));
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return [searchParams, setSearchParams] as const;
}

/**
 * Funkcja debounce do opóźnienia wykonania funkcji
 * @param fn Funkcja do wykonania
 * @param delay Opóźnienie w ms
 * @returns Opóźniona funkcja
 */
export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Formatuje datę w formacie ISO do lokalnego formatu
 */
export function formatDate(dateStr: string, formatStr = "DD.MM.YYYY"): string {
  try {
    return dayjs(dateStr).format(formatStr);
  } catch (error) {
    return dateStr;
  }
}

/**
 * Formatuje datę z czasem w formacie ISO do lokalnego formatu
 */
export function formatDateTime(dateStr: string, formatStr = "DD.MM.YYYY HH:mm"): string {
  try {
    return dayjs(dateStr).format(formatStr);
  } catch (error) {
    return dateStr;
  }
}

/**
 * Skraca tekst do określonej długości
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

/**
 * Generuje unikalny identyfikator
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * Czeka określoną ilość milisekund
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Sprawdza, czy obiekt jest pusty
 */
export function isEmptyObject(obj: Record<string, any>): boolean {
  return Object.keys(obj).length === 0;
}

/**
 * Formatuje liczbę jako walutę PLN
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
  }).format(amount);
}
