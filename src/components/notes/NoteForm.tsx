import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { TagInput } from "@/components/ui/tag-input";
import { Loader2 } from "lucide-react";
import type { CreateNoteDTO, UpdateNoteDTO, NoteDetailDTO } from "@/types";

interface NoteFormProps {
  projectId: string;
  noteId?: string;
  isConfigNote?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function NoteForm({ projectId, noteId, isConfigNote = false, onSuccess, onCancel }: NoteFormProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [formData, setFormData] = useState<CreateNoteDTO>({
    title: "",
    content: "",
    priority: 0,
    tags: [],
  });
  const { toast } = useToast();
  const modalRef = useRef<HTMLDivElement>(null);
  const selectRef = useRef<HTMLDivElement>(null);

  // Obsługa kliknięć w modalu
  const handleModalClick = useCallback((event: React.MouseEvent) => {
    // Jeśli kliknięcie jest w Select, nie zamykaj modalu
    if (selectRef.current && selectRef.current.contains(event.target as Node)) {
      event.stopPropagation();
    }
  }, []);

  useEffect(() => {
    if (noteId) {
      fetchNote();
    }
  }, [noteId, projectId]);

  async function fetchNote() {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/notes/${noteId}`);
      if (!response.ok) {
        throw new Error("Nie udało się pobrać notatki");
      }
      const note: NoteDetailDTO = await response.json();
      setFormData({
        title: note.title,
        content: note.content,
        priority: note.priority || 0,
        tags: note.tags || [],
      });
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się pobrać notatki",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);

    try {
      const url = noteId ? `/api/projects/${projectId}/notes/${noteId}` : `/api/projects/${projectId}/notes`;

      const method = noteId ? "PATCH" : "POST";
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Nie udało się ${noteId ? "zaktualizować" : "utworzyć"} notatki`);
      }

      toast({
        title: "Sukces",
        description: `Notatka została ${noteId ? "zaktualizowana" : "utworzona"}`,
      });

      // Jeśli przekazano onSuccess, użyj go zamiast przekierowania
      if (onSuccess) {
        onSuccess();
      } else {
        // Przekierowanie tylko gdy nie w modalu
        const data = await response.json();
        window.location.href = `/app/projects/${projectId}/notes/${noteId || data.id}`;
      }
    } catch (error) {
      toast({
        title: "Błąd",
        description: error instanceof Error ? error.message : "Wystąpił nieznany błąd",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  function handleTagsChange(tags: string[]) {
    // Ograniczenie do 20 tagów, każdy max 30 znaków
    const filteredTags = tags.filter((tag, index) => index < 20).map((tag) => tag.substring(0, 30));

    setFormData((prev) => ({
      ...prev,
      tags: filteredTags,
    }));
  }

  function handleCancel(e: React.MouseEvent) {
    e.preventDefault();
    if (onCancel) {
      onCancel();
    } else {
      window.location.href = `/app/projects/${projectId}`;
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div ref={modalRef} onClick={handleModalClick}>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Tytuł</Label>
              <Input
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Tytuł notatki"
                minLength={3}
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Treść</Label>
              <Textarea
                id="content"
                value={formData.content || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                placeholder="Treść notatki"
                rows={12}
              />
            </div>

            <div className="space-y-2" ref={selectRef}>
              <Label htmlFor="priority">Priorytet</Label>
              <select
                id="priority"
                value={formData.priority?.toString() || "0"}
                onChange={(e) => setFormData((prev) => ({ ...prev, priority: parseInt(e.target.value) }))}
                className="w-full flex h-9 items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="0">Brak</option>
                <option value="1">Niski</option>
                <option value="2">Średni</option>
                <option value="3">Wysoki</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Tagi (max 20)</Label>
              <TagInput
                placeholder="Dodaj tag (max 30 znaków)"
                tags={formData.tags || []}
                setTags={handleTagsChange}
                maxTags={20}
              />
              <p className="text-xs text-muted-foreground">Wpisz tag i naciśnij Enter, aby dodać.</p>
            </div>
          </CardContent>

          <CardFooter className="border-t pt-6 flex justify-between">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {noteId ? "Zapisz zmiany" : "Utwórz notatkę"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
