import type { APIContext } from "astro";
import { PlanService } from "../../../../../../../lib/services/plan.service";
import { planPathParamsSchema } from "../../../../../../../lib/validation/plan.schema";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../../../../../db/database.types";

export const prerender = false;

type AuthContext = APIContext & {
  locals: {
    supabase: SupabaseClient<Database>;
    user?: {
      id: string;
    };
  };
};

export async function GET({ locals, params }: AuthContext) {
  try {
    // Sprawdzenie autoryzacji
    if (!locals.user) {
      return new Response(JSON.stringify({ error: "Brak autoryzacji" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Walidacja parametrów ścieżki
    const pathParamsResult = planPathParamsSchema.safeParse(params);

    if (!pathParamsResult.success) {
      return new Response(
        JSON.stringify({ error: "Nieprawidłowe parametry ścieżki", details: pathParamsResult.error.format() }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Eksport planu do formatu PDF
    const planService = new PlanService(locals.supabase);

    // Eksport planu do PDF
    const pdfBytes = await planService.exportPlanToPdf(pathParamsResult.data.projectId, pathParamsResult.data.planId);

    // Zwracamy plik PDF jako odpowiedź binarną
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="plan-${pathParamsResult.data.planId}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Błąd podczas eksportu planu do PDF:", error);

    // Obsługa różnych typów błędów
    if (error instanceof Error) {
      const message = error.message;

      if (message.includes("Niepoprawne parametry ścieżki") || message.includes("Niepoprawne parametry zapytania")) {
        return new Response(JSON.stringify({ error: message }), { status: 400 });
      }

      // Obsługa błędu 404 - Plan lub projekt nie istnieje
      if (message.includes("nie istnieje") || message.includes("does not exist")) {
        return new Response(JSON.stringify({ error: "Plan lub projekt nie został znaleziony" }), { status: 404 });
      }

      // Obsługa błędu gdy funkcja eksportu do PDF nie jest jeszcze zaimplementowana
      if (message.includes("nie zaimplementowana")) {
        return new Response(JSON.stringify({ error: "Funkcja eksportu do PDF jest obecnie niedostępna" }), {
          status: 500,
        });
      }
    }

    // Domyślny błąd 500
    return new Response(JSON.stringify({ error: "Wystąpił błąd podczas eksportu planu do PDF" }), { status: 500 });
  }
}
