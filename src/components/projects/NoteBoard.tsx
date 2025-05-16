import { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSwappingStrategy } from "@dnd-kit/sortable";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { PlusCircle, Settings } from "lucide-react";
import { SortableNote } from "./SortableNote";
import { useReorderNotes } from "@/lib/hooks/useReorderNotes";
import type { NoteListItemDTO } from "@/types";

interface NoteBoardProps {
  notes: NoteListItemDTO[];
  projectId: string;
  onNoteClick: (noteId: string) => void;
  onNoteDeleted: () => void;
  onCreateNote: () => void;
  onCreateConfigNote: () => void;
  onEditNote: (noteId: string) => void;
  className?: string;
}

export function NoteBoard({
  notes,
  projectId,
  onNoteClick,
  onNoteDeleted,
  onCreateNote,
  onCreateConfigNote,
  onEditNote,
  className = "",
}: NoteBoardProps) {
  const [items, setItems] = useState<NoteListItemDTO[]>([]);
  const { toast } = useToast();
  const { reorderNotes, isLoading } = useReorderNotes();

  // Inicjalizacja stanu po otrzymaniu danych
  useEffect(() => {
    if (notes && notes.length > 0) {
      setItems(notes);
    } else {
      setItems([]);
    }
  }, [notes]);

  // Konfiguracja czujników dla DnD
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Wymagany dystans przesunięcia do aktywacji przeciągania
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Obsługa zakończenia przeciągania
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const activeIndex = items.findIndex((item) => item.id === active.id);
        const overIndex = items.findIndex((item) => item.id === over.id);

        if (activeIndex !== -1 && overIndex !== -1) {
          // Zaktualizuj lokalnie stan (optymistyczna aktualizacja)
          const newItems = arrayMove(items, activeIndex, overIndex);
          setItems(newItems);

          // Przygotuj dane do wysłania na backend
          const reorderData = newItems.map((note, index) => ({
            id: note.id,
            position: index,
          }));

          try {
            // Zapisz zmiany na serwerze
            await reorderNotes(projectId, reorderData);
          } catch (error) {
            // W przypadku błędu przywróć poprzedni stan
            setItems(notes);
            toast({
              title: "Błąd",
              description: "Nie udało się zmienić kolejności notatek. Spróbuj ponownie.",
              variant: "destructive",
            });
          }
        }
      }
    },
    [items, notes, projectId, reorderNotes, toast]
  );

  // Wydziel notatki konfiguracyjne i zwykłe
  const configNote = items.find((note) => note.is_config_note);
  const regularNotes = items.filter((note) => !note.is_config_note);
  const hasConfigNote = !!configNote;

  return (
    <div className={`w-full space-y-6 ${className}`}>
      {/* Nagłówek z przyciskami akcji */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Notatki</h2>
        <div className="flex gap-2">
          {!hasConfigNote && (
            <Button onClick={onCreateConfigNote} variant="outline" className="flex items-center gap-1">
              <Settings className="h-4 w-4" />
              <span>Dodaj konfigurację</span>
            </Button>
          )}
          <Button onClick={onCreateNote} className="flex items-center gap-1">
            <PlusCircle className="h-4 w-4" />
            <span>Nowa notatka</span>
          </Button>
        </div>
      </div>

      {/* Notatka konfiguracyjna (zawsze na górze) */}
      {configNote && (
        <div className="mb-6">
          <SortableNote
            id={configNote.id}
            note={configNote}
            projectId={projectId}
            onClick={onNoteClick}
            onDeleted={onNoteDeleted}
            onEdit={onEditNote}
            isLocked={true}
          />
        </div>
      )}

      {/* Lista pozostałych notatek z możliwością sortowania */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} disabled={isLoading}>
        <SortableContext items={regularNotes.map((note) => note.id)} strategy={rectSwappingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {regularNotes.map((note) => (
              <SortableNote
                key={note.id}
                id={note.id}
                note={note}
                projectId={projectId}
                onClick={onNoteClick}
                onDeleted={onNoteDeleted}
                onEdit={onEditNote}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {items.length === 0 && (
        <div className="text-center py-16 border rounded-lg bg-muted/20">
          <p className="text-lg text-muted-foreground mb-4">
            Dodaj swoją pierwszą notatkę, aby rozpocząć planowanie podróży.
          </p>
          <Button onClick={onCreateNote}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Dodaj notatkę
          </Button>
        </div>
      )}
    </div>
  );
}
