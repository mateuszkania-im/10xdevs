import { useState, useEffect } from "react";
import { Modal, ModalBody, ModalContent } from "@/components/ui/animated-modal";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { NoteCard } from "@/components/notes/NoteCard";
import { NoteEditorModal } from "@/components/NoteEditorModal";
import { useNoteDetail } from "@/lib/queries/notes";

interface NoteDetailDrawerProps {
  projectId: string;
  noteId: string | null;
  open: boolean;
  onClose: () => void;
  onNoteUpdated: () => void;
}

export function NoteDetailDrawer({ projectId, noteId, open, onClose, onNoteUpdated }: NoteDetailDrawerProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toast } = useToast();

  // Zapytanie o szczegóły notatki
  const {
    data: note,
    isLoading,
    isError,
    error,
  } = useNoteDetail(projectId, noteId || "", {
    // Nie wykonuj zapytania jeśli nie ma noteId lub szuflada jest zamknięta
    enabled: Boolean(noteId) && open,
  });

  // Resetowanie modalu edycji przy zamknięciu szuflady
  useEffect(() => {
    if (!open) {
      setIsEditModalOpen(false);
    }
  }, [open]);

  // Debugowanie - sprawdzanie zawartości notatki
  useEffect(() => {
    if (note) {
      console.log("NoteDetailDrawer otrzymał dane notatki:", {
        id: note.id,
        title: note.title,
        content: note.content?.substring(0, 50) + "...",
        contentLength: note.content?.length || 0,
        tagsCount: note.tags?.length || 0,
        tags: note.tags,
      });
    }
  }, [note]);

  if (!open || !noteId) {
    return null;
  }

  const handleEditClick = (e: React.MouseEvent) => {
    // Zatrzymaj propagację, aby kliknięcie nie było przechwycone przez inne elementy
    e.stopPropagation();
    e.preventDefault();

    // Opóźnij otwarcie modalu o milisekundę, aby być pewnym, że nie ma konfliktu ze zdarzeniami z innych komponentów
    setTimeout(() => {
      console.log("Otwieranie modalu edycji dla notatki:", noteId);
      setIsEditModalOpen(true);
    }, 1);
  };

  const handleEditSuccess = () => {
    console.log("Zamykanie modalu edycji po sukcesie");
    setIsEditModalOpen(false);
    onNoteUpdated();
    toast({
      title: "Sukces",
      description: "Notatka została zaktualizowana",
    });
  };

  const handleEditModalClose = () => {
    console.log("Zamykanie modalu edycji");
    setIsEditModalOpen(false);
  };

  // Debugowanie stanu modalu
  console.log("Stan modalu edycji:", { isEditModalOpen, noteId });

  return (
    <>
      <Modal open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <ModalBody className="md:max-w-lg lg:max-w-xl">
          <ModalContent>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">{note?.title || "Szczegóły notatki"}</h2>
              {/* Użyj type="button" aby zapobiec domyślnej akcji formularza */}
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleEditClick}
                disabled={isLoading || isError}
              >
                <Edit className="h-4 w-4" />
                <span className="sr-only">Edytuj</span>
              </Button>
            </div>

            <div>
              {isLoading && (
                <div className="flex justify-center items-center py-10">
                  <p className="text-muted-foreground">Ładowanie notatki...</p>
                </div>
              )}

              {isError && (
                <div className="flex justify-center items-center py-10">
                  <p className="text-red-500">
                    {error instanceof Error ? error.message : "Wystąpił błąd podczas ładowania notatki"}
                  </p>
                </div>
              )}

              {note && <NoteCard note={note} projectId={projectId} />}
            </div>
          </ModalContent>
        </ModalBody>
      </Modal>

      {/* Zawsze renderuj NoteEditorModal z właściwym stanem open bazującym na isEditModalOpen */}
      {note && (
        <NoteEditorModal
          mode="edit"
          initialData={note}
          projectId={projectId}
          open={isEditModalOpen}
          onSuccess={handleEditSuccess}
          onClose={handleEditModalClose}
        />
      )}
    </>
  );
}
