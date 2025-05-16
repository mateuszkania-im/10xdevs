import { z } from "zod";

// Schemat walidacji dla danych konfiguracyjnych notatki
export const configNoteSchema = z
  .object({
    arrival_date: z
      .string({ required_error: "Data przyjazdu jest wymagana." })
      .date("Nieprawidłowy format daty przyjazdu.")
      .refine((date) => !!date, "Data przyjazdu jest wymagana."), // Dodatkowa walidacja na pusty string

    departure_date: z
      .string({ required_error: "Data wyjazdu jest wymagana." })
      .date("Nieprawidłowy format daty wyjazdu.")
      .refine((date) => !!date, "Data wyjazdu jest wymagana."), // Dodatkowa walidacja na pusty string

    num_days: z.number().int().positive().optional(), // Obliczane automatycznie

    num_people: z.coerce // Używamy coerce, aby automatycznie konwertować string z inputu na number
      .number({ invalid_type_error: "Liczba osób musi być liczbą." })
      .int("Liczba osób musi być liczbą całkowitą.")
      .min(1, "Liczba osób musi wynosić co najmniej 1.")
      .default(1), // Dodajemy wartość domyślną 1

    destination: z.string().trim().min(1, "Cel podróży jest wymagany."),

    accommodation_address: z.string().trim().optional(),

    travel_style: z.string().trim().optional(),

    budget: z.string().trim().optional(), // Można dodać walidację regex dla formatu waluty, jeśli potrzebne

    interests: z
      .array(z.string().trim().min(1, "Zainteresowanie nie może być puste."))
      .max(10, "Można dodać maksymalnie 10 zainteresowań.")
      .optional(),
  })
  // Walidacja sprawdzająca, czy data wyjazdu jest późniejsza lub równa dacie przyjazdu
  .refine(
    (data) => {
      if (data.arrival_date && data.departure_date) {
        return new Date(data.departure_date) >= new Date(data.arrival_date);
      }
      return true; // Jeśli brakuje którejś daty, pomijamy walidację
    },
    {
      message: "Data wyjazdu nie może być wcześniejsza niż data przyjazdu.",
      path: ["departure_date"], // Przypisujemy błąd do pola daty wyjazdu
    }
  );

// Typ TypeScript wywnioskowany ze schematu Zod
export type ConfigNoteData = z.infer<typeof configNoteSchema>;
