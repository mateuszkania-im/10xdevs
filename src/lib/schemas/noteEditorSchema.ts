import { z } from "zod";
import dayjs from "dayjs";
import type { NoteEditorVM } from "@/types";

// Schemat dla tagów - pattern: /^[a-z0-9_-]{1,30}$/i, max 20 tagów
const tagSchema = z.string().regex(/^[a-z0-9_-]{1,30}$/i, {
  message: "Tag może zawierać tylko litery, cyfry, podkreślenia i myślniki (maks. 30 znaków)",
});

// Wspólne pola dla obu typów notatek
const baseNoteSchema = z.object({
  title: z
    .string()
    .min(3, { message: "Tytuł musi mieć co najmniej 3 znaki" })
    .max(200, { message: "Tytuł nie może przekraczać 200 znaków" }),
  content: z.string().nullable(),
  tags: z.array(tagSchema).max(20, { message: "Maksymalna liczba tagów to 20" }),
  // priority będzie różne dla config i regular, więc definiujemy je osobno
});

// Notatka konfiguracyjna
const configNoteSchema = baseNoteSchema.extend({
  isConfig: z.literal(true),
  priority: z.number().min(0).max(10).default(0),
  arrival_date: z.string().nonempty({ message: "Data przyjazdu jest wymagana" }),
  departure_date: z.string().nonempty({ message: "Data wyjazdu jest wymagana" }),
  num_days: z.number().min(1, { message: "Liczba dni musi być większa od 0" }),
  num_people: z
    .number()
    .min(1, { message: "Liczba osób musi być co najmniej 1" })
    .max(50, { message: "Liczba osób nie może przekraczać 50" }),
  accommodation_address: z.string().optional(),
});

// Zwykła notatka
const regularNoteSchema = baseNoteSchema.extend({
  isConfig: z.literal(false),
  priority: z
    .number()
    .min(0, { message: "Priorytet nie może być mniejszy niż 0" })
    .max(10, { message: "Priorytet nie może być większy niż 10" }),
  arrival_date: z.string().optional(),
  departure_date: z.string().optional(),
  num_days: z.number().optional(),
  num_people: z.number().optional(),
  accommodation_address: z.string().optional(),
});

// Discriminated union – wymaga czystych obiektów (bez .refine())
const unionSchema = z.discriminatedUnion("isConfig", [configNoteSchema, regularNoteSchema]);

// Dodatkowe walidacje specyficzne tylko dla notatki konfiguracyjnej
export const noteEditorSchema: z.ZodType<NoteEditorVM> = unionSchema.superRefine((data, ctx) => {
  if (!data.isConfig) return; // Zwykłe notatki nie wymagają dalszych reguł

  // Walidacja kolejności dat
  if (data.arrival_date && data.departure_date) {
    if (dayjs(data.departure_date).isBefore(dayjs(data.arrival_date))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Data wyjazdu musi być późniejsza niż data przyjazdu",
        path: ["departure_date"],
      });
    }
  }

  // Automatyczna kalkulacja liczby dni (zawsze różnica + 1)
  if (data.arrival_date && data.departure_date) {
    // Obliczamy różnicę dni i dodajemy 1 (włącznie z dniem przyjazdu i wyjazdu)
    const diffDays = dayjs(data.departure_date).diff(dayjs(data.arrival_date), "day") + 1;
    if (data.num_days !== diffDays) {
      // Nie wyświetlamy błędu, po prostu aktualizujemy wartość
      data.num_days = diffDays;
    }
  }
});
