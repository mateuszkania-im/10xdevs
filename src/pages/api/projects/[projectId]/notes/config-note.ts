import type { APIRoute } from "astro";

import { NoteService } from "../../../../../lib/services/note.service";
import {
  createConfigNoteSchema,
  notePathParamsSchema,
  updateConfigNoteSchema,
} from "../../../../../lib/validation/note.schema";

// Endpoint do tworzenia notatki konfiguracyjnej
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

    const bodyResult = createConfigNoteSchema.safeParse(body);
    if (!bodyResult.success) {
      return new Response(
        JSON.stringify({ error: "Nieprawidłowe dane notatki konfiguracyjnej", details: bodyResult.error.format() }),
        { status: 400 }
      );
    }

    // Inicjalizacja serwisu z klientem Supabase z kontekstu
    const noteService = new NoteService(locals.supabase);

    // Tworzenie notatki konfiguracyjnej
    const createdNote = await noteService.createConfigNote(projectId, bodyResult.data);

    return new Response(JSON.stringify(createdNote), { status: 201, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Błąd podczas tworzenia notatki konfiguracyjnej:", error);

    // Obsługa różnych typów błędów
    if (error instanceof Error) {
      const message = error.message;

      // Obsługa błędu 404 - Projekt nie istnieje
      if (message.includes("nie istnieje") || message.includes("does not exist")) {
        return new Response(JSON.stringify({ error: "Projekt nie został znaleziony" }), { status: 404 });
      }

      // Obsługa błędu 409 - Notatka konfiguracyjna już istnieje
      if (message.includes("już posiada") || message.includes("already has")) {
        return new Response(JSON.stringify({ error: "Projekt już posiada notatkę konfiguracyjną" }), { status: 409 });
      }
    }

    // Domyślny błąd 500
    return new Response(JSON.stringify({ error: "Wystąpił błąd podczas tworzenia notatki konfiguracyjnej" }), {
      status: 500,
    });
  }
};

// Endpoint do aktualizacji notatki konfiguracyjnej
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

    const bodyResult = updateConfigNoteSchema.safeParse(body);
    if (!bodyResult.success) {
      return new Response(
        JSON.stringify({ error: "Nieprawidłowe dane aktualizacji", details: bodyResult.error.format() }),
        { status: 400 }
      );
    }

    // Inicjalizacja serwisu z klientem Supabase z kontekstu
    const noteService = new NoteService(locals.supabase);

    // Najpierw musimy znaleźć notatkę konfiguracyjną dla projektu
    const { data: configNote, error: findError } = await locals.supabase
      .from("notes")
      .select("id")
      .eq("project_id", projectId)
      .eq("is_config_note", true)
      .single();

    if (findError) {
      return new Response(JSON.stringify({ error: "Notatka konfiguracyjna nie została znaleziona" }), { status: 404 });
    }

    // Aktualizacja notatki konfiguracyjnej
    const updatedNote = await noteService.updateConfigNote(projectId, configNote.id, bodyResult.data);

    // Oznacz wszystkie plany jako nieaktualne po aktualizacji notatki konfiguracyjnej
    const { error: updatePlansError } = await locals.supabase
      .from("travel_plans")
      .update({ is_outdated: true })
      .eq("project_id", projectId);

    if (updatePlansError) {
      console.error("Błąd podczas oznaczania planów jako nieaktualne:", updatePlansError);
    }

    return new Response(JSON.stringify(updatedNote), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Błąd podczas aktualizacji notatki konfiguracyjnej:", error);

    // Obsługa różnych typów błędów
    if (error instanceof Error) {
      const message = error.message;

      // Obsługa błędu 404 - Notatka lub projekt nie istnieje
      if (message.includes("nie istnieje") || message.includes("does not exist")) {
        return new Response(JSON.stringify({ error: "Notatka konfiguracyjna nie została znaleziona" }), {
          status: 404,
        });
      }

      // Obsługa błędu 400 - Notatka nie jest notatką konfiguracyjną
      if (message.includes("nie jest notatką konfiguracyjną")) {
        return new Response(JSON.stringify({ error: message }), { status: 400 });
      }
    }

    // Domyślny błąd 500
    return new Response(JSON.stringify({ error: "Wystąpił błąd podczas aktualizacji notatki konfiguracyjnej" }), {
      status: 500,
    });
  }
};

// Endpoint do pobierania notatki konfiguracyjnej
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

    const { projectId } = pathResult.data;

    // Inicjalizacja serwisu z klientem Supabase z kontekstu
    const noteService = new NoteService(locals.supabase);

    // Pobieranie notatki konfiguracyjnej
    const configNote = await noteService.getConfigNote(projectId);

    return new Response(JSON.stringify(configNote), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Błąd podczas pobierania notatki konfiguracyjnej:", error);

    // Obsługa różnych typów błędów
    if (error instanceof Error) {
      const message = error.message;

      // Obsługa błędu 404 - Notatka lub projekt nie istnieje
      if (message.includes("nie istnieje") || message.includes("does not exist")) {
        return new Response(JSON.stringify({ error: "Notatka konfiguracyjna nie została znaleziona" }), {
          status: 404,
        });
      }
    }

    // Domyślny błąd 500
    return new Response(JSON.stringify({ error: "Wystąpił błąd podczas pobierania notatki konfiguracyjnej" }), {
      status: 500,
    });
  }
};

// Konfiguracja dla Astro - wyłączamy prerenderowanie dla API
export const prerender = false;
