import { createClient } from "@/db";
import type {
  ProjectDetailDTO,
  ProjectListItemDTO,
  CreateProjectDTO,
  UpdateProjectDTO,
  PaginatedResponse,
} from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";

// Definicja klasy ProjectService używanej w API
export class ProjectService {
  private supabase: SupabaseClient<Database>;

  constructor(supabaseClient: SupabaseClient<Database>) {
    this.supabase = supabaseClient;
  }

  /**
   * Pobiera listę projektów użytkownika z paginacją i sortowaniem
   */
  async list({
    userId,
    page = 1,
    limit = 10,
    sort_by = "updated_at",
    order = "desc",
  }: {
    userId: string;
    page?: number;
    limit?: number;
    sort_by?: string;
    order?: string;
  }): Promise<PaginatedResponse<ProjectListItemDTO>> {
    try {
      console.log("[ProjectService] Wywołano list z parametrami:", { userId, page, limit, sort_by, order });

      if (!userId || typeof userId !== "string") {
        throw new Error("Nieprawidłowy identyfikator użytkownika", { cause: 400 });
      }

      const offset = (page - 1) * limit;

      // 1) Liczba projektów
      const countQuery = this.supabase.from("travel_projects").select("*", { count: "exact", head: true }).eq("user_id", userId);
      const { count, error: countError } = await countQuery;

      if (countError) {
        const err = new Error(`Błąd podczas pobierania liczby projektów: ${countError.message}`);
        // @ts-ignore
        err.cause = 500;
        throw err;
      }

      // 2) Dane projektów
      const projectsQuery = this.supabase
        .from("travel_projects")
        .select("id, name, created_at, updated_at, last_notes_update_at")
        .eq("user_id", userId)
        .order(sort_by, { ascending: order === "asc" })
        .range(offset, offset + limit - 1);

      const { data, error } = await projectsQuery;

      if (error) {
        const err = new Error(`Błąd podczas pobierania listy projektów: ${error.message}`);
        // @ts-ignore
        err.cause = 500;
        throw err;
      }

      const totalPages = count ? Math.ceil(count / limit) : 0;

      const projects: ProjectListItemDTO[] = (data || []).map((project: any) => ({
        id: project.id,
        name: project.name,
        created_at: project.created_at,
        updated_at: project.updated_at,
        last_notes_update_at: project.last_notes_update_at,
        has_config_note: project.has_config_note ?? false,
      }));

      return {
        data: projects,
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: totalPages,
        },
      };
    } catch (error) {
      console.error("[ProjectService] Złapany błąd w metodzie list:", error);
      throw error;
    }
  }

  /**
   * Pobiera szczegóły projektu
   */
  async get({ userId, projectId }: { userId: string; projectId: string }): Promise<ProjectDetailDTO> {
    const { data, error } = await this.supabase
      .from("travel_projects")
      .select("*")
      .eq("id", projectId)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        const err = new Error("Projekt nie został znaleziony");
        // @ts-ignore
        err.cause = 404;
        throw err;
      }
      const err = new Error(`Błąd podczas pobierania projektu: ${error.message}`);
      // @ts-ignore
      err.cause = 500;
      throw err;
    }

    return {
      id: data.id,
      name: data.name,
      created_at: data.created_at,
      updated_at: data.updated_at,
      last_notes_update_at: data.last_notes_update_at,
      has_config_note: (data as any).has_config_note ?? false,
    };
  }

  /**
   * Alias dla metody get, używany w API
   */
  async getById(params: { userId: string; projectId: string }): Promise<ProjectDetailDTO> {
    return this.get(params);
  }

  /**
   * Tworzy nowy projekt
   */
  async create({ userId, dto }: { userId: string; dto: CreateProjectDTO }): Promise<ProjectDetailDTO> {
    // 1) Sprawdzenie limitu
    const { count, error: countError } = await this.supabase
      .from("travel_projects")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (countError) {
      const err = new Error(`Błąd podczas sprawdzania limitu projektów: ${countError.message}`);
      // @ts-ignore
      err.cause = 500;
      throw err;
    }

    if (count !== null && count >= 50) {
      const err = new Error("Osiągnięto maksymalny limit 50 projektów na użytkownika.");
      // @ts-ignore
      err.cause = 400;
      throw err;
    }

    // 2) Sprawdzenie istnienia projektu o tej samej nazwie
    const { data: existing, error: nameCheckError } = await this.supabase
      .from("travel_projects")
      .select("id")
      .eq("user_id", userId)
      .eq("name", dto.name)
      .maybeSingle();

    if (nameCheckError) {
      const err = new Error(`Błąd podczas sprawdzania nazwy projektu: ${nameCheckError.message}`);
      // @ts-ignore
      err.cause = 500;
      throw err;
    }

    if (existing) {
      const err = new Error("Projekt o takiej nazwie już istnieje.");
      // @ts-ignore
      err.cause = 409;
      throw err;
    }

    // 3) Insert
    const { data: insertedData, error: insertError } = await this.supabase
      .from("travel_projects")
      .insert([{ name: dto.name, user_id: userId }])
      .select()
      .single();

    if (insertError) {
      const err = new Error(`Błąd podczas tworzenia projektu: ${insertError.message}`);
      // @ts-ignore
      err.cause = 500;
      throw err;
    }

    if (!insertedData) {
      const err = new Error("Nie udało się utworzyć projektu. Brak danych zwrotnych po insercie.");
      // @ts-ignore
      err.cause = 500;
      throw err;
    }

    return {
      id: insertedData.id,
      name: insertedData.name,
      created_at: insertedData.created_at,
      updated_at: insertedData.updated_at,
      last_notes_update_at: insertedData.last_notes_update_at,
      has_config_note: (insertedData as any).has_config_note ?? false,
    };
  }

  /**
   * Aktualizuje projekt
   */
  async update({
    userId,
    projectId,
    dto,
  }: {
    userId: string;
    projectId: string;
    dto: UpdateProjectDTO;
  }): Promise<ProjectDetailDTO> {
    // Sprawdzamy, czy projekt istnieje i należy do użytkownika
    const { count, error: checkError } = await this.supabase
      .from("travel_projects")
      .select("*", { count: "exact", head: true })
      .eq("id", projectId)
      .eq("user_id", userId);

    if (checkError) {
      throw new Error(`Błąd podczas sprawdzania projektu: ${checkError.message}`);
    }

    if (!count) {
      throw new Error("Projekt nie został znaleziony", { cause: 404 });
    }

    const { data, error } = await this.supabase
      .from("travel_projects")
      .update({
        name: dto.name,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Błąd podczas aktualizacji projektu: ${error.message}`);
    }

    return {
      id: data.id,
      name: data.name,
      created_at: data.created_at,
      updated_at: data.updated_at,
      last_notes_update_at: data.last_notes_update_at,
      has_config_note: (data as any).has_config_note ?? false,
    };
  }

  /**
   * Usuwa projekt
   */
  async remove({ userId, projectId }: { userId: string; projectId: string }): Promise<{ success: boolean }> {
    // Sprawdzamy, czy projekt istnieje i należy do użytkownika
    const { count, error: checkError } = await this.supabase
      .from("travel_projects")
      .select("*", { count: "exact", head: true })
      .eq("id", projectId)
      .eq("user_id", userId);

    if (checkError) {
      throw new Error(`Błąd podczas sprawdzania projektu: ${checkError.message}`);
    }

    if (!count) {
      throw new Error("Projekt nie został znaleziony", { cause: 404 });
    }

    const { error } = await this.supabase.from("travel_projects").delete().eq("id", projectId).eq("user_id", userId);

    if (error) {
      throw new Error(`Błąd podczas usuwania projektu: ${error.message}`);
    }

    return { success: true };
  }
}

/**
 * Pobiera projekt po ID
 */
export async function getProjectById(projectId: string): Promise<ProjectDetailDTO | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.from("travel_projects").select("*").eq("id", projectId).single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    created_at: data.created_at,
    updated_at: data.updated_at,
    last_notes_update_at: data.last_notes_update_at,
    has_config_note: (data as any).has_config_note ?? false,
  };
}

/**
 * Pobiera listę projektów
 */
export async function getProjects(): Promise<ProjectListItemDTO[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.from("travel_projects").select("*").order("updated_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((project: any) => ({
    id: project.id,
    name: project.name,
    created_at: project.created_at,
    updated_at: project.updated_at,
    last_notes_update_at: project.last_notes_update_at,
    has_config_note: project.has_config_note ?? false,
  }));
}

/**
 * Tworzy nowy projekt
 */
export async function createProject(data: CreateProjectDTO): Promise<ProjectDetailDTO | null> {
  const supabase = await createClient();

  // @ts-ignore – minimalne dane wystarczają w tej warstwie demonstracyjnej
  const { data: newProject, error } = await supabase
    .from("travel_projects")
    .insert([{ name: data.name, user_id: "" as any }])
    .select()
    .single();

  if (error || !newProject) {
    return null;
  }

  return {
    id: newProject.id,
    name: newProject.name,
    created_at: newProject.created_at,
    updated_at: newProject.updated_at,
    last_notes_update_at: newProject.last_notes_update_at,
    has_config_note: (newProject as any).has_config_note ?? false,
  };
}

/**
 * Aktualizuje projekt
 */
export async function updateProject(projectId: string, data: UpdateProjectDTO): Promise<ProjectDetailDTO | null> {
  const supabase = await createClient();

  const { data: updatedProject, error } = await supabase
    .from("travel_projects")
    .update({
      name: data.name,
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId)
    .select()
    .single();

  if (error || !updatedProject) {
    return null;
  }

  return {
    id: updatedProject.id,
    name: updatedProject.name,
    created_at: updatedProject.created_at,
    updated_at: updatedProject.updated_at,
    last_notes_update_at: updatedProject.last_notes_update_at,
    has_config_note: (updatedProject as any).has_config_note ?? false,
  };
}

/**
 * Usuwa projekt
 */
export async function deleteProject(projectId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase.from("travel_projects").delete().eq("id", projectId);

  return !error;
}
