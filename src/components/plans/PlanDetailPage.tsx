import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { usePlan, useUpdatePlan, useDeletePlan, useExportPlanToPdf } from "@/lib/queries/plans";
import { useConfigNote } from "@/lib/queries/notes";
import { PlanHeader } from "./PlanHeader";
import { DayAccordion } from "./DayAccordion";
import { Button } from "@/components/ui/button";
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
import { FileText, Info } from "lucide-react";

interface PlanDetailPageProps {
  projectId: string;
  planId: string;
}

export default function PlanDetailPage({ projectId, planId }: PlanDetailPageProps) {
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [destinationInfo, setDestinationInfo] = useState<{
    destination?: string;
    arrival_date?: string;
    departure_date?: string;
    num_people?: number;
    budget?: string;
    travel_style?: string;
  } | null>(null);

  const { data: plan, isLoading, error } = usePlan(projectId, planId);
  const { data: configNote } = useConfigNote(projectId);
  const { mutate: updatePlan } = useUpdatePlan();
  const { mutate: deletePlan } = useDeletePlan();
  const { mutate: exportToPdf, isLoading: isExporting } = useExportPlanToPdf();

  // Gdy mamy dane notatki konfiguracyjnej, ustaw informacje o miejscu docelowym
  useEffect(() => {
    if (configNote?.config_data) {
      const { destination, arrival_date, departure_date, num_people, budget, travel_style } = configNote.config_data;

      setDestinationInfo({
        destination,
        arrival_date,
        departure_date,
        num_people,
        budget,
        travel_style,
      });
    }
  }, [configNote]);

  const handleTitleUpdate = (title: string) => {
    updatePlan(
      {
        projectId,
        planId,
        data: { version_name: title },
      },
      {
        onSuccess: () => {
          toast({
            title: "Zaktualizowano",
            description: "Nazwa planu została zaktualizowana",
          });
        },
        onError: (error) => {
          toast({
            title: "Błąd",
            description: error.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    deletePlan(
      { projectId, planId },
      {
        onSuccess: () => {
          toast({
            title: "Plan usunięty",
            description: "Plan został pomyślnie usunięty",
          });
          // Przekieruj do strony projektu
          window.location.href = `/app/projects/${projectId}`;
        },
        onError: (error) => {
          toast({
            title: "Błąd",
            description: error.message,
            variant: "destructive",
          });
        },
      }
    );
    setIsDeleteDialogOpen(false);
  };

  const handleExport = () => {
    exportToPdf(
      { projectId, planId },
      {
        onSuccess: (blob) => {
          // Utwórz link do pobrania
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          const planName = plan?.version_name || "plan-podrozy";
          a.href = url;
          a.download = `${planName}.pdf`;
          document.body.appendChild(a);
          a.click();

          // Cleanup
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);

          toast({
            title: "Eksport zakończony",
            description: "Plan został wyeksportowany do PDF",
          });
        },
        onError: (error) => {
          toast({
            title: "Błąd eksportu",
            description: error.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-destructive/50 p-6 text-center">
        <h2 className="text-xl font-bold text-destructive">Wystąpił błąd</h2>
        <p className="mt-2 text-muted-foreground">{error.message}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => (window.location.href = `/app/projects/${projectId}`)}
        >
          Powrót do projektu
        </Button>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="rounded-md border p-6 text-center">
        <h2 className="text-xl font-bold">Plan nie został znaleziony</h2>
        <p className="mt-2 text-muted-foreground">Plan mógł zostać usunięty lub nie istnieje</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => (window.location.href = `/app/projects/${projectId}`)}
        >
          Powrót do projektu
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <PlanHeader
        plan={plan}
        onTitleUpdate={handleTitleUpdate}
        onDelete={handleDelete}
        destinationInfo={destinationInfo || undefined}
        projectId={projectId}
      />

      <div className="flex justify-between items-center">
        <div className="flex items-center text-muted-foreground text-sm">
          <Info className="h-4 w-4 mr-1.5" />
          <span>Utworzono {new Date(plan.created_at).toLocaleDateString("pl-PL")}</span>
        </div>

        <Button variant="outline" onClick={handleExport} disabled={isExporting} className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          {isExporting ? "Eksportowanie..." : "Eksportuj do PDF"}
        </Button>
      </div>

      {plan.content.days.length > 0 ? (
        <DayAccordion days={plan.content.days} />
      ) : (
        <div className="rounded-md border-2 border-dashed border-muted p-8 text-center">
          <h3 className="font-medium text-muted-foreground">Ten plan nie zawiera żadnych dni</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Coś poszło nie tak podczas generowania planu. Spróbuj wygenerować nowy plan.
          </p>
        </div>
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Potwierdzenie usunięcia</AlertDialogTitle>
            <AlertDialogDescription>
              Czy na pewno chcesz usunąć ten plan? Ta akcja jest nieodwracalna.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
