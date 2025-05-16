import type { APIRoute } from "astro";

import { NoteService } from "../../../../../lib/services/note.service";
import { notePathParamsSchema, updateNoteSchema } from "../../../../../lib/validation/note.schema";

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // Walidacja parametrów ścieżki
    const pathResult = notePathParamsSchema.safeParse(params);
    if (!pathResult.success) {
      return new Response(
        JSON.stringify({ error: "Nieprawidłowe parametry ścieżki", details: pathResult.error.format() }),
        { status: 400 }
      );
    }

    const { projectId, noteId } = pathResult.data;

    if (!noteId) {
      return new Response(JSON.stringify({ error: "Identyfikator notatki jest wymagany" }), { status: 400 });
    }

    // Inicjalizacja serwisu z klientem Supabase z kontekstu
    const noteService = new NoteService(locals.supabase);

    // Pobieranie szczegółów notatki
    const note = await noteService.getNote(projectId, noteId);

    return new Response(JSON.stringify(note), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Błąd podczas pobierania notatki:", error);

    // Obsługa różnych typów błędów
    if (error instanceof Error) {
      const message = error.message;

      // Obsługa błędu 404 - Notatka lub projekt nie istnieje
      if (message.includes("nie istnieje") || message.includes("does not exist")) {
        return new Response(JSON.stringify({ error: "Notatka nie została znaleziona" }), { status: 404 });
      }
    }

    // Domyślny błąd 500
    return new Response(JSON.stringify({ error: "Wystąpił błąd podczas pobierania notatki" }), { status: 500 });
  }
};

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    // Walidacja parametrów ścieżki
    const pathResult = notePathParamsSchema.safeParse(params);
    if (!pathResult.success) {
      return new Response(
        JSON.stringify({ error: "Nieprawidłowe parametry ścieżki", details: pathResult.error.format() }),
        { status: 400 }
      );
    }

    const { projectId, noteId } = pathResult.data;

    if (!noteId) {
      return new Response(JSON.stringify({ error: "Identyfikator notatki jest wymagany" }), { status: 400 });
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

    const bodyResult = updateNoteSchema.safeParse(body);
    if (!bodyResult.success) {
      return new Response(
        JSON.stringify({ error: "Nieprawidłowe dane aktualizacji", details: bodyResult.error.format() }),
        { status: 400 }
      );
    }

    // Inicjalizacja serwisu z klientem Supabase z kontekstu
    const noteService = new NoteService(locals.supabase);

    // Aktualizacja notatki
    const updatedNote = await noteService.updateNote(projectId, noteId, bodyResult.data);

    return new Response(JSON.stringify(updatedNote), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Błąd podczas aktualizacji notatki:", error);

    // Obsługa różnych typów błędów
    if (error instanceof Error) {
      const message = error.message;

      // Obsługa błędu 404 - Notatka lub projekt nie istnieje
      if (message.includes("nie istnieje") || message.includes("does not exist")) {
        return new Response(JSON.stringify({ error: "Notatka nie została znaleziona" }), { status: 404 });
      }

      // Notatka konfiguracyjna - błąd 400
      if (message.includes("konfiguracyjnej")) {
        return new Response(JSON.stringify({ error: message }), { status: 400 });
      }
    }

    // Domyślny błąd 500
    return new Response(JSON.stringify({ error: "Wystąpił błąd podczas aktualizacji notatki" }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    // Walidacja parametrów ścieżki
    const pathResult = notePathParamsSchema.safeParse(params);
    if (!pathResult.success) {
      return new Response(
        JSON.stringify({ error: "Nieprawidłowe parametry ścieżki", details: pathResult.error.format() }),
        { status: 400 }
      );
    }

    const { projectId, noteId } = pathResult.data;

    if (!noteId) {
      return new Response(JSON.stringify({ error: "Identyfikator notatki jest wymagany" }), { status: 400 });
    }

    // Sprawdzamy, czy to notatka konfiguracyjna przed usunięciem
    const { data: noteData } = await locals.supabase.from("notes").select("is_config_note").eq("id", noteId).single();

    const wasConfigNote = noteData?.is_config_note || false;

    // Inicjalizacja serwisu z klientem Supabase z kontekstu
    const noteService = new NoteService(locals.supabase);

    // Usuwanie notatki
    await noteService.deleteNote(projectId, noteId);

    // Pobierz aktualne informacje o projekcie po usunięciu notatki
    const { data: projectData } = await locals.supabase
      .from("travel_projects")
      .select("has_config_note")
      .eq("id", projectId)
      .single();

    // Zwracamy odpowiedź z informacją, czy projekt został zaktualizowany
    return new Response(
      JSON.stringify({
        success: true,
        projectUpdated: wasConfigNote,
        hasConfigNote: projectData?.has_config_note || false,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Błąd podczas usuwania notatki:", error);

    // Obsługa różnych typów błędów
    if (error instanceof Error) {
      const message = error.message;

      // Obsługa błędu 404 - Notatka lub projekt nie istnieje
      if (message.includes("nie istnieje") || message.includes("does not exist")) {
        return new Response(JSON.stringify({ error: "Notatka nie została znaleziona" }), { status: 404 });
      }
    }

    // Domyślny błąd 500
    return new Response(JSON.stringify({ error: "Wystąpił błąd podczas usuwania notatki" }), { status: 500 });
  }
};

// Konfiguracja dla Astro - wyłączamy prerenderowanie dla API
export const prerender = false;
