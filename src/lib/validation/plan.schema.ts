import { z } from "zod";

// Stałe do walidacji
const MAX_VERSION_NAME_LENGTH = 50;
const MIN_VERSION_NAME_LENGTH = 1;

// Bazowe schematy
const uuidSchema = z.string().uuid();
const versionNameSchema = z.string().min(MIN_VERSION_NAME_LENGTH).max(MAX_VERSION_NAME_LENGTH);

// Schematy dla struktury planu
const planActivitySchema = z.object({
  time: z.string(),
  name: z.string(),
  description: z.string(),
  type: z.string().optional(),
  location: z.string().optional(),
  duration: z.number().int().positive().optional(),
});

const planDaySchema = z.object({
  day_number: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  activities: z.array(planActivitySchema),
});

const planContentSchema = z.object({
  days: z.array(planDaySchema),
  summary: z.string().optional(),
  recommendations: z.array(z.string()).optional(),
});

// Schemat parametrów ścieżki
export const planPathParamsSchema = z.object({
  projectId: uuidSchema,
  planId: uuidSchema.optional(),
});

// Schemat parametrów zapytania dla listy planów
export const planQueryParamsSchema = z.object({
  include_outdated: z.coerce.boolean().optional().default(false),
  sort_by: z.enum(["created_at", "updated_at", "version_name"]).optional().default("created_at"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(50).optional().default(20),
});

// Schemat parametrów zapytania dla eksportu planu
export const planExportQueryParamsSchema = z.object({
  format: z.enum(["pdf"]).optional().default("pdf"),
});

// Schemat parametrów zapytania dla porównania planów
export const planCompareQueryParamsSchema = z
  .object({
    plan1_id: uuidSchema,
    plan2_id: uuidSchema,
  })
  .refine((data) => data.plan1_id !== data.plan2_id, {
    message: "Porównywane plany muszą być różne",
    path: ["plan1_id"],
  });

// Schematy DTO dla żądań
export const generatePlanSchema = z.object({
  version_name: versionNameSchema,
});

export const updatePlanSchema = z
  .object({
    version_name: versionNameSchema.optional(),
    content: planContentSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Przynajmniej jedno pole musi być podane do aktualizacji",
  });

// Funkcje pomocnicze do obsługi schematów Zod w kontekście Astro
export function validatePathParams<T>(schema: z.ZodType<T>, params: Record<string, string>) {
  const result = schema.safeParse(params);
  if (!result.success) {
    const formatted = result.error.format();
    throw new Error(`Niepoprawne parametry ścieżki: ${JSON.stringify(formatted)}`);
  }
  return result.data as T;
}

export function validateQueryParams<T>(schema: z.ZodType<T>, params: URLSearchParams) {
  // Konwertujemy URLSearchParams na prosty obiekt
  const paramsObj: Record<string, string | string[]> = {};
  for (const [key, value] of params.entries()) {
    if (paramsObj[key]) {
      if (Array.isArray(paramsObj[key])) {
        (paramsObj[key] as string[]).push(value);
      } else {
        paramsObj[key] = [paramsObj[key] as string, value];
      }
    } else {
      paramsObj[key] = value;
    }
  }

  const result = schema.safeParse(paramsObj);
  if (!result.success) {
    const formatted = result.error.format();
    throw new Error(`Niepoprawne parametry zapytania: ${JSON.stringify(formatted)}`);
  }
  return result.data as T;
}

export function validateBody<T>(schema: z.ZodType<T>, body: unknown) {
  const result = schema.safeParse(body);
  if (!result.success) {
    const formatted = result.error.format();
    throw new Error(`Niepoprawne dane wejściowe: ${JSON.stringify(formatted)}`);
  }
  return result.data as T;
}
