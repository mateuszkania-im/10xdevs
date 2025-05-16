import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProjectService } from "../project.service";
import type { ProjectDetailDTO, ProjectListItemDTO } from "../../../types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../db/database.types";

// Helper do tworzenia mock odpowiedzi Supabase
const mockSupabaseResponse = (data: any, error: any = null, count: number | null = null) => ({
  data,
  error,
  count,
});

// Mock dla Supabase query builder
const createMockQueryBuilder = (initialResponse?: { data: any; error?: any; count?: number | null }) => {
  let currentResponse = initialResponse ? Promise.resolve(initialResponse) : Promise.resolve(mockSupabaseResponse(null));

  const queryBuilderMock: any = {
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    // Metody zwracające Promise bezpośrednio (nie chaining)
    // Te mockResolvedValueOnce będą nadpisywane w testach dla konkretnych wywołań
    then: (onfulfilled: any, onrejected: any) => currentResponse.then(onfulfilled, onrejected),
    catch: (onrejected: any) => currentResponse.catch(onrejected),
    finally: (onfinally: any) => currentResponse.finally(onfinally),

    // Funkcja do ustawiania odpowiedzi dla tego konkretnego łańcucha
    mockResolvedValueOnce: (data: any, error: any = null, count: number | null = null) => {
      currentResponse = Promise.resolve(mockSupabaseResponse(data, error, count));
      return queryBuilderMock; // Umożliwia dalsze mockowanie tego samego obiektu, jeśli potrzebne
    },
     mockResolvedValue(data: any, error: any = null, count: number | null = null) {
      currentResponse = Promise.resolve(mockSupabaseResponse(data, error, count));
      return queryBuilderMock;
    }
  };
  
  // Dodanie [Symbol.toStringTag] dla lepszej obsługi przez Promise.resolve() i await
  Object.defineProperty(queryBuilderMock, Symbol.toStringTag, {
    value: 'Promise',
    writable: false,
    enumerable: false,
    configurable: true,
  });

  return queryBuilderMock;
};


