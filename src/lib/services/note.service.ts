import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type {
  ConfigData,
  CreateConfigNoteDTO,
  CreateNoteDTO,
  NoteDetailDTO,
  NoteListItemDTO,
  NotePositionDTO,
  PaginatedResponse,
  UpdateConfigNoteDTO,
  UpdateNoteDTO,
} from "../../types";
import { createClient } from "../../db";

export class NoteService {
  private supabase: SupabaseClient<Database>;

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
  }

  /**
   * Pobiera listę notatek dla projektu z opcjonalną paginacją, sortowaniem i filtrowaniem
   */
  async getNotes(
    projectId: string,
    options: {
      sortBy?: string;
      order?: "asc" | "desc";
      page?: number;
      limit?: number;
      tag?: string;
      search?: string;
    }
  ): Promise<PaginatedResponse<NoteListItemDTO>> {
    const { sortBy = "position", order, page = 1, limit = 20, tag, search } = options;

    // Domyślna kolejność sortowania
    const sortOrder = order || (sortBy === "position" ? "asc" : "desc");

    // Obliczanie offsetu dla paginacji
    const offset = (page - 1) * limit;

    // Tworzymy zapytanie bazowe
    let query = this.supabase
      .from("notes")
      .select(
        `
        id, 
        title, 
        content,
        is_config_note, 
        position, 
        priority, 
        created_at, 
        updated_at,
        note_tags(tag_name)
      `,
        { count: "exact" }
      )
      .eq("project_id", projectId);

    // Dodajemy filtrowanie po tagu, jeśli określono
    if (tag) {
      // Pobieramy najpierw ID notatek z takim tagiem
      const { data: taggedNotes, error: tagError } = await this.supabase
        .from("note_tags")
        .select("note_id")
        .eq("tag_name", tag);

      if (tagError) {
        throw new Error(`Błąd podczas filtrowania po tagu: ${tagError.message}`);
      }

      // Jeśli znaleziono notatki z takim tagiem, filtrujemy po ich ID
      if (taggedNotes && taggedNotes.length > 0) {
        const noteIds = taggedNotes.map((tn) => tn.note_id);
        query = query.in("id", noteIds);
      } else {
        // Jeśli nie ma notatek z takim tagiem, zwracamy pustą listę
        return {
          data: [],
          pagination: {
            page,
            limit,
            total: 0,
            pages: 0,
          },
        };
      }
    }

    // Dodajemy wyszukiwanie, jeśli określono
    if (search) {
      // Szukamy tylko w tytule, zgodnie z wymaganiem
      query = query.ilike("title", `%${search}%`);
    }

    // Dodajemy sortowanie
    query = query.order(sortBy, { ascending: sortOrder === "asc" });

    // Dodajemy paginację
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Błąd podczas pobierania notatek: ${error.message}`);
    }

    // Transformacja danych do formatu DTO
    const notes: NoteListItemDTO[] = data.map((note) => ({
      id: note.id,
      title: note.title,
      content: note.content,
      is_config_note: note.is_config_note,
      position: note.position,
      priority: note.priority,
      created_at: note.created_at,
      updated_at: note.updated_at,
      tags: note.note_tags?.map((tag: { tag_name: string }) => tag.tag_name) || [],
    }));

    return {
      data: notes,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: count ? Math.ceil(count / limit) : 0,
      },
    };
  }

  /**
   * Pobiera szczegóły pojedynczej notatki
   */
  async getNote(projectId: string, noteId: string): Promise<NoteDetailDTO> {
    // Pobieramy notatkę z tagami
    const { data: note, error } = await this.supabase
      .from("notes")
      .select(
        `
        id, 
        title, 
        content, 
        is_config_note, 
        position, 
        priority, 
        created_at, 
        updated_at,
        note_tags(tag_name)
      `
      )
      .eq("project_id", projectId)
      .eq("id", noteId)
      .single();

    if (error) {
      throw new Error(`Błąd podczas pobierania notatki: ${error.message}`);
    }

    // Jeśli to notatka konfiguracyjna, pobieramy jej dane konfiguracyjne
    let configData: ConfigData | undefined;
    if (note.is_config_note) {
      const { data: config, error: configError } = await this.supabase
        .from("config_data")
        .select("*")
        .eq("note_id", noteId)
        .single();

      if (configError && configError.code !== "PGRST116") {
        // Ignorujemy błąd "nie znaleziono"
        throw new Error(`Błąd podczas pobierania danych konfiguracyjnych: ${configError.message}`);
      }

      if (config) {
        configData = {
          id: config.id,
          note_id: config.note_id,
          arrival_date: config.arrival_date,
          departure_date: config.departure_date,
          num_days: config.num_days,
          num_people: config.num_people,
          destination: config.destination || "",
          travel_style: config.travel_style || "",
          budget: config.budget || "",
          interests: config.interests || [],
          accommodation_address: "accommodation_address" in config ? config.accommodation_address || "" : "",
        };
      }
    }

    // Transformacja do formatu DTO
    return {
      id: note.id,
      title: note.title,
      content: note.content,
      is_config_note: note.is_config_note,
      position: note.position,
      priority: note.priority,
      created_at: note.created_at,
      updated_at: note.updated_at,
      tags: note.note_tags?.map((tag: { tag_name: string }) => tag.tag_name) || [],
      ...(configData && {
        config_data: {
          arrival_date: configData.arrival_date,
          departure_date: configData.departure_date,
          num_days: configData.num_days,
          num_people: configData.num_people,
          destination: configData.destination,
          travel_style: configData.travel_style,
          budget: configData.budget,
          interests: configData.interests,
          accommodation_address: configData.accommodation_address || "",
        },
      }),
    };
  }

  /**
   * Tworzy nową notatkę dla projektu
   */
  async createNote(projectId: string, noteData: CreateNoteDTO): Promise<NoteDetailDTO> {
    // Sprawdzamy, czy nie przekroczono limitu notatek
    const { count, error: countError } = await this.supabase
      .from("notes")
      .select("*", { count: "exact", head: true })
      .eq("project_id", projectId);

    if (countError) {
      throw new Error(`Błąd podczas sprawdzania limitu notatek: ${countError.message}`);
    }

    if (count && count >= 100) {
      throw new Error("Przekroczono limit 100 notatek dla projektu");
    }

    // Ustalamy najwyższą pozycję dla nowej notatki
    const { data: positions, error: posError } = await this.supabase
      .from("notes")
      .select("position")
      .eq("project_id", projectId)
      .order("position", { ascending: false })
      .limit(1);

    if (posError) {
      throw new Error(`Błąd podczas ustalania pozycji notatki: ${posError.message}`);
    }

    const nextPosition = positions && positions.length > 0 ? positions[0].position + 1 : 0;

    // Rozpoczynamy transakcję
    const { data, error } = await this.supabase.rpc("create_note_with_tags", {
      p_project_id: projectId,
      p_title: noteData.title,
      p_content: noteData.content,
      p_position: nextPosition,
      p_priority: noteData.priority || 0,
      p_is_config_note: false,
      p_tags: noteData.tags || [],
    });

    if (error) {
      throw new Error(`Błąd podczas tworzenia notatki: ${error.message}`);
    }

    // Pobieramy utworzoną notatkę
    return this.getNote(projectId, data.id);
  }

  /**
   * Tworzy notatkę konfiguracyjną dla projektu
   */
  async createConfigNote(projectId: string, configNoteData: CreateConfigNoteDTO): Promise<NoteDetailDTO> {
    // Sprawdzamy, czy istnieje już notatka konfiguracyjna
    const { count, error: countError } = await this.supabase
      .from("notes")
      .select("*", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("is_config_note", true);

    if (countError) {
      throw new Error(`Błąd podczas sprawdzania istniejącej notatki konfiguracyjnej: ${countError.message}`);
    }

    if (count && count > 0) {
      throw new Error("Projekt już posiada notatkę konfiguracyjną");
    }

    // Logowanie dla debugowania
    console.log("Dane config note przed zapisem do DB:", {
      destination: configNoteData.destination,
      accommodation_address: configNoteData.accommodation_address,
      budget: configNoteData.budget,
      interests: configNoteData.interests,
      travel_style: configNoteData.travel_style,
    });

    // Rozpoczynamy transakcję tworzenia notatki konfiguracyjnej
    const { data, error } = await this.supabase.rpc("create_config_note", {
      p_project_id: projectId,
      p_title: configNoteData.title,
      p_content: configNoteData.content,
      p_priority: 0, // Zawsze 0 dla notatki konfiguracyjnej
      p_arrival_date: configNoteData.arrival_date,
      p_departure_date: configNoteData.departure_date,
      p_num_days: configNoteData.num_days,
      p_num_people: configNoteData.num_people,
      p_tags: configNoteData.tags || [],
      p_destination: configNoteData.destination || "",
      p_travel_style: configNoteData.travel_style || "zwiedzanie",
      p_budget: configNoteData.budget || "",
      p_interests: configNoteData.interests || [],
      p_accommodation_address: configNoteData.accommodation_address || "",
    });

    if (error) {
      console.error("Błąd podczas tworzenia notatki konfiguracyjnej:", error);
      throw new Error(`Błąd podczas tworzenia notatki konfiguracyjnej: ${error.message}`);
    }

    // Funkcja create_config_note zwraca bezpośrednio UUID jako string
    const noteId = data;

    if (!noteId) {
      throw new Error("Nie udało się utworzyć notatki konfiguracyjnej - brak ID");
    }

    // Pobieramy utworzoną notatkę
    return this.getNote(projectId, noteId);
  }

  /**
   * Aktualizuje notatkę
   */
  async updateNote(projectId: string, noteId: string, updateData: UpdateNoteDTO): Promise<NoteDetailDTO> {
    // Sprawdzamy, czy notatka istnieje i należy do projektu
    const { data: existingNote, error: fetchError } = await this.supabase
      .from("notes")
      .select("id, is_config_note")
      .eq("id", noteId)
      .eq("project_id", projectId)
      .single();

    if (fetchError) {
      throw new Error(`Notatka nie istnieje lub nie należy do projektu: ${fetchError.message}`);
    }

    if (existingNote.is_config_note) {
      throw new Error("Nie można aktualizować notatki konfiguracyjnej poprzez ten endpoint");
    }

    // Przygotowujemy dane do aktualizacji
    const updateFields: Record<string, unknown> = {};
    if (updateData.title !== undefined) updateFields.title = updateData.title;
    if (updateData.content !== undefined) updateFields.content = updateData.content;
    if (updateData.priority !== undefined) updateFields.priority = updateData.priority;

    // Aktualizujemy podstawowe pola notatki
    if (Object.keys(updateFields).length > 0) {
      const { error: updateError } = await this.supabase.from("notes").update(updateFields).eq("id", noteId);

      if (updateError) {
        throw new Error(`Błąd podczas aktualizacji notatki: ${updateError.message}`);
      }
    }

    // Aktualizujemy tagi, jeśli zostały dostarczone
    if (updateData.tags !== undefined) {
      // Usuwamy istniejące tagi
      const { error: deleteTagsError } = await this.supabase.from("note_tags").delete().eq("note_id", noteId);

      if (deleteTagsError) {
        throw new Error(`Błąd podczas usuwania tagów: ${deleteTagsError.message}`);
      }

      // Dodajemy nowe tagi, jeśli istnieją
      if (updateData.tags.length > 0) {
        const tagsToInsert = updateData.tags.map((tag) => ({
          note_id: noteId,
          tag_name: tag,
        }));

        const { error: insertTagsError } = await this.supabase.from("note_tags").insert(tagsToInsert);

        if (insertTagsError) {
          throw new Error(`Błąd podczas dodawania tagów: ${insertTagsError.message}`);
        }
      }
    }

    // Pobieramy zaktualizowaną notatkę
    return this.getNote(projectId, noteId);
  }

  /**
   * Aktualizuje notatkę konfiguracyjną
   */
  async updateConfigNote(projectId: string, noteId: string, updateData: UpdateConfigNoteDTO): Promise<NoteDetailDTO> {
    // Sprawdzamy, czy notatka istnieje, należy do projektu i jest notatką konfiguracyjną
    const { data: existingNote, error: fetchError } = await this.supabase
      .from("notes")
      .select("id, is_config_note")
      .eq("id", noteId)
      .eq("project_id", projectId)
      .single();

    if (fetchError) {
      throw new Error(`Notatka nie istnieje lub nie należy do projektu: ${fetchError.message}`);
    }

    if (!existingNote.is_config_note) {
      throw new Error("Wskazana notatka nie jest notatką konfiguracyjną");
    }

    // Pobierz istniejące dane konfiguracyjne, aby obsłużyć sytuację, gdy przekazano pusty string
    const { data: existingConfigData, error: configError } = await this.supabase
      .from("config_data")
      .select("destination, travel_style, budget, accommodation_address")
      .eq("note_id", noteId)
      .single();

    if (configError) {
      console.error("Błąd podczas pobierania istniejących danych konfiguracyjnych:", configError);
    }

    // Logowanie dla debugowania
    console.log("Dane config note przed aktualizacją:", {
      noteId,
      projectId,
      destination: updateData.destination,
      accommodation_address: updateData.accommodation_address,
      budget: updateData.budget,
      interests: updateData.interests,
      travel_style: updateData.travel_style,
    });

    // UWAGA: Problem z pustymi stringami w funkcji SQL COALESCE
    // Z powodu niepoprawnego obsługiwania pustych stringów ("") przez funkcję COALESCE w SQL,
    // używamy wartości zastępczej "---EMPTY---" dla pustych pól, które będzie automatycznie
    // konwertowana na pusty string w warstwie prezentacji.

    // Przygotuj wartości dla pustych stringów, aby uniknąć problemów z COALESCE w funkcji SQL
    const specialEmptyValue = "---EMPTY---";
    const destination = updateData.destination === "" ? specialEmptyValue : updateData.destination;
    const travel_style = updateData.travel_style === "" ? specialEmptyValue : updateData.travel_style;
    const budget = updateData.budget === "" ? specialEmptyValue : updateData.budget;
    const accommodation_address =
      updateData.accommodation_address === "" ? specialEmptyValue : updateData.accommodation_address;

    // Rozpoczynamy transakcję - używamy zaktualizowanych wartości, które radzą sobie z pustymi stringami
    const { error } = await this.supabase.rpc("update_config_note", {
      p_note_id: noteId,
      p_title: updateData.title,
      p_content: updateData.content,
      p_priority: 0, // Zawsze 0 dla notatki konfiguracyjnej
      p_arrival_date: updateData.arrival_date,
      p_departure_date: updateData.departure_date,
      p_num_days: updateData.num_days,
      p_num_people: updateData.num_people,
      p_tags: updateData.tags || [],
      p_destination: destination,
      p_travel_style: travel_style || "zwiedzanie",
      p_budget: budget,
      p_interests: updateData.interests || [],
      p_accommodation_address: accommodation_address,
    });

    if (error) {
      throw new Error(`Błąd podczas aktualizacji notatki konfiguracyjnej: ${error.message}`);
    }

    // Jeśli używaliśmy specjalnej wartości dla pustych stringów, możemy teraz bezpośrednio
    // zaktualizować rekordy za pomocą Supabase, aby upewnić się, że wartości są poprawne
    if (
      destination === specialEmptyValue ||
      budget === specialEmptyValue ||
      travel_style === specialEmptyValue ||
      accommodation_address === specialEmptyValue
    ) {
      const updateFields: Record<string, string> = {};
      if (destination === specialEmptyValue) updateFields.destination = "";
      if (budget === specialEmptyValue) updateFields.budget = "";
      if (travel_style === specialEmptyValue) updateFields.travel_style = "";
      if (accommodation_address === specialEmptyValue) updateFields.accommodation_address = "";

      if (Object.keys(updateFields).length > 0) {
        const { error: directUpdateError } = await this.supabase
          .from("config_data")
          .update(updateFields)
          .eq("note_id", noteId);

        if (directUpdateError) {
          console.error("Błąd podczas bezpośredniego aktualizowania pustych wartości:", directUpdateError);
        }
      }
    }

    // Pobieramy zaktualizowaną notatkę
    return this.getNote(projectId, noteId);
  }

  /**
   * Usuwa notatkę
   */
  async deleteNote(projectId: string, noteId: string): Promise<void> {
    // Sprawdzamy, czy notatka istnieje i należy do projektu
    const { data: existingNote, error: fetchError } = await this.supabase
      .from("notes")
      .select("id, is_config_note")
      .eq("id", noteId)
      .eq("project_id", projectId)
      .single();

    if (fetchError) {
      throw new Error(`Notatka nie istnieje lub nie należy do projektu: ${fetchError.message}`);
    }

    // Usuwamy notatkę (tagi zostaną usunięte przez kasakdowe usuwanie)
    const { error } = await this.supabase.from("notes").delete().eq("id", noteId);

    if (error) {
      throw new Error(`Błąd podczas usuwania notatki: ${error.message}`);
    }

    // Jeśli to była notatka konfiguracyjna, aktualizujemy flagę w projekcie
    if (existingNote.is_config_note) {
      const { error: updateError } = await this.supabase
        .from("travel_projects")
        .update({ has_config_note: false })
        .eq("id", projectId);

      if (updateError) {
        throw new Error(`Błąd podczas aktualizacji projektu: ${updateError.message}`);
      }
    }
  }

  /**
   * Pobiera notatkę konfiguracyjną dla projektu
   */
  async getConfigNote(projectId: string): Promise<NoteDetailDTO> {
    // Znajdź ID notatki konfiguracyjnej dla projektu
    const { data: configNote, error: findError } = await this.supabase
      .from("notes")
      .select("id")
      .eq("project_id", projectId)
      .eq("is_config_note", true)
      .single();

    if (findError) {
      throw new Error("Notatka konfiguracyjna nie została znaleziona");
    }

    // Pobierz szczegóły notatki konfiguracyjnej
    return this.getNote(projectId, configNote.id);
  }

  /**
   * Zmienia kolejność notatek w projekcie
   */
  async reorderNotes(projectId: string, notePositions: NotePositionDTO[]): Promise<{ success: boolean }> {
    // Pobierz informacje o notatkach, aby zidentyfikować notatkę konfiguracyjną
    const { data: notes, error: notesError } = await this.supabase
      .from("notes")
      .select("id, is_config_note")
      .eq("project_id", projectId);

    if (notesError) {
      throw new Error(`Błąd podczas pobierania informacji o notatkach: ${notesError.message}`);
    }

    // Znajdź notatkę konfiguracyjną
    const configNote = notes.find((note) => note.is_config_note);

    // Zmodyfikuj pozycje tak, aby notatka konfiguracyjna była zawsze na pozycji 0
    const adjustedPositions = notePositions.map((pos) => {
      // Jeśli to notatka konfiguracyjna, ustaw pozycję 0
      if (configNote && pos.id === configNote.id) {
        return { ...pos, position: 0 };
      }

      // Jeśli istnieje notatka konfiguracyjna i ta notatka ma pozycję 0,
      // przesuń ją na pozycję 1 (aby nie kolidowała z notatką konfiguracyjną)
      if (configNote && pos.position === 0 && pos.id !== configNote.id) {
        return { ...pos, position: 1 };
      }

      // W przeciwnym razie zostaw pozycję bez zmian
      return pos;
    });

    // Jeśli istnieje notatka konfiguracyjna, upewnij się, że wszystkie inne notatki
    // mają pozycje większe niż 0
    if (configNote) {
      // Pobierz wszystkie inne notatki poza konfiguracyjną
      const otherNotes = adjustedPositions.filter((pos) => pos.id !== configNote.id);

      // Posortuj pozostałe notatki według pozycji
      otherNotes.sort((a, b) => a.position - b.position);

      // Przypisz nowe pozycje, zaczynając od 1
      otherNotes.forEach((note, index) => {
        note.position = index + 1;
      });

      // Połącz notatkę konfiguracyjną z pozostałymi notatkami
      const configPosition = adjustedPositions.find((pos) => pos.id === configNote.id);
      if (configPosition) {
        adjustedPositions.length = 0; // Wyczyść tablicę
        adjustedPositions.push(configPosition, ...otherNotes);
      }
    }

    // Rozpoczynamy transakcję aktualizacji pozycji
    try {
      const updatePromises = adjustedPositions.map((pos) =>
        this.supabase.from("notes").update({ position: pos.position }).eq("id", pos.id).eq("project_id", projectId)
      );

      await Promise.all(updatePromises);

      return { success: true };
    } catch (error) {
      throw new Error(`Błąd podczas aktualizacji pozycji notatek: ${(error as Error).message}`);
    }
  }
}

/**
 * Pobiera notatkę po ID
 */
export async function getNoteById(projectId: string, noteId: string): Promise<NoteDetailDTO | null> {
  const supabase = createClient();

  // Pobierz notatkę i sprawdź uprawnienia poprzez RLS
  const { data: note, error } = await supabase
    .from("notes")
    .select(
      `
      id,
      title,
      content,
      is_config_note,
      position,
      priority,
      created_at,
      updated_at
    `
    )
    .eq("id", noteId)
    .eq("project_id", projectId)
    .single();

  if (error || !note) {
    return null;
  }

  // Pobierz tagi dla notatki
  const { data: noteTags } = await supabase.from("note_tags").select("tag_name").eq("note_id", noteId);

  const tags = noteTags?.map((tag: { tag_name: string }) => tag.tag_name) || [];

  // Jeśli to notatka konfiguracyjna, pobierz dane konfiguracyjne
  let configData = null;
  if (note.is_config_note) {
    const { data: config } = await supabase
      .from("config_data")
      .select(
        "arrival_date, departure_date, num_days, num_people, destination, travel_style, budget, interests, accommodation_address"
      )
      .eq("note_id", noteId)
      .single();

    configData = config || null;
  }

  return {
    ...note,
    tags,
    config_data: configData,
  };
}

/**
 * Pobiera notatkę konfiguracyjną projektu
 */
export async function getConfigNote(projectId: string): Promise<NoteDetailDTO | null> {
  const supabase = createClient();

  // Pobierz notatkę konfiguracyjną projektu
  const { data: note, error } = await supabase
    .from("notes")
    .select(
      `
      id,
      title,
      content,
      is_config_note,
      position,
      priority,
      created_at,
      updated_at
    `
    )
    .eq("project_id", projectId)
    .eq("is_config_note", true)
    .single();

  if (error || !note) {
    return null;
  }

  // Pobierz tagi dla notatki
  const { data: noteTags } = await supabase.from("note_tags").select("tag_name").eq("note_id", note.id);

  const tags = noteTags?.map((tag: { tag_name: string }) => tag.tag_name) || [];

  // Pobierz dane konfiguracyjne
  const { data: config } = await supabase
    .from("config_data")
    .select(
      "arrival_date, departure_date, num_days, num_people, destination, travel_style, budget, interests, accommodation_address"
    )
    .eq("note_id", note.id)
    .single();

  return {
    ...note,
    tags,
    config_data: config
      ? {
          arrival_date: config.arrival_date,
          departure_date: config.departure_date,
          num_days: config.num_days,
          num_people: config.num_people,
          destination: config.destination || "",
          travel_style: config.travel_style || "",
          budget: config.budget || "",
          interests: config.interests || [],
          accommodation_address: config.accommodation_address || "",
        }
      : null,
  };
}

/**
 * Tworzy nową notatkę
 */
export async function createNote(_projectId: string, _data: CreateNoteDTO): Promise<NoteDetailDTO | null> {
  // Implementacja w API
  return null;
}

/**
 * Tworzy notatkę konfiguracyjną
 */
export async function createConfigNote(_projectId: string, _data: CreateConfigNoteDTO): Promise<NoteDetailDTO | null> {
  // Implementacja w API
  return null;
}

/**
 * Usuwa notatkę
 */
export async function deleteNote(_projectId: string, _noteId: string): Promise<boolean> {
  // Implementacja w API
  return false;
}

/**
 * Aktualizuje notatkę
 */
export async function updateNote(
  _projectId: string,
  _noteId: string,
  _data: UpdateNoteDTO
): Promise<NoteDetailDTO | null> {
  // Implementacja w API
  return null;
}

/**
 * Zmienia kolejność notatek
 */
export async function reorderNotes(
  _projectId: string,
  _notePositions: { id: string; position: number }[]
): Promise<boolean> {
  // Implementacja w API
  return false;
}
