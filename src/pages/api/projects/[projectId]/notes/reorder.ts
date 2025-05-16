import type { APIRoute } from "astro";

import { NoteService } from "../../../../../lib/services/note.service";
import { notePathParamsSchema, reorderNotesSchema } from "../../../../../lib/validation/note.schema";

export const POST: APIRoute = async ({ params, request, locals }) => {
  try {
    // Walidacja parametrów ścieżki
    const pathResult = notePathParamsSchema.safeParse(params);
    if (!pathResult.success) {
      return new Response(
        JSON.stringify({ error: "Nieprawidłowe parametry ścieżki", details: pathResult.error.format() }),
        { status: 400 }
      );
    }

    const { projectId } = pathResult.data;

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

    const bodyResult = reorderNotesSchema.safeParse(body);
    if (!bodyResult.success) {
      return new Response(
        JSON.stringify({ error: "Nieprawidłowe dane zmiany kolejności", details: bodyResult.error.format() }),
        { status: 400 }
      );
    }

    // Sprawdzamy, czy mamy co najmniej dwie pozycje do zmiany
    if (bodyResult.data.note_positions.length < 2) {
      return new Response(JSON.stringify({ error: "Wymagane są co najmniej dwie notatki do zmiany kolejności" }), {
        status: 400,
      });
    }

    // Inicjalizacja serwisu z klientem Supabase z kontekstu
    const noteService = new NoteService(locals.supabase);

    // Zmiana kolejności notatek
    const result = await noteService.reorderNotes(projectId, bodyResult.data.note_positions);

    return new Response(JSON.stringify(result), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Błąd podczas zmiany kolejności notatek:", error);

    // Obsługa różnych typów błędów
    if (error instanceof Error) {
      const message = error.message;

      // Obsługa błędu 404 - Projekt lub notatki nie istnieją
      if (
        message.includes("nie istnieje") ||
        message.includes("does not exist") ||
        message.includes("Nie znaleziono")
      ) {
        return new Response(JSON.stringify({ error: message }), { status: 404 });
      }
    }

    // Domyślny błąd 500
    return new Response(JSON.stringify({ error: "Wystąpił błąd podczas zmiany kolejności notatek" }), { status: 500 });
  }
};

// Konfiguracja dla Astro - wyłączamy prerenderowanie dla API
export const prerender = false;
