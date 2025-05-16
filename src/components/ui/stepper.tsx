import { cn } from "@/lib/utils";
import { CheckIcon } from "@radix-ui/react-icons";

interface StepProps {
  title: string;
  description?: string;
  isActive?: boolean;
  isCompleted?: boolean;
  index: number;
}

export function Step({ title, description, isActive = false, isCompleted = false, index }: StepProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-2",
        (isActive || isCompleted) && "text-foreground",
        !isActive && !isCompleted && "text-muted-foreground"
      )}
    >
      <div
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium",
          isActive && "border-primary bg-primary text-primary-foreground",
          isCompleted && "border-primary bg-primary text-primary-foreground",
          !isActive && !isCompleted && "border-muted-foreground"
        )}
      >
        {isCompleted ? <CheckIcon className="h-3.5 w-3.5" /> : index + 1}
      </div>
      <div className="flex flex-col">
        <div className="text-sm font-medium">{title}</div>
        {description && <div className="text-xs text-muted-foreground">{description}</div>}
      </div>
    </div>
  );
}

interface StepperProps {
  currentStep: number;
  steps: {
    title: string;
    description?: string;
  }[];
  className?: string;
}

export function Stepper({ currentStep, steps, className }: StepperProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {steps.map((step, index) => (
        <Step
          key={index}
          index={index}
          title={step.title}
          description={step.description}
          isActive={currentStep === index}
          isCompleted={currentStep > index}
        />
      ))}
    </div>
  );
}

export { Stepper as default };
