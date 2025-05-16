import { z } from "zod";

// Schemat dla parametrów paginacji
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

// Schemat dla parametrów sortowania
export const sortSchema = z.object({
  sort_by: z.enum(["created_at", "updated_at", "name"]).default("updated_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

// Schemat dla tworzenia nowego projektu
export const createProjectSchema = z.object({
  name: z
    .string()
    .min(3, "Nazwa projektu musi mieć co najmniej 3 znaki")
    .max(100, "Nazwa projektu nie może przekraczać 100 znaków"),
});

// Schemat dla aktualizacji projektu
export const updateProjectSchema = createProjectSchema;

// Schemat parametrów query dla listy projektów
export const projectsQuerySchema = z.object({
  ...paginationSchema.shape,
  ...sortSchema.shape,
});

// Schemat dla parametru projectId
export const projectIdSchema = z.object({
  projectId: z.string().uuid("ID projektu musi być poprawnym UUID"),
});
