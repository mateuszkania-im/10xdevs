import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  onCreateProject: () => void;
}

export default function EmptyState({ onCreateProject }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 border border-dashed rounded-lg bg-muted/20">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-4">
        <FileText className="h-10 w-10 text-primary" />
      </div>

      <h3 className="text-xl font-semibold mb-2">Nie utworzono jeszcze żadnego projektu</h3>

      <p className="text-muted-foreground text-center max-w-md mb-6">
        Utwórz swój pierwszy projekt podróży, aby rozpocząć planowanie swojej przygody.
      </p>

      <Button onClick={onCreateProject} className="gap-2" data-test-id="empty-state-create-project">
        <Plus className="h-4 w-4" />
        <span>Utwórz nowy projekt</span>
      </Button>
    </div>
  );
}
