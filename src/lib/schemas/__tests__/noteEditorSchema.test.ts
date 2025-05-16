import { describe, it, expect } from "vitest";
import { noteEditorSchema } from "../noteEditorSchema";

describe("noteEditorSchema", () => {
  describe("dla zwykłej notatki", () => {
    it("powinien zwalidować poprawną notatkę bez tagów", () => {
      const validNote = {
        title: "Testowy tytuł",
        content: "Treść notatki",
        priority: 5,
        tags: [],
        isConfig: false,
      };

      const result = noteEditorSchema.safeParse(validNote);
      expect(result.success).toBe(true);
    });

    it("powinien zwalidować poprawną notatkę z tagami", () => {
      const validNote = {
        title: "Testowy tytuł",
        content: "Treść notatki",
        priority: 3,
        tags: ["tag1", "tag-2", "tag_3"],
        isConfig: false,
      };

      const result = noteEditorSchema.safeParse(validNote);
      expect(result.success).toBe(true);
    });

    it("powinien odrzucić notatkę z pustym tytułem", () => {
      const invalidNote = {
        title: "",
        content: "Treść notatki",
        priority: 5,
        tags: [],
        isConfig: false,
      };

      const result = noteEditorSchema.safeParse(invalidNote);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].path).toContain("title");
      }
    });

    it("powinien odrzucić notatkę z za krótkim tytułem", () => {
      const invalidNote = {
        title: "AB",
        content: "Treść notatki",
        priority: 5,
        tags: [],
        isConfig: false,
      };

      const result = noteEditorSchema.safeParse(invalidNote);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].path).toContain("title");
      }
    });

    it("powinien odrzucić notatkę z za długim tytułem", () => {
      const invalidNote = {
        title: "A".repeat(201),
        content: "Treść notatki",
        priority: 5,
        tags: [],
        isConfig: false,
      };

      const result = noteEditorSchema.safeParse(invalidNote);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].path).toContain("title");
      }
    });

    it("powinien odrzucić notatkę z nieprawidłowym priorytetem", () => {
      const invalidNote = {
        title: "Testowy tytuł",
        content: "Treść notatki",
        priority: 11,
        tags: [],
        isConfig: false,
      };

      const result = noteEditorSchema.safeParse(invalidNote);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].path).toContain("priority");
      }
    });

    it("powinien odrzucić notatkę z nieprawidłowym tagiem", () => {
      const invalidNote = {
        title: "Testowy tytuł",
        content: "Treść notatki",
        priority: 5,
        tags: ["valid-tag", "invalid tag with space"],
        isConfig: false,
      };

      const result = noteEditorSchema.safeParse(invalidNote);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].path).toContain("tags");
      }
    });

    it("powinien odrzucić notatkę z za dużą liczbą tagów", () => {
      const invalidNote = {
        title: "Testowy tytuł",
        content: "Treść notatki",
        priority: 5,
        tags: Array(21)
          .fill(0)
          .map((_, i) => `tag-${i}`),
        isConfig: false,
      };

      const result = noteEditorSchema.safeParse(invalidNote);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].path).toContain("tags");
      }
    });
  });

  describe("dla notatki konfiguracyjnej", () => {
    it("powinien zwalidować poprawną notatkę konfiguracyjną", () => {
      const validConfigNote = {
        title: "Testowy tytuł",
        content: "Treść notatki",
        priority: 5,
        tags: [],
        isConfig: true,
        arrival_date: "2023-08-15",
        departure_date: "2023-08-20",
        num_days: 5,
        num_people: 3,
      };

      const result = noteEditorSchema.safeParse(validConfigNote);
      expect(result.success).toBe(true);
    });

    it("powinien odrzucić notatkę konfiguracyjną bez daty przyjazdu", () => {
      const invalidConfigNote = {
        title: "Testowy tytuł",
        content: "Treść notatki",
        priority: 5,
        tags: [],
        isConfig: true,
        arrival_date: "",
        departure_date: "2023-08-20",
        num_days: 5,
        num_people: 3,
      };

      const result = noteEditorSchema.safeParse(invalidConfigNote);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].path).toContain("arrival_date");
      }
    });

    it("powinien odrzucić notatkę konfiguracyjną gdy data wyjazdu jest wcześniejsza niż przyjazdu", () => {
      const invalidConfigNote = {
        title: "Testowy tytuł",
        content: "Treść notatki",
        priority: 5,
        tags: [],
        isConfig: true,
        arrival_date: "2023-08-20",
        departure_date: "2023-08-15",
        num_days: 5,
        num_people: 3,
      };

      const result = noteEditorSchema.safeParse(invalidConfigNote);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("Data wyjazdu musi być późniejsza");
      }
    });

    it("powinien odrzucić notatkę konfiguracyjną gdy liczba dni nie zgadza się z różnicą dat", () => {
      const invalidConfigNote = {
        title: "Testowy tytuł",
        content: "Treść notatki",
        priority: 5,
        tags: [],
        isConfig: true,
        arrival_date: "2023-08-15",
        departure_date: "2023-08-20",
        num_days: 10, // Powinno być 5
        num_people: 3,
      };

      const result = noteEditorSchema.safeParse(invalidConfigNote);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("Liczba dni musi odpowiadać różnicy");
      }
    });

    it("powinien odrzucić notatkę konfiguracyjną z nieprawidłową liczbą osób", () => {
      const invalidConfigNote = {
        title: "Testowy tytuł",
        content: "Treść notatki",
        priority: 5,
        tags: [],
        isConfig: true,
        arrival_date: "2023-08-15",
        departure_date: "2023-08-20",
        num_days: 5,
        num_people: 51, // Max to 50
      };

      const result = noteEditorSchema.safeParse(invalidConfigNote);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].path).toContain("num_people");
      }
    });
  });
});
