import type { APIRoute } from "astro";

import { PlanService } from "../../../../../lib/services/plan.service";
import {
  planPathParamsSchema,
  planQueryParamsSchema,
  validatePathParams,
  validateQueryParams,
} from "../../../../../lib/validation/plan.schema";

export const GET: APIRoute = async ({ params, request, locals }) => {
  try {
    // Walidacja parametrów ścieżki
    const { projectId } = validatePathParams(planPathParamsSchema, params);

    // Pobranie i walidacja parametrów zapytania
    const queryParams = validateQueryParams(planQueryParamsSchema, new URL(request.url).searchParams);

    // Inicjalizacja serwisu z klientem Supabase z kontekstu
    const planService = new PlanService(locals.supabase);

    // Pobieranie planów z użyciem zwalidowanych parametrów
    const result = await planService.getPlans(projectId, {
      includeOutdated: queryParams.include_outdated,
      sortBy: queryParams.sort_by,
      order: queryParams.order,
      page: queryParams.page,
      limit: queryParams.limit,
    });

    return new Response(JSON.stringify(result), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Błąd podczas pobierania listy planów:", error);

    // Obsługa różnych typów błędów
    if (error instanceof Error) {
      const message = error.message;

      if (message.includes("Niepoprawne parametry ścieżki") || message.includes("Niepoprawne parametry zapytania")) {
        return new Response(JSON.stringify({ error: message }), { status: 400 });
      }

      // Obsługa błędu 404 - Projekt nie istnieje
      if (message.includes("nie istnieje") || message.includes("does not exist")) {
        return new Response(JSON.stringify({ error: "Projekt nie został znaleziony" }), { status: 404 });
      }
    }

    // Domyślny błąd 500
    return new Response(JSON.stringify({ error: "Wystąpił błąd podczas pobierania planów" }), { status: 500 });
  }
};

// Konfiguracja dla Astro - wyłączamy prerenderowanie dla API
export const prerender = false;
