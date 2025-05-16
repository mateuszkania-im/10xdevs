import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "@/lib/utils";

export interface ProjectFilterState {
  search?: string;
  sortBy: "created_at" | "updated_at" | "name";
  order: "asc" | "desc";
  page: number;
  limit: number;
  totalPages: number;
  total: number;
}

interface UseProjectFiltersOptions {
  initialLimit?: number;
}

export function useProjectFilters({ initialLimit = 20 }: UseProjectFiltersOptions = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFiltersState] = useState<ProjectFilterState>({
    search: searchParams.get("search") || undefined,
    sortBy: (searchParams.get("sortBy") as ProjectFilterState["sortBy"]) || "updated_at",
    order: (searchParams.get("order") as ProjectFilterState["order"]) || "desc",
    page: parseInt(searchParams.get("page") || "1", 10),
    limit: parseInt(searchParams.get("limit") || initialLimit.toString(), 10),
    totalPages: 1,
    total: 0,
  });

  // Unikamy niepotrzebnego ponownego ustawiania parametrów URL, jeśli już są takie same
  const updateSearchParams = useCallback(() => {
    const currentSearch = searchParams.get("search") || "";
    const currentSortBy = searchParams.get("sortBy") || "updated_at";
    const currentOrder = searchParams.get("order") || "desc";
    const currentPage = searchParams.get("page") || "1";
    const currentLimit = searchParams.get("limit") || initialLimit.toString();

    // Sprawdzamy, czy parametry URL różnią się od aktualnego stanu filtrów
    const needsUpdate =
      (filters.search || "") !== currentSearch ||
      filters.sortBy !== currentSortBy ||
      filters.order !== currentOrder ||
      filters.page.toString() !== currentPage ||
      filters.limit.toString() !== currentLimit;

    // Aktualizujemy URL tylko jeśli faktycznie są zmiany
    if (needsUpdate) {
      const newParams = new URLSearchParams();

      if (filters.search) {
        newParams.set("search", filters.search);
      }

      if (filters.sortBy && filters.sortBy !== "updated_at") {
        newParams.set("sortBy", filters.sortBy);
      }

      if (filters.order && filters.order !== "desc") {
        newParams.set("order", filters.order);
      }

      if (filters.page !== 1) {
        newParams.set("page", filters.page.toString());
      }

      if (filters.limit !== initialLimit) {
        newParams.set("limit", filters.limit.toString());
      }

      // Użyj trybu replace zamiast push, żeby nie dodawać do historii przeglądania
      setSearchParams(newParams, true);
    }
  }, [filters, searchParams, setSearchParams, initialLimit]);

  // Synchronizacja filtrów z URL po zmianie stanu
  useEffect(() => {
    updateSearchParams();
  }, [updateSearchParams]);

  // Funkcja do ustawiania filtrów - zoptymalizowana
  const setFilters = useCallback(
    (newFilters: Partial<ProjectFilterState>) => {
      const updatedFilters = { ...filters, ...newFilters };

      // Jeśli zmieniamy wyszukiwanie, resetujemy stronę do 1
      if (newFilters.search !== undefined && newFilters.search !== filters.search) {
        updatedFilters.page = 1;

        // Debounce dla wyszukiwania
        const timeoutId = setTimeout(() => {
          setFiltersState(updatedFilters);
        }, 300);

        return () => clearTimeout(timeoutId);
      } else {
        // Natychmiastowa aktualizacja dla innych filtrów
        setFiltersState(updatedFilters);
        return undefined;
      }
    },
    [filters]
  );

  // Metoda do aktualizacji metadanych paginacji
  const updatePaginationData = useCallback((total: number, pages: number) => {
    // Aktualizujemy stan tylko jeśli wartości się zmieniły
    setFiltersState((prevFilters) => {
      if (prevFilters.total === total && prevFilters.totalPages === pages) {
        return prevFilters;
      }
      return {
        ...prevFilters,
        total,
        totalPages: pages,
      };
    });
  }, []);

  return { filters, setFilters, updatePaginationData };
}