// Mock dla klienta Supabase
const createMockSupabaseClient = () => {
  // Przechowujemy instancje queryBuilderów, aby móc je konfigurować w testach
  const queryBuilders: Record<string, ReturnType<typeof createMockQueryBuilder>> = {};

  const getQueryBuilder = (key: string, defaultResponse?: { data: any; error?: any; count?: number | null }) => {
    if (!queryBuilders[key]) {
      queryBuilders[key] = createMockQueryBuilder(defaultResponse);
    }
    return queryBuilders[key];
  };


  const supabaseMock = {
    from: vi.fn().mockImplementation((tableName: string) => {
      if (!queryBuilders[`insert-spy-${tableName}`]) {
        // wspólny spy dla insert w danej tabeli
        queryBuilders[`insert-spy-${tableName}`] = vi.fn().mockImplementation((dataToInsert: any) => newGetQueryBuilder(`${tableName}-insert`));
      }

      // Klucz może być bardziej unikalny, np. zliczający wywołania, jeśli potrzebne
      // Na razie, po prostu zwraca generyczny builder dla tej tabeli
      // Ważne, że każde wywołanie select/insert na tym zwróci *nowy* query builder
      // z własnym `currentResponse`
      const fromMock = {
        select: vi.fn().mockImplementation(() => getQueryBuilder(`${tableName}-select`)),
        insert: queryBuilders[`insert-spy-${tableName}`],
        update: vi.fn().mockImplementation(() => getQueryBuilder(`${tableName}-update`)),
        delete: vi.fn().mockImplementation(() => getQueryBuilder(`${tableName}-delete`)),
        // Dodajemy metody, które zwracają query builder, a na końcu jest .single() lub .maybeSingle()
        // Te metody (single, maybeSingle) będą musiały być częścią queryBuilderMock
      };
      // Dodajemy metody, które są bezpośrednio na wyniku .from(...).select(...), np. .single()
      // Te metody powinny zwracać ten sam query builder, ale być może zmieniać jego wewnętrzny stan
      // lub sposób w jaki resolvuje Promise.
      // Dla uproszczenia, na razie .single() i .maybeSingle() będą na końcu łańcucha i będą mockowane bezpośrednio
      // na query builderze zwróconym przez .select()
       queryBuilders[`${tableName}-select_single`] = createMockQueryBuilder();
       queryBuilders[`${tableName}-select_maybeSingle`] = createMockQueryBuilder();

      fromMock.select.mockImplementation((columns?: string, options?: any) => {
        const key = options?.head ? `${tableName}-select-count` : `${tableName}-select-data`;
        return getQueryBuilder(key);
      });
      
      // Specjalne mockowanie dla .single() i .maybeSingle() które są częścią query buildera
      // Należy je dodać do createMockQueryBuilder
      // queryBuilderMock.single = vi.fn().mockReturnThis(); // single powinno zwracać ten sam query builder
      // queryBuilderMock.maybeSingle = vi.fn().mockReturnThis(); // maybeSingle powinno zwracać ten sam query builder
      // A w testach będziemy robić mockSupabase.from(...).select(...).single().mockResolvedValueOnce(...)
      // Co oznacza, że .single() musi być częścią QueryBuilder.

      return fromMock;
    }),
    rpc: vi.fn().mockImplementation((procedureName: string) => getQueryBuilder(`rpc-${procedureName}`)),
    // Przechowujemy referencje do query builderów, aby móc je konfigurować w testach
    // np. mockSupabase.queryBuilders['travel_projects-select-data'].mockResolvedValueOnce(...)
    __queryBuilders: queryBuilders, 
  };

  // Modyfikacja createMockQueryBuilder, aby zawierał single i maybeSingle
  // Te metody powinny zwracać 'this' (QueryBuilder), a Promise jest rozwiązywany na końcu.
  const originalCreateMockQueryBuilder = createMockQueryBuilder;
  const enhancedCreateMockQueryBuilder = (initialResponse?: { data: any; error?: any; count?: number | null }) => {
    const qb = originalCreateMockQueryBuilder(initialResponse);
    qb.single = vi.fn().mockReturnThis(); // Zwraca 'this' dla chainingu
    qb.maybeSingle = vi.fn().mockReturnThis(); // Zwraca 'this' dla chainingu
    return qb;
  };
  
  // Aktualizacja getQueryBuilder, aby używał nowej wersji
   /* const originalGetQueryBuilder = getQueryBuilder; */
   const newGetQueryBuilder = (key: string, defaultResponse?: { data: any; error?: any; count?: number | null }) => {
    if (!queryBuilders[key]) {
      queryBuilders[key] = enhancedCreateMockQueryBuilder(defaultResponse);
    }
    return queryBuilders[key]; // zwróć tę samą instancję, aby można było assercje na spy
  };
  
  // Nadpisanie metod w supabaseMock, aby używały enhanced query builder
   supabaseMock.from.mockImplementation((tableName: string) => {
      const fromMock = {
        select: vi.fn().mockImplementation((columns?: string, options?: any) => {
            const keySuffix = options?.head ? 'select-count' : (options?.single ? 'select-single' : (options?.maybeSingle ? 'select-maybeSingle' : 'select-data'));
            return newGetQueryBuilder(`${tableName}-${keySuffix}`);
        }),
        insert: vi.fn().mockImplementation((dataToInsert: any) => newGetQueryBuilder(`${tableName}-insert`)),
        update: vi.fn().mockImplementation(() => newGetQueryBuilder(`${tableName}-update`)),
        delete: vi.fn().mockImplementation(() => newGetQueryBuilder(`${tableName}-delete`)),
      };
      return fromMock;
    });
   supabaseMock.rpc.mockImplementation((procedureName: string) => newGetQueryBuilder(`rpc-${procedureName}`));


  return supabaseMock;
};


