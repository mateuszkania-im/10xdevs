import { z } from "zod";

// Stałe do walidacji
const MAX_TAGS_PER_NOTE = 20;
const MAX_TAG_LENGTH = 30;
const MAX_TITLE_LENGTH = 200;
const MIN_TITLE_LENGTH = 3;

// Bazowe schematy
const uuidSchema = z.string().uuid();
const titleSchema = z.string().min(MIN_TITLE_LENGTH).max(MAX_TITLE_LENGTH);
const contentSchema = z.string().nullable();
const prioritySchema = z.number().int().min(0);
const tagSchema = z.string().max(MAX_TAG_LENGTH);
const tagsSchema = z.array(tagSchema).max(MAX_TAGS_PER_NOTE);
const positionSchema = z.number().int().min(0);
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

// Schemat parametrów ścieżki
export const notePathParamsSchema = z.object({
  projectId: uuidSchema,
  noteId: uuidSchema.optional(),
});

// Schemat parametrów zapytania dla listy notatek
export const noteQueryParamsSchema = z.object({
  sort_by: z
    .enum(["position", "priority", "created_at", "updated_at", "title", "custom"])
    .optional()
    .default("position"),
  order: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(50).optional().default(20),
  tag: z.string().optional().nullable(),
  search: z.string().optional().nullable(),
});

// Schematy DTO dla żądań
export const createNoteSchema = z.object({
  title: titleSchema,
  content: contentSchema,
  priority: prioritySchema.optional().default(0),
  tags: tagsSchema.optional().default([]),
});

export const updateNoteSchema = z.object({
  title: titleSchema.optional(),
  content: contentSchema.optional(),
  priority: prioritySchema.optional(),
  tags: tagsSchema.optional(),
});

export const createConfigNoteSchema = createNoteSchema
  .extend({
    arrival_date: dateSchema,
    departure_date: dateSchema,
    num_days: z.number().int().positive().optional(),
    num_people: z.number().int().positive().default(1),
    destination: z.string().max(100).optional().nullable(),
    travel_style: z.string().max(30).optional().nullable().default("zwiedzanie"),
    budget: z.string().max(30).optional().nullable().default(""),
    interests: z.array(z.string().min(1).max(30)).max(10).optional().nullable().default([]),
    accommodation_address: z.string().max(200).optional().nullable(),
  })
  .refine((data) => new Date(data.arrival_date) <= new Date(data.departure_date), {
    message: "Data przybycia musi być wcześniejsza lub równa dacie wyjazdu",
    path: ["arrival_date"],
  });

export const updateConfigNoteSchema = z.object({
  title: titleSchema.optional(),
  content: contentSchema.optional(),
  priority: prioritySchema.optional(),
  tags: tagsSchema.optional(),
  arrival_date: dateSchema.optional(),
  departure_date: dateSchema.optional(),
  num_days: z.number().int().positive().optional(),
  num_people: z.number().int().positive().optional(),
  destination: z.string().max(100).optional().nullable(),
  travel_style: z.string().max(30).optional().nullable(),
  budget: z.string().max(30).optional().nullable(),
  interests: z.array(z.string().min(1).max(30)).max(10).optional().nullable(),
  accommodation_address: z.string().max(200).optional().nullable(),
});

// Schemat dla zmiany kolejności notatek
export const notePositionSchema = z.object({
  id: uuidSchema,
  position: positionSchema,
});

export const reorderNotesSchema = z.object({
  note_positions: z.array(notePositionSchema),
});
