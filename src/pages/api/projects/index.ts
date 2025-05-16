import type { APIContext } from "astro";
import { ProjectService } from "../../../lib/services/project.service";
import { createProjectSchema, projectsQuerySchema } from "../../../lib/validation/project.schema";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../db/database.types";

export const prerender = false;

type AuthContext = APIContext & {
  locals: {
    supabase: SupabaseClient<Database>;
    user?: {
      id: string;
    };
  };
};

/**
 * Pobieranie listy projektów użytkownika z paginacją i sortowaniem
 * GET: /api/projects
 */
export async function GET({ locals, url }: AuthContext) {
  try {
    console.log("[API] GET /api/projects - rozpoczęto obsługę");

    // Sprawdzenie autoryzacji
    if (!locals.user) {
      console.log("[API] GET /api/projects - brak autoryzacji");
      return new Response(JSON.stringify({ error: "Brak autoryzacji" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("[API] GET /api/projects - zalogowany użytkownik:", locals.user.id);

    // Parametry zapytania
    const params = Object.fromEntries(url.searchParams);
    console.log("[API] GET /api/projects - parametry zapytania:", params);

    const parseResult = projectsQuerySchema.safeParse({
      ...params,
      page: params.page ? parseInt(params.page) : undefined,
      limit: params.limit ? parseInt(params.limit) : undefined,
    });

    if (!parseResult.success) {
      console.log("[API] GET /api/projects - nieprawidłowe parametry:", parseResult.error.format());
      return new Response(
        JSON.stringify({ error: "Nieprawidłowe parametry zapytania", details: parseResult.error.format() }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Pobieranie listy projektów
    const { page, limit, sort_by, order } = parseResult.data;
    console.log("[API] GET /api/projects - zwalidowane parametry:", { page, limit, sort_by, order });

    // Upewniamy się, że supabase jest dostępny
    if (!locals.supabase) {
      console.error("[API] GET /api/projects - brak klienta supabase w kontekście");
      return new Response(JSON.stringify({ error: "Błąd konfiguracji serwera" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const projectService = new ProjectService(locals.supabase);

    try {
      const result = await projectService.list({
        userId: locals.user.id,
        page,
        limit,
        sort_by,
        order,
      });

      console.log("[API] GET /api/projects - sukces, zwracam wyniki:", {
        liczba_projektów: result.data.length,
        pagination: result.pagination,
      });

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (serviceError) {
      console.error("[API] GET /api/projects - błąd serwisu:", serviceError);
      return new Response(
        JSON.stringify({
          error: "Wystąpił błąd podczas pobierania projektów",
          details: serviceError instanceof Error ? serviceError.message : "Nieznany błąd",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("[API] GET /api/projects - niezłapany błąd:", error);

    return new Response(
      JSON.stringify({
        error: "Wystąpił błąd podczas przetwarzania zapytania",
        details: error instanceof Error ? error.message : "Nieznany błąd",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

/**
 * Tworzenie nowego projektu
 * POST: /api/projects
 */
export async function POST({ locals, request }: AuthContext) {
  try {
    // Sprawdzenie autoryzacji
    if (!locals.user) {
      return new Response(JSON.stringify({ error: "Brak autoryzacji" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

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

    const parseResult = createProjectSchema.safeParse(body);

    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ error: "Nieprawidłowe dane projektu", details: parseResult.error.format() }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Tworzenie projektu
    const projectService = new ProjectService(locals.supabase);

    try {
      const result = await projectService.create({
        userId: locals.user.id,
        dto: parseResult.data,
      });

      return new Response(JSON.stringify(result), { status: 201, headers: { "Content-Type": "application/json" } });
    } catch (error) {
      if (error instanceof Error && "cause" in error) {
        if (error.cause === 400) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        if (error.cause === 409) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 409,
            headers: { "Content-Type": "application/json" },
          });
        }
      }

      throw error;
    }
  } catch (error) {
    console.error("Error in POST /api/projects:", error);

    return new Response(JSON.stringify({ error: "Wystąpił błąd podczas przetwarzania zapytania" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
