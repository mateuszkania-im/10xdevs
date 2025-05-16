/**
 * Serwis do komunikacji z OpenRouter API
 */
export class OpenRouterService {
  private apiKey: string;
  private baseUrl = "https://openrouter.ai/api/v1";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    console.log(
      "[OpenRouterService] Inicjalizacja serwisu. Otrzymany apiKey (długość):",
      this.apiKey ? this.apiKey.length : "BRAK KLUCZA"
    );
  }

  /**
   * Generuje plan podróży używając modelu AI
   */
  async generateTravelPlan(
    prompt: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      model?: string;
    }
  ): Promise<StreamResponse> {
    try {
      // Przywracam oryginalny model zgodnie z oczekiwaniem
      const { temperature = 0.7, maxTokens = 4000, model = "openai/gpt-4o-mini" } = options || {};

      // Sprawdzamy ilość dni w planie, aby dostosować instrukcje
      const numDaysMatch = prompt.match(/na (\d+) dni/);
      const numDays = numDaysMatch ? parseInt(numDaysMatch[1], 10) : 7;

      // Instrukcja z ograniczeniem dni
      const limitInstruction =
        numDays > 5
          ? `UWAGA: Jeśli plan ma więcej niż 5 dni, ogranicz szczegółowy opis do pierwszych 5 dni. Pozostałe dni opisz bardzo zwięźle.`
          : "";

      // Dodajemy instrukcję formatowania do systemu
      const systemPrompt = `Jesteś ekspertem w planowaniu podróży. Twoim zadaniem jest stworzenie SZCZEGÓŁOWEGO planu podróży na podstawie notatek i wymagań użytkownika.

Generując plan, weź pod uwagę:
1. Wszystkie notatki dostarczone przez użytkownika - szczególnie te o wysokim priorytecie
2. Dane konfiguracyjne podróży (daty, liczba osób, budżet, styl podróży, zainteresowania)
3. Logistyczne aspekty podróży (czas przejazdu między atrakcjami, godziny otwarcia, itp.)

WAŻNE INSTRUKCJE:
- OGRANICZ LICZBĘ AKTYWNOŚCI DO MAKSYMALNIE 4 NA DZIEŃ!
- ${limitInstruction}

Pamiętaj, aby twój plan:
- Uwzględniał KONKRETNE miejsca w ${prompt.includes("docelowe:") ? prompt.split("docelowe:")[1].split("\n")[0].trim() : "miejscu docelowym"}
- Miał realistyczny harmonogram czasowy
- Zawierał różnorodne aktywności dopasowane do stylu podróży
- Uwzględniał budżet i zainteresowania podróżujących`;

      // Definiujemy schemat JSON zgodny z dokumentacją OpenRouter
      const jsonSchema = {
        name: "travel_plan",
        strict: true,
        schema: {
          type: "object",
          properties: {
            days: {
              type: "array",
              description: "Lista dni w planie podróży",
              items: {
                type: "object",
                properties: {
                  date: {
                    type: "string",
                    description: "Data dnia podróży w formacie YYYY-MM-DD",
                  },
                  activities: {
                    type: "array",
                    description: "Lista aktywności zaplanowanych na dany dzień",
                    items: {
                      type: "object",
                      properties: {
                        title: {
                          type: "string",
                          description: "Nazwa aktywności",
                        },
                        type: {
                          type: "string",
                          description: "Typ aktywności: sightseeing, meal, accommodation, transportation, free",
                        },
                        time: {
                          type: "string",
                          description: "Czas rozpoczęcia aktywności w formacie HH:MM",
                        },
                        location: {
                          type: "string",
                          description: "Nazwa miejsca, w którym odbywa się aktywność",
                        },
                        description: {
                          type: "string",
                          description: "Krótki opis aktywności",
                        },
                      },
                      additionalProperties: false,
                      required: ["title", "type", "time", "location", "description"],
                    },
                  },
                },
                additionalProperties: false,
                required: ["date", "activities"],
              },
            },
          },
          additionalProperties: false,
          required: ["days"],
        },
      };

      // Model i implementacja strukturyzowanych wyjść są różne dla różnych dostawców,
      // więc podejmiemy kilka prób z różnymi podejściami

      const responseFormat = {
        type: "json_schema",
        json_schema: jsonSchema,
      };

      // Dodajemy preferencje dostawcy, aby zapewnić wsparcie dla parametrów strukturyzowanych
      const requestBody = {
        model,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature,
        max_tokens: maxTokens,
        stream: true,
        response_format: responseFormat,
        provider: {
          require_parameters: true,
        },
      };

      console.log("Wysyłam zapytanie do OpenRouter API z modelem:", model);
      console.log(
        "[OpenRouterService] Użyty apiKey w żądaniu (pierwsze 5 znaków):",
        this.apiKey ? this.apiKey.substring(0, 5) : "BRAK KLUCZA"
      );

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "HTTP-Referer": "https://cityhooper.app",
          "X-Title": "CityHooper",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error("OpenRouter API error:", error);
        throw new Error(`OpenRouter API error: ${error.error?.message || error.message || response.statusText}`);
      }

      return response;
    } catch (error) {
      console.error("Nieoczekiwany błąd podczas komunikacji z OpenRouter API:", error);
      throw error;
    }
  }
}

/**
 * Typ dla odpowiedzi strumieniowej z OpenRouter
 */
export type StreamResponse = Response;
