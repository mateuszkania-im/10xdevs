import { memo } from "react";
import { Progress } from "@/components/ui/progress";

interface ProgressSectionProps {
  progress: number;
  logs: string[];
  title?: string;
  description?: string;
}

/**
 * Komponent wyświetlający pasek postępu i logi
 */
const ProgressSection = memo(function ProgressSection({
  progress,
  logs,
  title = "Generowanie planu",
  description = "Trwa generowanie planu podróży...",
}: ProgressSectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <Progress value={progress} className="h-2 w-full" />

      <div className="max-h-60 overflow-y-auto rounded-md border bg-muted p-2">
        {logs.length > 0 ? (
          <pre className="text-xs whitespace-pre-wrap">{logs.join("\n")}</pre>
        ) : (
          <div className="text-xs text-muted-foreground text-center py-4">Oczekiwanie na dane...</div>
        )}
      </div>
    </div>
  );
});

export default ProgressSection;
