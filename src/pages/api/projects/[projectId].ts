import type { APIContext } from "astro";
import { ProjectService } from "../../../lib/services/project.service";
import { projectIdSchema, updateProjectSchema } from "../../../lib/validation/project.schema";
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
 * Pobieranie szczegółów projektu
 * GET: /api/projects/:projectId
 */
export async function GET({ locals, params }: AuthContext) {
  try {
    // Sprawdzenie autoryzacji
    if (!locals.user) {
      return new Response(JSON.stringify({ error: "Brak autoryzacji" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Walidacja parametru projectId
    const parseResult = projectIdSchema.safeParse(params);

    if (!parseResult.success) {
      return new Response(JSON.stringify({ error: "Nieprawidłowe ID projektu", details: parseResult.error.format() }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Pobieranie szczegółów projektu
    const projectService = new ProjectService(locals.supabase);

    try {
      const result = await projectService.getById({
        userId: locals.user.id,
        projectId: parseResult.data.projectId,
      });

      return new Response(JSON.stringify(result), { status: 200, headers: { "Content-Type": "application/json" } });
    } catch (error) {
      if (error instanceof Error && "cause" in error && error.cause === 404) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      throw error;
    }
  } catch (error) {
    console.error("Error in GET /api/projects/[projectId]:", error);

    return new Response(JSON.stringify({ error: "Wystąpił błąd podczas przetwarzania zapytania" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * Aktualizacja projektu
 * PATCH: /api/projects/:projectId
 */
export async function PATCH({ locals, params, request }: AuthContext) {
  try {
    // Sprawdzenie autoryzacji
    if (!locals.user) {
      return new Response(JSON.stringify({ error: "Brak autoryzacji" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Walidacja parametru projectId
    const paramsResult = projectIdSchema.safeParse(params);

    if (!paramsResult.success) {
      return new Response(
        JSON.stringify({ error: "Nieprawidłowe ID projektu", details: paramsResult.error.format() }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
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

    const bodyResult = updateProjectSchema.safeParse(body);

    if (!bodyResult.success) {
      return new Response(
        JSON.stringify({ error: "Nieprawidłowe dane projektu", details: bodyResult.error.format() }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Aktualizacja projektu
    const projectService = new ProjectService(locals.supabase);

    try {
      const result = await projectService.update({
        userId: locals.user.id,
        projectId: paramsResult.data.projectId,
        dto: bodyResult.data,
      });

      return new Response(JSON.stringify(result), { status: 200, headers: { "Content-Type": "application/json" } });
    } catch (error) {
      if (error instanceof Error && "cause" in error) {
        if (error.cause === 404) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 404,
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
    console.error("Error in PATCH /api/projects/[projectId]:", error);

    return new Response(JSON.stringify({ error: "Wystąpił błąd podczas przetwarzania zapytania" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * Usuwanie projektu
 * DELETE: /api/projects/:projectId
 */
export async function DELETE({ locals, params }: AuthContext) {
  try {
    // Sprawdzenie autoryzacji
    if (!locals.user) {
      return new Response(JSON.stringify({ error: "Brak autoryzacji" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Walidacja parametru projectId
    const parseResult = projectIdSchema.safeParse(params);

    if (!parseResult.success) {
      return new Response(JSON.stringify({ error: "Nieprawidłowe ID projektu", details: parseResult.error.format() }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Usuwanie projektu
    const projectService = new ProjectService(locals.supabase);

    try {
      await projectService.remove({
        userId: locals.user.id,
        projectId: parseResult.data.projectId,
      });

      return new Response(null, { status: 204 });
    } catch (error) {
      if (error instanceof Error && "cause" in error && error.cause === 404) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      throw error;
    }
  } catch (error) {
    console.error("Error in DELETE /api/projects/[projectId]:", error);

    return new Response(JSON.stringify({ error: "Wystąpił błąd podczas przetwarzania zapytania" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
