import type { APIRoute } from "astro";

import { PlanService } from "../../../../../../lib/services/plan.service";
import {
  planPathParamsSchema,
  updatePlanSchema,
  validateBody,
  validatePathParams,
} from "../../../../../../lib/validation/plan.schema";
import { z } from "zod";

// Zmodyfikowany schemat ścieżki z wymaganym planId
const planDetailPathParamsSchema = z.object({
  projectId: planPathParamsSchema.shape.projectId,
  planId: z.string().uuid(),
});

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // Walidacja parametrów ścieżki
    const { projectId, planId } = validatePathParams(planDetailPathParamsSchema, params);

    // Inicjalizacja serwisu z klientem Supabase z kontekstu
    const planService = new PlanService(locals.supabase);

    // Pobieranie szczegółów planu
    const plan = await planService.getPlan(projectId, planId);

    return new Response(JSON.stringify(plan), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Błąd podczas pobierania planu:", error);

    // Obsługa różnych typów błędów
    if (error instanceof Error) {
      const message = error.message;

      if (message.includes("Niepoprawne parametry ścieżki")) {
        return new Response(JSON.stringify({ error: message }), { status: 400 });
      }

      // Obsługa błędu 404 - Plan lub projekt nie istnieje
      if (message.includes("nie istnieje") || message.includes("does not exist")) {
        return new Response(JSON.stringify({ error: "Plan lub projekt nie został znaleziony" }), { status: 404 });
      }
    }

    // Domyślny błąd 500
    return new Response(JSON.stringify({ error: "Wystąpił błąd podczas pobierania planu" }), { status: 500 });
  }
};

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    // Walidacja parametrów ścieżki
    const { projectId, planId } = validatePathParams(planDetailPathParamsSchema, params);

    // Walidacja ciała zapytania
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Nieprawidłowy format JSON" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const updateData = validateBody(updatePlanSchema, body);

    // Inicjalizacja serwisu z klientem Supabase z kontekstu
    const planService = new PlanService(locals.supabase);

    // Aktualizacja planu
    const updatedPlan = await planService.updatePlan(projectId, planId, updateData);

    return new Response(JSON.stringify(updatedPlan), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Błąd podczas aktualizacji planu:", error);

    // Obsługa różnych typów błędów
    if (error instanceof Error) {
      const message = error.message;

      if (message.includes("Niepoprawne parametry ścieżki") || message.includes("Niepoprawne dane wejściowe")) {
        return new Response(JSON.stringify({ error: message }), { status: 400 });
      }

      // Obsługa błędu 404 - Plan lub projekt nie istnieje
      if (message.includes("nie istnieje") || message.includes("does not exist")) {
        return new Response(JSON.stringify({ error: "Plan lub projekt nie został znaleziony" }), { status: 404 });
      }

      // Obsługa błędu 409 - Konflikt nazwy wersji
      if (message.includes("już istnieje")) {
        return new Response(JSON.stringify({ error: message }), { status: 409 });
      }
    }

    // Domyślny błąd 500
    return new Response(JSON.stringify({ error: "Wystąpił błąd podczas aktualizacji planu" }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    // Walidacja parametrów ścieżki
    const { projectId, planId } = validatePathParams(planDetailPathParamsSchema, params);

    // Inicjalizacja serwisu z klientem Supabase z kontekstu
    const planService = new PlanService(locals.supabase);

    // Usuwanie planu
    await planService.deletePlan(projectId, planId);

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Błąd podczas usuwania planu:", error);

    // Obsługa różnych typów błędów
    if (error instanceof Error) {
      const message = error.message;

      if (message.includes("Niepoprawne parametry ścieżki")) {
        return new Response(JSON.stringify({ error: message }), { status: 400 });
      }

      // Obsługa błędu 404 - Plan lub projekt nie istnieje
      if (message.includes("nie istnieje") || message.includes("does not exist")) {
        return new Response(JSON.stringify({ error: "Plan lub projekt nie został znaleziony" }), { status: 404 });
      }
    }

    // Domyślny błąd 500
    return new Response(JSON.stringify({ error: "Wystąpił błąd podczas usuwania planu" }), { status: 500 });
  }
};

// Konfiguracja dla Astro - wyłączamy prerenderowanie dla API
export const prerender = false;
