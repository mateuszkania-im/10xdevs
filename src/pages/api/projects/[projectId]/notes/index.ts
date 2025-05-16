import type { APIRoute } from "astro";

import { NoteService } from "../../../../../lib/services/note.service";
import {
  createNoteSchema,
  notePathParamsSchema,
  noteQueryParamsSchema,
} from "../../../../../lib/validation/note.schema";

export const GET: APIRoute = async ({ params, request, locals }) => {
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

    // Pobranie i walidacja parametrów zapytania
    const url = new URL(request.url);
    const queryParams = {
      sort_by: url.searchParams.get("sort_by"),
      order: url.searchParams.get("order"),
      page: url.searchParams.get("page"),
      limit: url.searchParams.get("limit"),
      tag: url.searchParams.get("tag"),
      search: url.searchParams.get("search"),
    };

    // Log parametrów zapytania dla celów debugowania
    console.log("API zapytanie - parametry:", {
      projectId,
      queryParams,
    });

    const queryResult = noteQueryParamsSchema.safeParse(queryParams);
    if (!queryResult.success) {
      return new Response(
        JSON.stringify({ error: "Nieprawidłowe parametry zapytania", details: queryResult.error.format() }),
        { status: 400 }
      );
    }

    // Inicjalizacja serwisu z klientem Supabase z kontekstu
    const noteService = new NoteService(locals.supabase);

    // Pobieranie notatek z użyciem zwalidowanych parametrów
    const result = await noteService.getNotes(projectId, {
      sortBy: queryResult.data.sort_by,
      order: queryResult.data.order,
      page: queryResult.data.page,
      limit: queryResult.data.limit,
      tag: queryResult.data.tag,
      search: queryResult.data.search,
    });

    return new Response(JSON.stringify(result), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Błąd podczas pobierania listy notatek:", error);

    // Obsługa różnych typów błędów
    if (error instanceof Error) {
      const message = error.message;

      // Obsługa błędu 404 - Projekt nie istnieje
      if (message.includes("nie istnieje") || message.includes("does not exist")) {
        return new Response(JSON.stringify({ error: "Projekt nie został znaleziony" }), { status: 404 });
      }
    }

    // Domyślny błąd 500
    return new Response(JSON.stringify({ error: "Wystąpił błąd podczas pobierania notatek" }), { status: 500 });
  }
};

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

    const bodyResult = createNoteSchema.safeParse(body);
    if (!bodyResult.success) {
      return new Response(JSON.stringify({ error: "Nieprawidłowe dane notatki", details: bodyResult.error.format() }), {
        status: 400,
      });
    }

    // Inicjalizacja serwisu z klientem Supabase z kontekstu
    const noteService = new NoteService(locals.supabase);

    // Tworzenie nowej notatki
    const createdNote = await noteService.createNote(projectId, bodyResult.data);

    return new Response(JSON.stringify(createdNote), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Błąd podczas tworzenia notatki:", error);

    // Obsługa różnych typów błędów
    if (error instanceof Error) {
      const message = error.message;

      // Obsługa błędu 404 - Projekt nie istnieje
      if (message.includes("nie istnieje") || message.includes("does not exist")) {
        return new Response(JSON.stringify({ error: "Projekt nie został znaleziony" }), { status: 404 });
      }

      // Obsługa błędu 400 - Limit notatek
      if (message.includes("limit") || message.includes("Przekroczono")) {
        return new Response(JSON.stringify({ error: message }), { status: 400 });
      }

      // Obsługa błędu związanego z trigger'em - dodanie wyjaśnienia
      if (message.includes("trigger") || message.includes("nieaktual")) {
        return new Response(
          JSON.stringify({
            error: message,
            info: "Po dodaniu notatki istniejące plany pozostaną aktualne",
          }),
          { status: 200 }
        );
      }
    }

    // Domyślny błąd 500
    return new Response(JSON.stringify({ error: "Wystąpił błąd podczas tworzenia notatki" }), { status: 500 });
  }
};

// Konfiguracja dla Astro - wyłączamy prerenderowanie dla API
export const prerender = false;
