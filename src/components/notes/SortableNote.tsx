import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { NoteCard } from "./NoteCard";
import type { NoteListItemDTO } from "@/types";

interface SortableNoteProps {
  id: string;
  note: NoteListItemDTO;
  projectId: string;
  onClick?: (noteId: string) => void;
  onDeleted: () => void;
  onEdit: (noteId: string) => void;
  isLocked?: boolean;
}

export function SortableNote({ id, note, projectId, onClick, onDeleted, onEdit, isLocked = false }: SortableNoteProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: isLocked || note.is_config_note,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isLocked ? {} : attributes)}
      {...(isLocked ? {} : listeners)}
      className={`
        ${isLocked ? "cursor-default" : "cursor-grab"}
        transition-shadow duration-200
        ${isDragging ? "shadow-lg" : "hover:shadow-md"}
        ${isLocked ? "" : "active:cursor-grabbing"}
      `}
    >
      <NoteCard note={note} projectId={projectId} onDeleted={onDeleted} onEdit={onEdit} />
    </div>
  );
}