describe("ProjectService", () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;
  let projectService: ProjectService;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    projectService = new ProjectService(mockSupabase as unknown as SupabaseClient<Database>);
    vi.clearAllMocks();
  });

  describe("list", () => {
    it("powinien zwrócić listę projektów z paginacją", async () => {
      const projects: ProjectListItemDTO[] = [
        { id: "1", name: "Projekt 1", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), last_notes_update_at: new Date().toISOString(), has_config_note: false },
        { id: "2", name: "Projekt 2", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), last_notes_update_at: new Date().toISOString(), has_config_note: false },
      ];

      // Konfiguracja mocków dla poszczególnych kroków zapytania
      // 1. Zapytanie o liczbę projektów (count)
      mockSupabase.from("travel_projects").select("*", { count: "exact", head: true })
        .mockResolvedValueOnce(null, null, 2);
      
      // 2. Zapytanie o listę projektów (dane)
      mockSupabase.from("travel_projects").select("id, name, created_at, updated_at, last_notes_update_at")
        .mockResolvedValueOnce(projects);

      const result = await projectService.list({
        userId: "user-1",
        page: 1,
        limit: 10,
        sort_by: "created_at",
        order: "desc",
      });

      expect(mockSupabase.from).toHaveBeenCalledWith("travel_projects");
      
      const countQueryBuilder = mockSupabase.from("travel_projects").select("*", { count: "exact", head: true });
      expect(countQueryBuilder.eq).toHaveBeenCalledWith("user_id", "user-1");
      
      const dataQueryBuilder = mockSupabase.from("travel_projects").select("id, name, created_at, updated_at, last_notes_update_at");
      expect(dataQueryBuilder.eq).toHaveBeenCalledWith("user_id", "user-1");
      expect(dataQueryBuilder.order).toHaveBeenCalledWith("created_at", { ascending: false });
      expect(dataQueryBuilder.range).toHaveBeenCalledWith(0, 9);
      
      expect(result.data).toEqual(projects);
      expect(result.pagination).toEqual({ page: 1, limit: 10, total: 2, pages: 1 });
    });

    it("powinien rzucić błąd gdy wystąpi problem z pobieraniem liczby projektów", async () => {
      const errorMessage = "Błąd serwera Supabase";
      mockSupabase.from("travel_projects").select("*", { count: "exact", head: true })
        .mockResolvedValueOnce(null, { message: errorMessage, code: "500" }, null);

      await expect(
        projectService.list({ userId: "user-1", page: 1, limit: 10, sort_by: "created_at", order: "desc" })
      ).rejects.toThrow(`Błąd podczas pobierania liczby projektów: ${errorMessage}`);
    });

     it("powinien rzucić błąd gdy wystąpi problem z pobieraniem listy projektów", async () => {
      const errorMessage = "Błąd serwera Supabase przy danych";
      mockSupabase.from("travel_projects").select("*", { count: "exact", head: true })
        .mockResolvedValueOnce(null, null, 5); // Count OK
      mockSupabase.from("travel_projects").select("id, name, created_at, updated_at, last_notes_update_at")
        .mockResolvedValueOnce(null, { message: errorMessage, code: "500" }); // Data error

      await expect(
        projectService.list({ userId: "user-1", page: 1, limit: 10, sort_by: "created_at", order: "desc" })
      ).rejects.toThrow(`Błąd podczas pobierania listy projektów: ${errorMessage}`);
    });
  });

  describe("getById", () => {
    it("powinien zwrócić szczegóły projektu", async () => {
      const project: ProjectDetailDTO = {
        id: "1", name: "Projekt 1", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), last_notes_update_at: new Date().toISOString(), has_config_note: false,
      };
      
      mockSupabase.from("travel_projects").select("*").single()
        .mockResolvedValueOnce(project);

      const result = await projectService.getById({ userId: "user-1", projectId: "1" });

      const queryBuilder = mockSupabase.from("travel_projects").select("*").single();
      expect(queryBuilder.eq).toHaveBeenCalledWith("id", "1");
      expect(queryBuilder.eq).toHaveBeenCalledWith("user_id", "user-1");
      expect(result).toEqual(project);
    });

    it("powinien rzucić błąd 404 gdy projekt nie istnieje", async () => {
      mockSupabase.from("travel_projects").select("*").single()
        .mockResolvedValueOnce(null, { code: "PGRST116", message: "Row not found" });

      try {
        await projectService.getById({ userId: "user-1", projectId: "nieistniejący-id" });
      } catch (error: any) {
        expect(error.message).toBe("Projekt nie został znaleziony");
        expect(error.cause).toBe(404);
      }
    });

     it("powinien rzucić błąd serwera gdy wystąpi inny błąd", async () => {
      const serverError = { code: "SOME_OTHER_ERROR", message: "Internal Server Error" };
      mockSupabase.from("travel_projects").select("*").single()
        .mockResolvedValueOnce(null, serverError);
      
      try {
        await projectService.getById({ userId: "user-1", projectId: "1" });
      } catch (error: any) {
        expect(error.message).toBe(`Błąd podczas pobierania projektu: ${serverError.message}`);
        expect(error.cause).toBe(500);
      }
    });
  });

  describe("create", () => {
    const newProjectData = { name: "Nowy Projekt" };

    it("powinien rzucić błąd 400 gdy przekroczono limit projektów", async () => {
      mockSupabase.from("travel_projects").select("*", { count: "exact", head: true })
        .mockResolvedValueOnce(null, null, 50); // Osiągnięto limit

      try {
        await projectService.create({ userId: "user-1", dto: newProjectData });
      } catch (error: any) {
        expect(error.message).toBe("Osiągnięto maksymalny limit 50 projektów na użytkownika.");
        expect(error.cause).toBe(400);
      }
    });

    it("powinien rzucić błąd 409 gdy nazwa projektu już istnieje", async () => {
      mockSupabase.from("travel_projects").select("*", { count: "exact", head: true })
        .mockResolvedValueOnce(null, null, 5); 
      mockSupabase.from("travel_projects").select("id").maybeSingle()
        .mockResolvedValueOnce({ id: "existing-id" }); // Konflikt nazwy

      try {
        await projectService.create({ userId: "user-1", dto: { name: "Istniejący Projekt" } });
      } catch (error: any) {
        expect(error.message).toBe("Projekt o takiej nazwie już istnieje.");
        expect(error.cause).toBe(409);
      }
    });

     it("powinien rzucić błąd gdy wystąpi błąd podczas sprawdzania limitu projektów", async () => {
        const countError = { message: "Błąd przy count", code: "DB_ERROR" };
        mockSupabase.from("travel_projects").select("*", { count: "exact", head: true })
          .mockResolvedValueOnce(null, countError, null);
        try {
            await projectService.create({ userId: "user-1", dto: newProjectData });
        } catch (error: any) {
            expect(error.message).toBe(`Błąd podczas sprawdzania limitu projektów: ${countError.message}`);
            expect(error.cause).toBe(500);
        }
    });

    it("powinien rzucić błąd gdy wystąpi błąd podczas sprawdzania nazwy projektu", async () => {
        const nameCheckError = { message: "Błąd przy sprawdzaniu nazwy", code: "DB_ERROR" };
        mockSupabase.from("travel_projects").select("*", { count: "exact", head: true })
          .mockResolvedValueOnce(null, null, 5);
        mockSupabase.from("travel_projects").select("id").maybeSingle()
          .mockResolvedValueOnce(null, nameCheckError); 

        try {
            await projectService.create({ userId: "user-1", dto: newProjectData });
        } catch (error: any) {
            expect(error.message).toBe(`Błąd podczas sprawdzania nazwy projektu: ${nameCheckError.message}`);
            expect(error.cause).toBe(500);
        }
    });

    it("powinien rzucić błąd gdy wystąpi błąd podczas tworzenia projektu (insert)", async () => {
        const insertError = { message: "Błąd przy insert", code: "DB_ERROR" };
        mockSupabase.from("travel_projects").select("*", { count: "exact", head: true })
          .mockResolvedValueOnce(null, null, 5);
        mockSupabase.from("travel_projects").select("id").maybeSingle()
          .mockResolvedValueOnce(null); 
        // Kluczowa zmiana: insert().select().single() jest jednym ciągiem w kodzie serwisu
        // const { data: insertedData, error: insertError } = await this.supabase
        // .from("travel_projects")
        // .insert(projectToInsert)
        // .select()
        // .single();
        // Więc mockujemy cały ten łańcuch
        mockSupabase.from("travel_projects").insert([{ user_id: "user-1", name: newProjectData.name }])
            // .select().single() // Te są implicite w mocku QueryBuildera teraz
            .mockResolvedValueOnce(null, insertError);

        try {
            await projectService.create({ userId: "user-1", dto: newProjectData });
        } catch (error: any) {
            expect(error.message).toBe(`Błąd podczas tworzenia projektu: ${insertError.message}`);
            expect(error.cause).toBe(500);
        }
    });

     it("powinien rzucić błąd gdy insert...select...single zwróci puste dane", async () => {
        mockSupabase.from("travel_projects").select("*", { count: "exact", head: true })
          .mockResolvedValueOnce(null, null, 5);
        mockSupabase.from("travel_projects").select("id").maybeSingle()
          .mockResolvedValueOnce(null);
        mockSupabase.from("travel_projects").insert([{ user_id: "user-1", name: newProjectData.name }])
          .mockResolvedValueOnce(null); // Symulacja pustej odpowiedzi

        try {
            await projectService.create({ userId: "user-1", dto: newProjectData });
        } catch (error: any) {
            // Ten komunikat błędu pochodzi z logiki w ProjectService
            expect(error.message).toBe("Nie udało się utworzyć projektu. Brak danych zwrotnych po insercie.");
            expect(error.cause).toBe(500);
        }
    });
  });
});
