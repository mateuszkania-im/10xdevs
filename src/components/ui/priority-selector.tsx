import { useController } from "react-hook-form";
import type { Control } from "react-hook-form";
import { Slider } from "@/components/ui/slider";
import type { NoteEditorVM } from "@/types";

interface PrioritySelectorProps {
  name: "priority";
  control: Control<NoteEditorVM>;
  min?: number;
  max?: number;
  step?: number;
}

// Pomocnicza funkcja do określania koloru na podstawie wartości priorytetu
const getPriorityColor = (value: number, max = 10): string => {
  if (value === 0) return "bg-gray-300 dark:bg-gray-600";
  if (value <= max * 0.25) return "bg-green-500";
  if (value <= max * 0.5) return "bg-blue-500";
  if (value <= max * 0.75) return "bg-yellow-500";
  return "bg-red-500";
};

// Pomocnicza funkcja do określania opisu priorytetu
const getPriorityLabel = (value: number, max = 10): string => {
  if (value === 0) return "Brak priorytetu";
  if (value <= max * 0.25) return "Niski priorytet";
  if (value <= max * 0.5) return "Średni priorytet";
  if (value <= max * 0.75) return "Wysoki priorytet";
  return "Krytyczny priorytet";
};

export function PrioritySelector({ name, control, min = 0, max = 10, step = 1 }: PrioritySelectorProps) {
  const {
    field: { value, onChange },
    fieldState: { error },
  } = useController({
    name,
    control,
  });

  const priorityValue = value as number;
  const priorityColor = getPriorityColor(priorityValue, max);
  const priorityLabel = getPriorityLabel(priorityValue, max);

  const handlePriorityChange = (newValue: number[]) => {
    onChange(newValue[0]);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">
          Priorytet: <span className="font-bold">{priorityValue}</span>
        </label>
        <span className={`text-xs px-2 py-1 rounded-full text-white ${priorityColor}`}>{priorityLabel}</span>
      </div>

      <Slider
        defaultValue={[priorityValue]}
        min={min}
        max={max}
        step={step}
        onValueChange={handlePriorityChange}
        aria-label="Priorytet"
        className="my-4"
      />

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Niski</span>
        <span>Średni</span>
        <span>Wysoki</span>
      </div>

      {error && <p className="text-sm text-red-500">{error.message}</p>}
    </div>
  );
}
