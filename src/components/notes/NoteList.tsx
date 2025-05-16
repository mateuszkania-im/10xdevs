import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NoteCard } from "./NoteCard";
import { useToast } from "@/components/ui/use-toast";
import { PlusCircle, ArrowUpDown } from "lucide-react";
import type { NoteListItemDTO, PaginatedResponse, NoteDetailDTO, NotePositionDTO } from "@/types";
import { NoteEditorModal } from "@/components/NoteEditorModal";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { restrictToParentElement } from "@dnd-kit/modifiers";
import { SortableNote } from "./SortableNote";
import { reorderNotes } from "@/lib/api/notes";

// Definicja typu DragEndEvent na podstawie dokumentacji dnd-kit
interface DragEndEvent {
  active: { id: string };
  over: { id: string } | null;
}

interface NoteListProps {
  projectId: string;
  onEdit?: (noteId: string) => void;
  refreshCounter?: number;
}

export function NoteList({ projectId, onEdit, refreshCounter = 0 }: NoteListProps) {
  const [notes, setNotes] = useState<NoteListItemDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<string>("position");
  const [order, setOrder] = useState<string>("asc");
  const [isCustomOrder, setIsCustomOrder] = useState<boolean>(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [projectHasConfigNote, setProjectHasConfigNote] = useState(false);
  const { toast } = useToast();

  // Konfiguracja dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10, // Minimalna odległość drag & drop
      },
    })
  );

  // Efekt do ładowania zapisanych ustawień z localStorage po zamontowaniu komponentu
  useEffect(() => {
    // Wykonaj tylko po stronie klienta
    if (typeof window !== "undefined") {
      const savedSortBy = localStorage.getItem(`sortBy-${projectId}`);
      const savedOrder = localStorage.getItem(`order-${projectId}`);
      const savedCustomOrder = localStorage.getItem(`customOrder-${projectId}`);

      if (savedSortBy) setSortBy(savedSortBy);
      if (savedOrder) setOrder(savedOrder);
      if (savedCustomOrder === "true") setIsCustomOrder(true);
    }
  }, [projectId]);

  useEffect(() => {
    fetchNotes();
  }, [projectId, sortBy, order, page, searchTerm, selectedTag]);

  useEffect(() => {
    if (refreshCounter > 0) {
      fetchNotes();
    }
  }, [refreshCounter]);

  // Nasłuchiwanie na zdarzenie utworzenia notatki konfiguracyjnej
  useEffect(() => {
    const handleConfigNoteCreated = (event: CustomEvent) => {
      // Sprawdzamy czy to zdarzenie dotyczy tego projektu
      if (event.detail?.projectId === projectId) {
        console.log("NoteList: Otrzymano zdarzenie configNoteCreated");
        // Aktualizujemy stan informacji o notatce konfiguracyjnej
        setProjectHasConfigNote(true);
        // Odświeżamy listę notatek
        fetchNotes();
      }
    };

    // Rejestrujemy nasłuchiwanie zdarzenia
    window.addEventListener('configNoteCreated', handleConfigNoteCreated as EventListener);

    // Sprzątamy po sobie
    return () => {
      window.removeEventListener('configNoteCreated', handleConfigNoteCreated as EventListener);
    };
  }, [projectId]);

  async function fetchNotes() {
    setIsLoading(true);
    try {
      // Najpierw pobierz wszystkie tagi, niezależnie od filtrów
      const allTagsResponse = await fetch(`/api/projects/${projectId}/notes/tags`);
      if (allTagsResponse.ok) {
        const tagsData = await allTagsResponse.json();
        setTags(tagsData.filter((tag) => tag && tag.trim() !== ""));
      }

      // Pobierz informacje o projekcie, aby sprawdzić czy ma notatkę konfiguracyjną
      const projectResponse = await fetch(`/api/projects/${projectId}`);
      if (projectResponse.ok) {
        const projectData = await projectResponse.json();
        setProjectHasConfigNote(!!projectData.has_config_note);
      }

      // Jeśli używamy niestandardowego sortowania, zawsze używamy "position" jako faktyczny parametr sortowania
      // "custom" jest tylko flagą, że używamy własnego ustawienia
      const actualSortBy = isCustomOrder ? "position" : sortBy;

      const searchParams = new URLSearchParams({
        sort_by: actualSortBy,
        order: order,
        page: page.toString(),
        limit: "20",
      });

      if (searchTerm) {
        searchParams.append("search", searchTerm);
      }

      if (selectedTag && selectedTag !== "all") {
        searchParams.append("tag", selectedTag);
      }

      const response = await fetch(`/api/projects/${projectId}/notes?${searchParams.toString()}`);

      if (!response.ok) {
        throw new Error("Nie udało się pobrać notatek");
      }

      const data: PaginatedResponse<NoteListItemDTO> = await response.json();

      // Zawsze zastępuj notatki nowymi danymi, niezależnie od trybu sortowania
      // Naprawia problem z duplikującymi się notatkami
      setNotes(data.data);

      setTotalPages(data.pagination.pages);
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

  // Obsługa zakończenia drag & drop
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setIsDragging(false);

    if (!over) return;

    if (active.id !== over.id) {
      setNotes((items) => {
        // Znajdź indeksy obu notatek
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        // Upewnij się, że notatka konfiguracyjna jest zawsze na początku
        const reorderedNotes = arrayMove(items, oldIndex, newIndex);

        // Jeśli nie było to jeszcze sortowanie niestandardowe, ustaw je
        if (!isCustomOrder) {
          setIsCustomOrder(true);
          setSortBy("custom");

          // Zapisz informację o niestandardowym sortowaniu (tylko po stronie klienta)
          if (typeof window !== "undefined") {
            localStorage.setItem(`customOrder-${projectId}`, "true");
            localStorage.setItem(`sortBy-${projectId}`, "custom");
          }
        }

        return reorderedNotes;
      });

      // Automatycznie zapisz nową kolejność
      await saveNoteOrder();
    }
  };

  // Zapisz nową kolejność notatek
  const saveNoteOrder = async () => {
    setIsSaving(true);
    try {
      // Upewnij się, że notatka konfiguracyjna jest na pozycji 0
      const sortedNotes = [...notes].sort((a, b) => {
        if (a.is_config_note) return -1;
        if (b.is_config_note) return 1;
        return 0;
      });

      // Przypisz pozycje zgodnie z aktualną kolejnością w tablicy
      const notePositions: NotePositionDTO[] = sortedNotes.map((note, index) => ({
        id: note.id,
        position: note.is_config_note ? 0 : index + (sortedNotes.some((n) => n.is_config_note) ? 1 : 0),
      }));

      await reorderNotes(projectId, { note_positions: notePositions });

      toast({
        title: "Sukces",
        description: "Kolejność notatek została zaktualizowana",
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się zapisać kolejności notatek",
        variant: "destructive",
      });

      // Wróć do standardowego sortowania w przypadku błędu
      setIsCustomOrder(false);
      setSortBy("position");
      if (typeof window !== "undefined") {
        localStorage.removeItem(`customOrder-${projectId}`);
        localStorage.setItem(`sortBy-${projectId}`, "position");
      }
      fetchNotes();
    } finally {
      setIsSaving(false);
    }
  };

  // Sprawdź, czy projekt ma już notatkę konfiguracyjną
  const hasConfigNote = projectHasConfigNote;

  const handleCreateSuccess = () => {
    setIsEditorOpen(false);
    fetchNotes();
    toast({
      title: "Sukces",
      description: "Notatka została utworzona",
    });
  };

  // Zmień tryb sortowania
  const handleSortChange = (value: string) => {
    // Jeśli zmieniono z własnego na inne, wyłącz niestandardowe sortowanie
    if (isCustomOrder && value !== "custom") {
      setIsCustomOrder(false);
      if (typeof window !== "undefined") {
        localStorage.removeItem(`customOrder-${projectId}`);
      }
    }

    setSortBy(value);
    if (typeof window !== "undefined") {
      localStorage.setItem(`sortBy-${projectId}`, value);
    }
  };

  // Zmień kolejność sortowania
  const handleOrderChange = (value: string) => {
    setOrder(value);
    if (typeof window !== "undefined") {
      localStorage.setItem(`order-${projectId}`, value);
    }
  };

  // Renderowanie posortowanych notatek
  const renderNotes = () => {
    // Zawsze sortuj notatkę konfiguracyjną na początek, niezależnie od innych ustawień
    const sortedNotes = notes.slice().sort((a, b) => {
      if (a.is_config_note) return -1;
      if (b.is_config_note) return 1;
      return 0;
    });

    return sortedNotes;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium">Notatki</h2>
        <Button onClick={() => setIsEditorOpen(true)} className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          <span>Dodaj notatkę</span>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2 flex-1">
          <Input
            placeholder="Szukaj notatek..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-[300px]"
          />
          <Select value={selectedTag} onValueChange={setSelectedTag}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtruj po tagu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie tagi</SelectItem>
              {tags.map(
                (tag) =>
                  tag && (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  )
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sortuj po" />
            </SelectTrigger>
            <SelectContent>
              {isCustomOrder && <SelectItem value="custom">Własne</SelectItem>}
              <SelectItem value="position">Pozycja</SelectItem>
              <SelectItem value="priority">Priorytet</SelectItem>
              <SelectItem value="created_at">Data utworzenia</SelectItem>
              <SelectItem value="updated_at">Data aktualizacji</SelectItem>
              <SelectItem value="title">Tytuł</SelectItem>
            </SelectContent>
          </Select>

          <Select value={order} onValueChange={handleOrderChange} disabled={isCustomOrder}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Kolejność" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Rosnąco</SelectItem>
              <SelectItem value="desc">Malejąco</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-muted-foreground">Brak notatek. Utwórz pierwszą notatkę.</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToParentElement]}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <SortableContext items={renderNotes().map((note) => note.id)} strategy={verticalListSortingStrategy}>
              {renderNotes().map((note) => (
                <SortableNote
                  key={note.id}
                  id={note.id}
                  note={note}
                  projectId={projectId}
                  onDeleted={fetchNotes}
                  onEdit={onEdit ?? (() => {})}
                  isLocked={note.is_config_note}
                />
              ))}
            </SortableContext>
          </div>
        </DndContext>
      )}

      {/* Paginacja */}
      {totalPages > 1 && !isCustomOrder && (
        <div className="flex justify-center gap-2 mt-6">
          <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            Poprzednia
          </Button>
          <div className="flex items-center px-4">
            Strona {page} z {totalPages}
          </div>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Następna
          </Button>
        </div>
      )}

      {/* Modal tworzenia/edycji notatki */}
      {isEditorOpen && (
        <QueryProvider>
          <NoteEditorModal
            mode="create"
            projectId={projectId}
            open={isEditorOpen}
            onClose={() => setIsEditorOpen(false)}
            onSuccess={handleCreateSuccess}
            projectHasConfigNote={hasConfigNote}
          />
        </QueryProvider>
      )}
    </div>
  );
}
