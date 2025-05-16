import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Save, Calendar, ArrowUpDown } from "lucide-react";
import { fetchNotes, reorderNotes } from "@/lib/api/notes";
import type { NoteListItemDTO, NotePositionDTO } from "@/types";

// Funkcja pomocnicza do skróconej zawartości HTML
function truncateHTML(content: string | null, maxLength = 50): string {
  if (!content) return "";

  try {
    // Usunięcie atrybutów dir="ltr" i innych niechcianych atrybutów
    const cleanedHtml = content.replace(/\s+dir="ltr"/g, "");

    // Pobranie czystego tekstu do sprawdzenia długości
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = cleanedHtml;
    const textContent = tempDiv.textContent || tempDiv.innerText || "";

    // Jeśli już jest krótszy niż limit, zwróć oczyszczony HTML
    if (textContent.length <= maxLength) {
      return cleanedHtml;
    }

    // Zwróć tylko tytuł notatki bez dodatkowej treści
    return "";
  } catch (error) {
    console.error("Błąd podczas przetwarzania treści HTML:", error);
    return "";
  }
}

interface NoteReorderListProps {
  projectId: string;
  onReorderComplete?: () => void;
}

export function NoteReorderList({ projectId, onReorderComplete }: NoteReorderListProps) {
  const [notes, setNotes] = useState<NoteListItemDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadNotes();
  }, [projectId]);

  async function loadNotes() {
    setIsLoading(true);
    try {
      const response = await fetchNotes(projectId, {
        sortBy: "position",
        order: "asc",
        limit: 100, // Pobierz wszystkie notatki (max 100)
      });
      setNotes(response.data);
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się pobrać notatek",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  function handleDragStart(e: React.DragEvent, noteId: string) {
    // Znajdź notatkę
    const note = notes.find((note) => note.id === noteId);

    // Nie pozwól przeciągać notatki konfiguracyjnej
    if (note?.is_config_note) {
      e.preventDefault();
      return;
    }

    setDraggedNoteId(noteId);
    e.dataTransfer.effectAllowed = "move";
    // Dodaj przezroczystość do przeciąganego elementu
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.4";
    }
  }

  function handleDragEnd(e: React.DragEvent) {
    setDraggedNoteId(null);
    // Przywróć oryginalny wygląd
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1";
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDrop(e: React.DragEvent, targetNoteId: string) {
    e.preventDefault();

    if (!draggedNoteId || draggedNoteId === targetNoteId) {
      return;
    }

    // Znajdź docelową notatkę
    const targetNote = notes.find((note) => note.id === targetNoteId);

    // Nie pozwól na upuszczenie na notatkę konfiguracyjną
    if (targetNote?.is_config_note) {
      return;
    }

    // Znajdź indeksy przeciąganej i docelowej notatki
    const draggedNoteIndex = notes.findIndex((note) => note.id === draggedNoteId);
    const targetNoteIndex = notes.findIndex((note) => note.id === targetNoteId);

    if (draggedNoteIndex === -1 || targetNoteIndex === -1) {
      return;
    }

    // Utwórz kopię tablicy i zmień kolejność
    const newNotes = [...notes];
    const [draggedNote] = newNotes.splice(draggedNoteIndex, 1);
    newNotes.splice(targetNoteIndex, 0, draggedNote);

    // Zaktualizuj pozycje, zachowując notatkę konfiguracyjną na pozycji 0
    const reorderedNotes = newNotes.map((note, index) => ({
      ...note,
      position: note.is_config_note ? 0 : index + (newNotes.some((n) => n.is_config_note) ? 1 : 0),
    }));

    setNotes(reorderedNotes);
    setHasChanges(true);
  }

  async function handleSaveOrder() {
    setIsSaving(true);
    try {
      // Upewnij się, że notatka konfiguracyjna jest na pozycji 0
      const sortedNotes = [...notes].sort((a, b) => {
        if (a.is_config_note) return -1;
        if (b.is_config_note) return 1;
        return a.position - b.position;
      });

      // Przygotuj dane do wysłania
      const notePositions: NotePositionDTO[] = sortedNotes.map((note, index) => ({
        id: note.id,
        position: note.is_config_note ? 0 : index,
      }));

      await reorderNotes(projectId, { note_positions: notePositions });

      toast({
        title: "Sukces",
        description: "Kolejność notatek została zaktualizowana",
      });

      setHasChanges(false);

      if (onReorderComplete) {
        onReorderComplete();
      }
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się zaktualizować kolejności notatek",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">Brak notatek do zmiany kolejności.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-5 w-5" />
          <h2 className="text-lg font-medium">Zmień kolejność notatek</h2>
        </div>
        <Button onClick={handleSaveOrder} disabled={!hasChanges || isSaving} className="flex items-center gap-2">
          {isSaving ? (
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Zapisz kolejność
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Przeciągnij i upuść notatki, aby zmienić ich kolejność. Kliknij "Zapisz kolejność", aby zatwierdzić zmiany.
      </p>

      <div className="space-y-2">
        {notes.map((note) => (
          <Card
            key={note.id}
            draggable={!note.is_config_note}
            onDragStart={(e) => handleDragStart(e, note.id)}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, note.id)}
            className={`
              ${!note.is_config_note ? "cursor-move" : "cursor-default"} 
              border 
              ${!note.is_config_note ? "hover:border-primary" : "border-primary border-2"} 
              transition-colors
              ${draggedNoteId === note.id ? "border-dashed opacity-50" : ""}
            `}
          >
            <CardContent className="p-3 flex items-center gap-2">
              {!note.is_config_note ? (
                <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              ) : (
                <Calendar className="h-5 w-5 text-primary flex-shrink-0" />
              )}

              <div className="flex-grow min-w-0">
                <div className="font-medium truncate">{note.title}</div>

                <div className="flex flex-wrap gap-1 mt-1">
                  {note.is_config_note && (
                    <Badge variant="default" className="bg-primary">
                      <Calendar className="h-3 w-3 mr-1" />
                      Konfiguracja
                    </Badge>
                  )}
                  {note.tags &&
                    note.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  {note.tags && note.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{note.tags.length - 3}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="text-sm text-muted-foreground">Pozycja: {note.position}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
