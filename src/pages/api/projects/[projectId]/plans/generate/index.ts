import type { APIRoute } from "astro";

import { PlanService } from "../../../../../../lib/services/plan.service";
import {
  generatePlanSchema,
  planPathParamsSchema,
  validateBody,
  validatePathParams,
} from "../../../../../../lib/validation/plan.schema";

export const POST: APIRoute = async ({ params, request, locals }) => {
  try {
    // Walidacja parametrów ścieżki
    const { projectId } = validatePathParams(planPathParamsSchema, params);

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

    const generateData = validateBody(generatePlanSchema, body);

    // Inicjalizacja serwisu z klientem Supabase z kontekstu
    const planService = new PlanService(locals.supabase);

    // Generowanie nowego planu
    const generatedPlan = await planService.generatePlan(projectId, generateData);

    return new Response(JSON.stringify(generatedPlan), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Błąd podczas generowania planu:", error);

    // Obsługa różnych typów błędów
    if (error instanceof Error) {
      const message = error.message;

      if (message.includes("Niepoprawne parametry ścieżki") || message.includes("Niepoprawne dane wejściowe")) {
        return new Response(JSON.stringify({ error: message }), { status: 400 });
      }

      // Obsługa błędu 404 - Projekt nie istnieje lub brak notatki konfiguracyjnej
      if (
        message.includes("nie istnieje") ||
        message.includes("does not exist") ||
        message.includes("notatkę konfiguracyjną")
      ) {
        return new Response(JSON.stringify({ error: message }), { status: 404 });
      }

      // Obsługa błędu 409 - Konflikt nazwy wersji
      if (message.includes("już istnieje")) {
        return new Response(JSON.stringify({ error: message }), { status: 409 });
      }

      // Obsługa błędu 400 - Limit planów
      if (message.includes("limit") || message.includes("Przekroczono")) {
        return new Response(JSON.stringify({ error: message }), { status: 400 });
      }
    }

    // Domyślny błąd 500
    return new Response(JSON.stringify({ error: "Wystąpił błąd podczas generowania planu" }), { status: 500 });
  }
};

// Konfiguracja dla Astro - wyłączamy prerenderowanie dla API
export const prerender = false;
