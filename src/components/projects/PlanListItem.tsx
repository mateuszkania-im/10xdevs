import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/pl";
import { useCallback } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TravelPlanListItemDTO } from "@/types";
import { MoreHorizontal, FileText, Trash, Copy } from "lucide-react";

// Inicjalizacja pluginu relativeTime
dayjs.extend(relativeTime);
dayjs.locale("pl");

interface PlanListItemProps {
  plan: TravelPlanListItemDTO;
  projectId: string;
  isSelected?: boolean;
  onSelect?: (planId: string) => void;
  onDelete?: (planId: string) => void;
  onCompare?: (planId: string) => void;
}

export function PlanListItem({ plan, projectId, isSelected, onSelect, onDelete, onCompare }: PlanListItemProps) {
  const handleSelect = useCallback(() => {
    onSelect?.(plan.id);
  }, [plan.id, onSelect]);

  const handleDelete = useCallback(() => {
    onDelete?.(plan.id);
  }, [plan.id, onDelete]);

  const handleCompare = useCallback(() => {
    onCompare?.(plan.id);
  }, [plan.id, onCompare]);

  const formattedDate = dayjs(plan.created_at).fromNow();

  return (
    <div className="flex items-center justify-between gap-2 rounded-md border p-3 hover:bg-accent/50">
      <div className="flex items-center gap-3">
        {onSelect && (
          <Checkbox
            checked={isSelected}
            onCheckedChange={handleSelect}
            aria-label={`Wybierz plan ${plan.version_name}`}
          />
        )}
        <a href={`/app/projects/${projectId}/plans/${plan.id}`} className="flex flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{plan.version_name}</span>
            {plan.is_outdated && (
              <Badge variant="outline" className="text-amber-500 border-amber-500">
                Nieaktualny
              </Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground">Utworzono {formattedDate}</span>
        </a>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="p-2 hover:bg-accent rounded-md text-muted-foreground" aria-label="Więcej opcji">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <a href={`/app/projects/${projectId}/plans/${plan.id}`} className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>Wyświetl plan</span>
            </a>
          </DropdownMenuItem>
          {onCompare && (
            <DropdownMenuItem onClick={handleCompare} className="flex items-center gap-2">
              <Copy className="h-4 w-4" />
              <span>Porównaj</span>
            </DropdownMenuItem>
          )}
          {onDelete && (
            <DropdownMenuItem
              onClick={handleDelete}
              className="flex items-center gap-2 text-destructive focus:text-destructive"
            >
              <Trash className="h-4 w-4" />
              <span>Usuń</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
