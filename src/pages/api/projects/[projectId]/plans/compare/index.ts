import type { APIRoute } from "astro";

import { PlanService } from "../../../../../../lib/services/plan.service";
import {
  planCompareQueryParamsSchema,
  planPathParamsSchema,
  validatePathParams,
  validateQueryParams,
} from "../../../../../../lib/validation/plan.schema";

export const GET: APIRoute = async ({ params, request, locals }) => {
  try {
    // Walidacja parametrów ścieżki
    const { projectId } = validatePathParams(planPathParamsSchema, params);

    // Walidacja parametrów zapytania (plan1_id i plan2_id)
    const queryParams = validateQueryParams(planCompareQueryParamsSchema, new URL(request.url).searchParams);

    // Inicjalizacja serwisu z klientem Supabase z kontekstu
    const planService = new PlanService(locals.supabase);

    // Porównanie planów
    const comparison = await planService.comparePlans(projectId, queryParams.plan1_id, queryParams.plan2_id);

    return new Response(JSON.stringify(comparison), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Błąd podczas porównywania planów:", error);

    // Obsługa różnych typów błędów
    if (error instanceof Error) {
      const message = error.message;

      if (message.includes("Niepoprawne parametry ścieżki") || message.includes("Niepoprawne parametry zapytania")) {
        return new Response(JSON.stringify({ error: message }), { status: 400 });
      }

      // Obsługa błędu 404 - Projekt lub plany nie istnieją
      if (message.includes("nie istnieje") || message.includes("does not exist")) {
        return new Response(JSON.stringify({ error: "Projekt lub jeden z planów nie został znaleziony" }), {
          status: 404,
        });
      }

      // Obsługa błędu 400 - Plany muszą być różne
      if (message.includes("muszą być różne")) {
        return new Response(JSON.stringify({ error: message }), { status: 400 });
      }
    }

    // Domyślny błąd 500
    return new Response(JSON.stringify({ error: "Wystąpił błąd podczas porównywania planów" }), { status: 500 });
  }
};

// Konfiguracja dla Astro - wyłączamy prerenderowanie dla API
export const prerender = false;
