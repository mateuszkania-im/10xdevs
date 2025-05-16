import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { usePlans, useDeletePlan } from "@/lib/queries/plans";
import { PlanListItem } from "./PlanListItem";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PlanListProps {
  projectId: string;
  allowComparison?: boolean;
  hasConfigNote?: boolean;
}

export function PlanList({ projectId, allowComparison = true, hasConfigNote = false }: PlanListProps) {
  const { toast } = useToast();
  const [selectedPlans, setSelectedPlans] = useState<string[]>([]);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);

  const { data: plansData, isLoading } = usePlans(projectId, {
    sortBy: "created_at",
    order: "desc",
    includeOutdated: true,
  });

  const { mutate: deletePlan } = useDeletePlan();

  const handleSelect = useCallback((planId: string) => {
    setSelectedPlans((prev) => {
      // Jeśli już jest zaznaczony, usuń z selekcji
      if (prev.includes(planId)) {
        return prev.filter((id) => id !== planId);
      }

      // Jeśli próbujemy zaznaczyć więcej niż 2 plany (dla porównania)
      if (prev.length >= 2) {
        // Usuń najstarszy zaznaczony i dodaj nowy
        const [_, ...rest] = prev;
        return [...rest, planId];
      }

      // Dodaj do zaznaczonych
      return [...prev, planId];
    });
  }, []);

  const handleDelete = useCallback((planId: string) => {
    setPlanToDelete(planId);
  }, []);

  const confirmDelete = useCallback(() => {
    if (planToDelete) {
      deletePlan(
        { projectId, planId: planToDelete },
        {
          onSuccess: () => {
            toast("Plan usunięty", {
              description: "Plan został pomyślnie usunięty",
            });
            // Jeśli plan był zaznaczony, usuń go z selekcji
            setSelectedPlans((prev) => prev.filter((id) => id !== planToDelete));
          },
          onError: (error) => {
            toast("Błąd", {
              description: error.message,
            });
          },
        }
      );
      setPlanToDelete(null);
    }
  }, [planToDelete, projectId, deletePlan, toast]);

  const cancelDelete = useCallback(() => {
    setPlanToDelete(null);
  }, []);

  const navigateToCompare = useCallback(() => {
    if (selectedPlans.length !== 2) return;

    const [plan1, plan2] = selectedPlans;
    const compareUrl = `/app/projects/${projectId}/plans/compare?plan1=${plan1}&plan2=${plan2}`;
    window.location.href = compareUrl;
  }, [selectedPlans, projectId]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const plans = plansData?.data || [];

  if (plans.length === 0) {
    return (
      <div className="rounded-md border p-6 text-center">
        <h3 className="text-lg font-medium mb-2">Brak wygenerowanych planów</h3>
        {!hasConfigNote ? (
          <p className="text-muted-foreground mb-4">
            Utwórz notatkę konfiguracyjną, aby wygenerować swój pierwszy plan podróży.
          </p>
        ) : (
          <p className="text-muted-foreground mb-4">
            Kliknij przycisk "Generuj plan" powyżej, aby stworzyć swój pierwszy plan podróży.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Wygenerowane plany</h3>
        {allowComparison && selectedPlans.length === 2 && (
          <Button onClick={navigateToCompare} size="sm">
            Porównaj zaznaczone plany
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {plans.map((plan) => (
          <PlanListItem
            key={plan.id}
            plan={plan}
            projectId={projectId}
            isSelected={selectedPlans.includes(plan.id)}
            onSelect={allowComparison ? handleSelect : undefined}
            onDelete={handleDelete}
            onCompare={allowComparison && selectedPlans.length < 2 ? handleSelect : undefined}
          />
        ))}
      </div>

      <AlertDialog open={!!planToDelete} onOpenChange={(open) => !open && setPlanToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Potwierdzenie usunięcia</AlertDialogTitle>
            <AlertDialogDescription>
              Czy na pewno chcesz usunąć ten plan? Ta akcja jest nieodwracalna.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete}>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
