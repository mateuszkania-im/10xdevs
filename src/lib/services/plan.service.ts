import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type {
  TravelPlan,
  TravelPlanListItemDTO,
  TravelPlanDetailDTO,
  GeneratePlanDTO,
  UpdatePlanDTO,
  PlanComparisonDTO,
  PaginatedResponse,
  PlanContent,
  PlanDay,
  PlanActivity,
  ConfigData,
} from "../../types";
import { PdfExportService } from "./pdf-export.service";
import { OpenRouterService } from "./openrouter.service";

export class PlanService {
  private supabase: SupabaseClient<Database>;
  private pdfExportService: PdfExportService;

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
    this.pdfExportService = new PdfExportService();
  }

  /**
   * Pobiera listę planów podróży dla projektu z opcjonalną paginacją i sortowaniem
   */
  async getPlans(
    projectId: string,
    options: {
      includeOutdated?: boolean;
      sortBy?: string;
      order?: "asc" | "desc";
      page?: number;
      limit?: number;
    }
  ): Promise<PaginatedResponse<TravelPlanListItemDTO>> {
    const { includeOutdated = false, sortBy = "created_at", order = "desc", page = 1, limit = 20 } = options;

    // Obliczanie offsetu dla paginacji
    const offset = (page - 1) * limit;

    // Tworzymy zapytanie bazowe
    let query = this.supabase.from("travel_plans").select("*", { count: "exact" }).eq("project_id", projectId);

    // Filtrujemy nieaktualne plany, jeśli nie zażądano ich uwzględnienia
    if (!includeOutdated) {
      query = query.eq("is_outdated", false);
    }

    // Dodajemy sortowanie
    query = query.order(sortBy, { ascending: order === "asc" });

    // Dodajemy paginację
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Błąd podczas pobierania planów: ${error.message}`);
    }

    // Transformacja danych do formatu DTO
    const plans: TravelPlanListItemDTO[] = data.map((plan) => ({
      id: plan.id,
      version_name: plan.version_name,
      is_outdated: plan.is_outdated,
      created_at: plan.created_at,
      updated_at: plan.updated_at,
    }));

    return {
      data: plans,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: count ? Math.ceil(count / limit) : 0,
      },
    };
  }

  /**
   * Pobiera szczegóły pojedynczego planu podróży
   */
  async getPlan(projectId: string, planId: string): Promise<TravelPlanDetailDTO> {
    const { data: plan, error } = await this.supabase
      .from("travel_plans")
      .select("*")
      .eq("project_id", projectId)
      .eq("id", planId)
      .single();

    if (error) {
      throw new Error(`Błąd podczas pobierania planu: ${error.message}`);
    }

    return {
      id: plan.id,
      version_name: plan.version_name,
      content: plan.content as PlanContent,
      is_outdated: plan.is_outdated,
      created_at: plan.created_at,
      updated_at: plan.updated_at,
    };
  }

  /**
   * Generuje nowy plan podróży na podstawie danych konfiguracyjnych projektu
   */
  async generatePlan(projectId: string, generateData: GeneratePlanDTO): Promise<TravelPlanDetailDTO> {
    // Sprawdzamy, czy nie przekroczono limitu planów
    const { count, error: countError } = await this.supabase
      .from("travel_plans")
      .select("*", { count: "exact", head: true })
      .eq("project_id", projectId);

    if (countError) {
      throw new Error(`Błąd podczas sprawdzania limitu planów: ${countError.message}`);
    }

    if (count && count >= 20) {
      throw new Error("Przekroczono limit 20 planów dla projektu");
    }

    // Sprawdzamy unikalność version_name w obrębie projektu
    const { data: existingPlan, error: nameError } = await this.supabase
      .from("travel_plans")
      .select("id")
      .eq("project_id", projectId)
      .eq("version_name", generateData.version_name)
      .maybeSingle();

    if (nameError) {
      throw new Error(`Błąd podczas sprawdzania unikalności nazwy wersji: ${nameError.message}`);
    }

    if (existingPlan) {
      throw new Error(`Plan o nazwie wersji '${generateData.version_name}' już istnieje`);
    }

    // Pobieramy notatkę konfiguracyjną dla projektu
    const { data: configNote, error: configNoteError } = await this.supabase
      .from("notes")
      .select("id")
      .eq("project_id", projectId)
      .eq("is_config_note", true)
      .single();

    if (configNoteError) {
      throw new Error("Projekt musi posiadać notatkę konfiguracyjną do wygenerowania planu");
    }

    // Pobieramy dane konfiguracyjne
    const { data: configData, error: configDataError } = await this.supabase
      .from("config_data")
      .select("*")
      .eq("note_id", configNote.id)
      .single();

    if (configDataError) {
      throw new Error("Nie znaleziono danych konfiguracyjnych dla projektu");
    }

    // Generujemy zawartość planu na podstawie danych konfiguracyjnych
    const planContent = await this._generatePlanContent(configData, projectId);

    // Zapisujemy plan w bazie danych
    const { data: newPlan, error: insertError } = await this.supabase
      .from("travel_plans")
      .insert({
        project_id: projectId,
        version_name: generateData.version_name,
        content: planContent,
        is_outdated: false,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Błąd podczas zapisywania planu: ${insertError.message}`);
    }

    // Zwracamy utworzony plan
    return {
      id: newPlan.id,
      version_name: newPlan.version_name,
      content: newPlan.content as PlanContent,
      is_outdated: newPlan.is_outdated,
      created_at: newPlan.created_at,
      updated_at: newPlan.updated_at,
    };
  }

  /**
   * Aktualizuje istniejący plan podróży
   */
  async updatePlan(projectId: string, planId: string, updateData: UpdatePlanDTO): Promise<TravelPlanDetailDTO> {
    // Sprawdzamy, czy plan istnieje
    const { error: getError } = await this.supabase
      .from("travel_plans")
      .select("*")
      .eq("project_id", projectId)
      .eq("id", planId)
      .single();

    if (getError) {
      throw new Error(`Plan o ID ${planId} nie istnieje`);
    }

    // Przygotowujemy dane do aktualizacji
    const updateFields: Partial<TravelPlan> = {};

    if (updateData.version_name !== undefined) {
      // Sprawdzamy unikalność version_name w obrębie projektu
      const { data: nameCheck, error: nameError } = await this.supabase
        .from("travel_plans")
        .select("id")
        .eq("project_id", projectId)
        .eq("version_name", updateData.version_name)
        .neq("id", planId) // Wykluczamy bieżący plan
        .maybeSingle();

      if (nameError) {
        throw new Error(`Błąd podczas sprawdzania unikalności nazwy wersji: ${nameError.message}`);
      }

      if (nameCheck) {
        throw new Error(`Plan o nazwie wersji '${updateData.version_name}' już istnieje`);
      }

      updateFields.version_name = updateData.version_name;
    }

    if (updateData.content !== undefined) {
      updateFields.content = updateData.content;
    }

    // Wykonujemy aktualizację
    const { data: updatedPlan, error: updateError } = await this.supabase
      .from("travel_plans")
      .update({
        ...updateFields,
        updated_at: new Date().toISOString(),
      })
      .eq("id", planId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Błąd podczas aktualizacji planu: ${updateError.message}`);
    }

    // Zwracamy zaktualizowany plan
    return {
      id: updatedPlan.id,
      version_name: updatedPlan.version_name,
      content: updatedPlan.content as PlanContent,
      is_outdated: updatedPlan.is_outdated,
      created_at: updatedPlan.created_at,
      updated_at: updatedPlan.updated_at,
    };
  }

  /**
   * Usuwa plan podróży
   */
  async deletePlan(projectId: string, planId: string): Promise<void> {
    // Sprawdzamy, czy plan istnieje
    const { error: getError } = await this.supabase
      .from("travel_plans")
      .select("id")
      .eq("project_id", projectId)
      .eq("id", planId)
      .single();

    if (getError) {
      throw new Error(`Plan o ID ${planId} nie istnieje`);
    }

    // Usuwamy plan
    const { error: deleteError } = await this.supabase.from("travel_plans").delete().eq("id", planId);

    if (deleteError) {
      throw new Error(`Błąd podczas usuwania planu: ${deleteError.message}`);
    }
  }

  /**
   * Eksportuje plan podróży do formatu PDF
   */
  async exportPlanToPdf(projectId: string, planId: string): Promise<Uint8Array> {
    // Pobieramy szczegóły planu
    const plan = await this.getPlan(projectId, planId);

    // Eksportujemy plan do PDF
    return this.pdfExportService.exportPlanToPdf(plan);
  }

  /**
   * Porównuje dwa plany podróży i zwraca różnice
   */
  async comparePlans(projectId: string, plan1Id: string, plan2Id: string): Promise<PlanComparisonDTO> {
    // Pobieramy oba plany
    const [plan1, plan2] = await Promise.all([this.getPlan(projectId, plan1Id), this.getPlan(projectId, plan2Id)]);

    // Analizujemy różnice między planami
    const differences = this._comparePlansContent(plan1.content, plan2.content);

    return {
      plan1: {
        id: plan1.id,
        version_name: plan1.version_name,
      },
      plan2: {
        id: plan2.id,
        version_name: plan2.version_name,
      },
      differences,
    };
  }

  /**
   * Generuje zawartość planu na podstawie danych konfiguracyjnych i wszystkich notatek z projektu
   */
  private async _generatePlanContent(configData: ConfigData, projectId: string): Promise<PlanContent> {
    // Pobierz klucz API z zmiennych środowiskowych
    const apiKey = import.meta.env.OPENROUTER_API_KEY;
    console.log("[PlanService] Odczytano OPENROUTER_API_KEY:", apiKey ? "Klucz odczytany (długość: " + apiKey.length + ")" : "Klucz NIE został odczytany (undefined lub pusty)");

    if (!apiKey) {
      console.error("[PlanService] Błąd krytyczny: Brak klucza API dla OpenRouter. Sprawdź zmienne środowiskowe na Vercel!");
      throw new Error("Brak klucza API dla OpenRouter. Sprawdź zmienne środowiskowe.");
    }

    const openRouterService = new OpenRouterService(apiKey);

    // Pobierz wszystkie notatki z projektu
    const { data: notes, error: notesError } = await this.supabase
      .from("notes")
      .select("id, title, content, is_config_note, priority")
      .eq("project_id", projectId);

    if (notesError) {
      throw new Error(`Błąd podczas pobierania notatek: ${notesError.message}`);
    }

    try {
      // Podziel notatki na konfiguracyjne i zwykłe
      const configNote = notes.find((note) => note.is_config_note);
      const regularNotes = notes.filter((note) => !note.is_config_note);

      // Przygotuj prompt dla modelu AI
      const prompt = this._buildPrompt(configData, configNote, regularNotes);
      
      // Wywołaj API OpenRouter aby wygenerować plan
      const response = await openRouterService.generateTravelPlan(prompt);

      // Przetwórz odpowiedź strumieniową
      const reader = response.body?.getReader();
      let result = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Dekoduj chunk i dodaj do wyniku
          const chunk = new TextDecoder().decode(value);
          result += chunk;
        }
      }

      console.log("=== PRÓBKA ODPOWIEDZI OD MODELU AI ===");
      console.log(result.substring(0, 500) + "...");
      
      // Zbieramy dane ze strumienia SSE
      const dataLines = result.split("\n").filter((line) => line.startsWith("data: "));
      let combinedContent = "";
      
      if (dataLines.length > 0) {
        // Wyciągnij dane z każdej linii i połącz deltas
        for (const line of dataLines) {
          try {
            const dataContent = line.substring(6); // Usuwamy "data: "
            const parsed = JSON.parse(dataContent);
            if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content) {
              combinedContent += parsed.choices[0].delta.content;
            }
          } catch (e) {
            // Ignorujemy błędy parsowania poszczególnych chunków
          }
        }
      }
      
      // Parsujem połączone dane do obiektu
      try {
        console.log("Próba parsowania JSON...");
        const planData = JSON.parse(combinedContent);
        console.log("Udane parsowanie JSON!");
        
        // Weryfikacja struktury danych
        if (!planData.days || !Array.isArray(planData.days)) {
          console.error("Brak tablicy dni w odpowiedzi");
          return this._generateFallbackPlan(configData);
        }
        
        // Przekształć dane z formatu API do formatu PlanContent
        return this._transformToAppFormat(planData, configData);
      } catch (parseError) {
        console.error("Błąd podczas parsowania JSON:", parseError.message);
        console.error("Odpowiedź:", combinedContent);
        
        // Generujemy plan awaryjny gdy nie udało się sparsować JSON
        return this._generateFallbackPlan(configData);
      }
    } catch (error) {
      console.error("Błąd podczas generowania planu:", error);
      return this._generateFallbackPlan(configData);
    }
  }

  /**
   * Buduje prompt dla modelu AI uwzględniając wszystkie notatki
   */
  private _buildPrompt(configData: ConfigData, configNote: any, regularNotes: any[]): string {
    const {
      destination,
      num_days,
      travel_style,
      arrival_date,
      departure_date,
      budget,
      interests,
      num_people,
      accommodation_address,
    } = configData;

    // Początek promptu z podkreśleniem najważniejszych danych
    let prompt = `Stwórz SZCZEGÓŁOWY plan podróży do miejsca: ${destination.toUpperCase()} na ${num_days} dni.

KLUCZOWE INFORMACJE O PODRÓŻY:
- Miejsce docelowe: ${destination}
- Data przyjazdu: ${arrival_date}
- Data wyjazdu: ${departure_date}
- Liczba osób: ${num_people}
- Styl podróży: ${travel_style || "Nie określono"}
- Budżet: ${budget || "Nie określono"}
- Zainteresowania: ${interests?.join(", ") || "Nie określono"}
${accommodation_address ? `- Adres zakwaterowania: ${accommodation_address}` : ""}

WAŻNE: Ten plan MUSI zawierać KONKRETNE miejsca, atrakcje i restauracje w ${destination}. Nigdy nie twórz ogólnego planu bez szczegółów.

W planie podróży uwzględnij poniższe notatki i sugestie użytkownika.
Notatki są posortowane według priorytetu (od najważniejszych do najmniej ważnych):

`;

    // Dodaj treść notatek, posortowanych według priorytetu (od najwyższego)
    const sortedNotes = [...regularNotes].sort((a, b) => b.priority - a.priority);

    sortedNotes.forEach((note, index) => {
      prompt += `--- NOTATKA ${index + 1}: ${note.title} (priorytet: ${note.priority}) ---\n`;

      // Usuń znaczniki HTML z treści notatki
      const content = note.content ? this._stripHtml(note.content) : "Brak treści";
      prompt += `${content}\n\n`;
    });

    prompt += `
Stwórz szczegółowy plan podróży z konkretnymi atrakcjami, restauracjami i aktywnościami w ${destination}.
Uwzględnij realne czasy na przejazdy między atrakcjami i posiłki.
Każda aktywność musi mieć konkretną nazwę i lokalizację.

Odpowiedz w formacie JSON zgodnym z podaną strukturą.`;

    return prompt;
  }

  /**
   * Pomocnicza metoda do usuwania znaczników HTML z tekstu
   */
  private _stripHtml(html: string): string {
    // Prosty regex do usunięcia tagów HTML
    return html.replace(/<[^>]*>?/gm, "");
  }

  /**
   * Sprawdza poprawność struktury JSON dla planu
   */
  private _validatePlanJson(planData: any): void {
    // Sprawdź czy odpowiedź zawiera dni
    if (!planData.days || !Array.isArray(planData.days)) {
      throw new Error("Odpowiedź API nie zawiera poprawnej tablicy dni podróży");
    }

    // Sprawdź strukturę każdego dnia
    for (let i = 0; i < planData.days.length; i++) {
      const day = planData.days[i];
      
      // Sprawdź czy dzień ma wymagane pola
      if (!day.activities || !Array.isArray(day.activities)) {
        throw new Error(`Dzień ${i + 1} nie zawiera tablicy aktywności`);
      }
      
      // Sprawdź każdą aktywność w dniu
      for (let j = 0; j < day.activities.length; j++) {
        const activity = day.activities[j];
        
        // Sprawdź czy aktywność ma wymagane pola
        if (!activity.title) {
          throw new Error(`Aktywność ${j + 1} w dniu ${i + 1} nie zawiera tytułu`);
        }
      }
    }
  }

  /**
   * Przekształca format odpowiedzi z API do formatu aplikacji
   */
  private _transformToAppFormat(apiData: any, configData: ConfigData): PlanContent {
    // Najpierw zweryfikuj strukturę danych JSON
    this._validatePlanJson(apiData);

    try {
      // Mapowanie z formatu API do formatu aplikacji
      const days: PlanDay[] = apiData.days.map((day: any, index: number) => {
        return {
          day_number: index + 1,
          date: day.date || this._generateDateForDay(configData.arrival_date, index),
          weather: day.weather || null,
          summary: day.summary || null,
          activities: day.activities.map((activity: any) => {
            // Upewnij się, że wszystkie pola mają wartości
            return {
              time: this._extractTime(activity.time),
              name: activity.title || "Brak nazwy aktywności",
              description: activity.description || "",
              type: this._mapActivityType(activity.type || "other"),
              location: activity.location || "",
            };
          }),
        };
      });

      return { days };
    } catch (error) {
      throw new Error(`Nie udało się przekształcić danych z API: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Wyodrębnia czas z formatu "HH:MM - HH:MM" lub podobnego
   */
  private _extractTime(timeString: string): string {
    if (!timeString) return "09:00"; // Domyślny czas

    // Próbuj wyodrębnić pierwszy czas z formatu "HH:MM - HH:MM"
    const timeMatch = timeString.match(/(\d{1,2}:\d{2})/);
    if (timeMatch) {
      return timeMatch[1];
    }

    return timeString;
  }

  /**
   * Generuje datę dla danego dnia podróży
   */
  private _generateDateForDay(arrivalDate: string, dayOffset: number): string {
    try {
      const startDate = new Date(arrivalDate);
      const targetDate = new Date(startDate);
      targetDate.setDate(startDate.getDate() + dayOffset);
      return targetDate.toISOString().split("T")[0]; // Format YYYY-MM-DD
    } catch (e) {
      return "2023-01-01"; // Domyślna data
    }
  }

  /**
   * Mapuje typy aktywności z API do typów w aplikacji
   */
  private _mapActivityType(apiType: string): string {
    const typeMapping: Record<string, string> = {
      sightseeing: "sightseeing",
      attraction: "sightseeing",
      food: "meal",
      restaurant: "meal",
      accommodation: "accommodation",
      hotel: "accommodation",
      transportation: "transportation",
      transfer: "transportation",
      flight: "transportation",
      break: "free",
      "free time": "free",
    };

    return typeMapping[apiType.toLowerCase()] || "other";
  }

  /**
   * Generuje prosty plan awaryjny w przypadku błędu
   */
  private _generateFallbackPlan(configData: ConfigData): PlanContent {
    const { arrival_date, num_days } = configData;

    const startDate = new Date(arrival_date);
    const days: PlanDay[] = [];

    for (let i = 0; i < num_days; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);

      const formattedDate = currentDate.toISOString().split("T")[0];

      days.push({
        day_number: i + 1,
        date: formattedDate,
        activities: [
          {
            time: "09:00",
            name: "Śniadanie",
            description: "Rozpoczęcie dnia od śniadania",
            type: "meal",
          },
          {
            time: "10:00",
            name: "Zwiedzanie",
            description: "Zwiedzanie lokalnych atrakcji",
            type: "sightseeing",
          },
          {
            time: "13:00",
            name: "Obiad",
            description: "Przerwa na obiad",
            type: "meal",
          },
          {
            time: "15:00",
            name: "Czas wolny",
            description: "Czas na odpoczynek lub indywidualne zwiedzanie",
            type: "free",
          },
          {
            time: "19:00",
            name: "Kolacja",
            description: "Zakończenie dnia kolacją",
            type: "meal",
          },
        ],
      });
    }

    return { days };
  }

  /**
   * Pomocnicza metoda do porównywania zawartości planów
   */
  private _comparePlansContent(
    content1: PlanContent,
    content2: PlanContent
  ): {
    day: number;
    plan1_activities: PlanActivity[];
    plan2_activities: PlanActivity[];
  }[] {
    const differences: {
      day: number;
      plan1_activities: PlanActivity[];
      plan2_activities: PlanActivity[];
    }[] = [];

    // Pobieramy maksymalną liczbę dni z obu planów
    const maxDays = Math.max(content1.days.length, content2.days.length);

    for (let i = 0; i < maxDays; i++) {
      const day1 = content1.days[i];
      const day2 = content2.days[i];

      // Jeśli któryś z planów nie ma danego dnia, to jest to różnica
      if (!day1 || !day2) {
        differences.push({
          day: i + 1,
          plan1_activities: day1?.activities || [],
          plan2_activities: day2?.activities || [],
        });
        continue;
      }

      // Porównujemy aktywności w danym dniu
      const activities1 = day1.activities;
      const activities2 = day2.activities;

      // Proste porównanie - jeśli liczba aktywności jest różna, to jest to różnica
      if (activities1.length !== activities2.length) {
        differences.push({
          day: i + 1,
          plan1_activities: activities1,
          plan2_activities: activities2,
        });
        continue;
      }

      // Porównujemy poszczególne aktywności
      let hasDifferences = false;
      for (let j = 0; j < activities1.length; j++) {
        const act1 = activities1[j];
        const act2 = activities2[j];

        if (
          act1.time !== act2.time ||
          act1.name !== act2.name ||
          act1.description !== act2.description ||
          act1.type !== act2.type
        ) {
          hasDifferences = true;
          break;
        }
      }

      if (hasDifferences) {
        differences.push({
          day: i + 1,
          plan1_activities: activities1,
          plan2_activities: activities2,
        });
      }
    }

    return differences;
  }
}
