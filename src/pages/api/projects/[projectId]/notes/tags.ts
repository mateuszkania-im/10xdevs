import type { APIRoute } from "astro";
import { notePathParamsSchema } from "../../../../../lib/validation/note.schema";

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
    const supabase = locals.supabase;

    // Najpierw pobierz wszystkie ID notatek z projektu
    const { data: noteIds, error: noteError } = await supabase.from("notes").select("id").eq("project_id", projectId);

    if (noteError) {
      console.error("Błąd przy pobieraniu ID notatek:", noteError);
      return new Response(JSON.stringify({ error: "Nie udało się pobrać ID notatek" }), { status: 500 });
    }

    if (!noteIds || noteIds.length === 0) {
      // Jeśli nie ma notatek, zwróć pustą tablicę tagów
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Wyodrębnij ID notatek do tablicy
    const ids = noteIds.map((note) => note.id);

    // Teraz pobierz tagi dla tych notatek
    const { data: noteTags, error } = await supabase.from("note_tags").select("tag_name").in("note_id", ids);

    if (error) {
      console.error("Błąd przy pobieraniu tagów:", error);
      return new Response(JSON.stringify({ error: "Nie udało się pobrać tagów" }), { status: 500 });
    }

    // Zbierz wszystkie unikalne tagi
    const uniqueTags = new Set<string>();
    noteTags.forEach((noteTag) => {
      if (noteTag.tag_name && typeof noteTag.tag_name === "string" && noteTag.tag_name.trim() !== "") {
        uniqueTags.add(noteTag.tag_name.trim());
      }
    });

    // Zwróć listę wszystkich tagów
    return new Response(JSON.stringify(Array.from(uniqueTags)), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Nieoczekiwany błąd:", error);
    return new Response(JSON.stringify({ error: "Wystąpił nieoczekiwany błąd" }), { status: 500 });
  }
};

// Konfiguracja dla Astro - wyłączamy prerenderowanie dla API
export const prerender = false;
