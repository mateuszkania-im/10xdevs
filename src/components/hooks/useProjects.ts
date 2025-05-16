import { useState, useEffect } from "react";
import type { ProjectListItemDTO, PaginatedResponse } from "@/types";

type SortBy = "created_at" | "updated_at" | "name";
type SortOrder = "asc" | "desc";

interface UseProjectsOptions {
  initialPage?: number;
  initialLimit?: number;
  initialSortBy?: SortBy;
  initialOrder?: SortOrder;
}

interface UseProjectsReturn {
  projects: ProjectListItemDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  isLoading: boolean;
  error: string | null;
  page: number;
  limit: number;
  sortBy: SortBy;
  order: SortOrder;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setSortBy: (sortBy: SortBy) => void;
  setOrder: (order: SortOrder) => void;
  refresh: () => void;
}

// Funkcja pomocnicza do pobierania tokenu zarówno z localStorage jak i z ciasteczek
function getAuthToken(): string | null {
  // Próba pobrania tokenu z localStorage
  try {
    const localToken = localStorage.getItem("accessToken");
    if (localToken) {
      return localToken;
    }
  } catch (e) {
    console.warn("Błąd podczas pobierania tokenu z localStorage:", e);
  }

  // Jeśli nie ma w localStorage, próba pobrania z ciasteczek
  try {
    const getCookie = (name: string): string | null => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) {
        const cookieValue = parts.pop()?.split(";").shift();
        return cookieValue || null;
      }
      return null;
    };

    // Próbujemy pobrać token z różnych ciasteczek używanych przez Supabase
    const supabaseCookie =
      getCookie("sb-auth-token") || getCookie("sb-127-auth-token") || getCookie("sb-localhost-auth-token");

    if (supabaseCookie) {
      try {
        // Token Supabase w ciasteczku jest przechowywany jako JSON
        const parsedCookie = JSON.parse(decodeURIComponent(supabaseCookie));
        if (parsedCookie?.access_token) {
          console.log("Pobrano token z ciasteczka Supabase");
          return parsedCookie.access_token;
        }
      } catch (e) {
        console.warn("Błąd parsowania tokenu z ciasteczka:", e);
      }
    }
  } catch (e) {
    console.warn("Błąd podczas pobierania tokenu z ciasteczek:", e);
  }

  return null;
}

export function useProjects({
  initialPage = 1,
  initialLimit = 20,
  initialSortBy = "updated_at",
  initialOrder = "desc",
}: UseProjectsOptions = {}): UseProjectsReturn {
  const [projects, setProjects] = useState<ProjectListItemDTO[]>([]);
  const [pagination, setPagination] = useState({
    page: initialPage,
    limit: initialLimit,
    total: 0,
    pages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [sortBy, setSortBy] = useState<SortBy>(initialSortBy);
  const [order, setOrder] = useState<SortOrder>(initialOrder);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    // Tworzymy controller do przerwania żądania w przypadku odmontowania
    const controller = new AbortController();

    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Pobieranie tokenu przy użyciu ulepszonej funkcji
        const token = getAuthToken();
        if (!token) {
          throw new Error("Brak tokenu autoryzacyjnego");
        }

        const url = new URL("/api/projects", window.location.origin);
        url.searchParams.append("page", page.toString());
        url.searchParams.append("limit", limit.toString());
        url.searchParams.append("sort_by", sortBy);
        url.searchParams.append("order", order);

        console.log("useProjects - Wysyłanie zapytania:", url.toString());

        const response = await fetch(url.toString(), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        console.log("useProjects - Status odpowiedzi:", response.status);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("useProjects - Błąd API:", errorData);
          throw new Error(`Błąd pobierania projektów: ${response.status}`);
        }

        // Parsuj odpowiedź jako JSON
        const responseText = await response.text();
        console.log("useProjects - Odpowiedź API:", responseText);

        let data: PaginatedResponse<ProjectListItemDTO>;
        try {
          data = JSON.parse(responseText) as PaginatedResponse<ProjectListItemDTO>;
        } catch (e) {
          console.error("useProjects - Błąd parsowania JSON:", e);
          throw new Error("Nieprawidłowa odpowiedź z serwera");
        }

        // Sprawdź, czy data.data jest zdefiniowane i jest tablicą
        if (!data.data || !Array.isArray(data.data)) {
          console.error("useProjects - Błąd struktury danych:", data);
          setProjects([]);
        } else {
          // Sprawdź, czy każdy element to poprawny projekt
          const validProjects = data.data.filter(
            (project) => project && typeof project === "object" && "id" in project && "name" in project
          );

          console.log("useProjects - Poprawne projekty:", validProjects);
          setProjects(validProjects);
        }

        // Upewnij się, że data.pagination jest zdefiniowane
        setPagination({
          page: data.pagination?.page || initialPage,
          limit: data.pagination?.limit || initialLimit,
          total: data.pagination?.total || 0,
          pages: data.pagination?.pages || 0,
        });
      } catch (err) {
        // Ignorujemy błędy przerwania
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }

        console.error("useProjects - Złapany błąd:", err);
        setError(err instanceof Error ? err.message : "Nieznany błąd");
        // Resetujemy dane w przypadku błędu
        setProjects([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();

    // Sprzątanie przy odmontowaniu
    return () => {
      controller.abort();
    };
  }, [page, limit, sortBy, order, refreshToken]);

  const refresh = () => {
    console.log("useProjects - Wymuszam odświeżenie danych");
    setRefreshToken((prev) => prev + 1);
  };

  return {
    projects,
    pagination,
    isLoading,
    error,
    page,
    limit,
    sortBy,
    order,
    setPage,
    setLimit,
    setSortBy,
    setOrder,
    refresh,
  };
}
