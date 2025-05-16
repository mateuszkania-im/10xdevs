import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { memo } from "react";

interface NewProjectButtonProps {
  onClick: () => void;
}

function NewProjectButton({ onClick }: NewProjectButtonProps) {
  const handleClick = () => {
    console.log("NewProjectButton: Kliknięcie przycisku nowego projektu");
    onClick();
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleClick}
            size="icon"
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
            aria-label="Dodaj nowy projekt"
            data-test-id="new-project-button"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Utwórz nowy projekt</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Memoizujemy komponent żeby uniknąć zbędnych renderowań
export default memo(NewProjectButton);
