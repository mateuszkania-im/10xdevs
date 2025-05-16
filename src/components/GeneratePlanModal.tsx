import { useState, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Modal, ModalBody, ModalContent } from "@/components/ui/animated-modal";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import type { GeneratePlanDTO } from "@/types";
import { useGeneratePlan } from "@/lib/queries/plans";
import { QueryProvider } from "@/components/providers/QueryProvider";
import Stepper from "./ui/stepper";

// Schemat walidacji formularza
const generatePlanSchema = z.object({
  version_name: z
    .string()
    .min(1, { message: "Nazwa wersji jest wymagana" })
    .max(50, { message: "Nazwa wersji nie może przekraczać 50 znaków" }),
  questions: z.string().optional(),
});

// Typ inferowany ze schematu
type GeneratePlanFormValues = z.infer<typeof generatePlanSchema>;

interface GeneratePlanModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  hasConfigNote?: boolean;
}

// Prosta sekcja pokazująca postęp
function SimpleProgressSection() {
  return (
    <div className="py-8 text-center">
      <div className="flex justify-center mb-4">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
      <h3 className="text-lg font-semibold mb-2">Generowanie planu</h3>
      <p className="text-muted-foreground">Trwa generowanie planu podróży...</p>
    </div>
  );
}

function GeneratePlanModalContent({ projectId, isOpen, onClose, hasConfigNote = false }: GeneratePlanModalProps) {
  const { toast, error } = useToast();
  const [step, setStep] = useState<0 | 1>(0); // 0 - konfiguracja, 1 - generowanie

  // Definicja kroków wizarda
  const steps = useMemo(
    () => [
      {
        title: "Konfiguracja",
        description: "Ustaw parametry generowania planu",
      },
      {
        title: "Generowanie",
        description: "Obserwuj postęp generowania planu",
      },
    ],
    []
  );

  // Użycie hooka useGeneratePlan z React Query
  const { mutateAsync, isPending } = useGeneratePlan();

  // Inicjalizacja formularza z React Hook Form
  const form = useForm<GeneratePlanFormValues>({
    resolver: zodResolver(generatePlanSchema),
    defaultValues: {
      version_name: "",
      questions: "",
    },
    mode: "onChange", // Ustawienie trybu walidacji na onChange
  });

  // Funkcja przejścia do następnego kroku
  const handleNext = useCallback(() => {
    // Sprawdź, czy istnieje notatka konfiguracyjna
    if (!hasConfigNote) {
      error("Brak notatki konfiguracyjnej", {
        description: "Utwórz notatkę konfiguracyjną przed generowaniem planu.",
      });
      return;
    }

    // Sprawdź, czy nazwa wersji jest uzupełniona i wymuś walidację
    if (!form.getValues().version_name) {
      form.setError("version_name", {
        type: "manual",
        message: "Nazwa wersji jest wymagana",
      });
      return;
    }

    form.handleSubmit(onSubmit)();
  }, [form, hasConfigNote, error]);

  // Obsługa wysłania formularza
  const onSubmit = async (data: GeneratePlanFormValues) => {
    setStep(1);

    try {
      // Wywołanie API do generowania planu
      const planData: GeneratePlanDTO = {
        version_name: data.version_name,
      };

      const result = await mutateAsync({
        projectId,
        data: planData,
      });

      toast("Plan wygenerowany", {
        description: "Przekierowanie do widoku planu...",
      });

      // Przekierowanie do widoku planu
      window.location.href = `/app/projects/${projectId}/plans/${result.id}`;
    } catch (err) {
      error("Błąd", {
        description: err instanceof Error ? err.message : "Wystąpił nieznany błąd",
      });

      // Wróć do pierwszego kroku w przypadku błędu
      setStep(0);
    }
  };

  // Obsługa anulowania
  const handleCancel = useCallback(() => {
    // Resetuj formularz i krok
    form.reset();
    setStep(0);
    onClose();
  }, [form, onClose]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleCancel();
    }
  };

  return (
    <Modal open={isOpen} onOpenChange={handleOpenChange}>
      <ModalBody className="max-w-[500px]">
        <ModalContent>
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">Generuj plan</h2>
          </div>

          <div className="grid grid-cols-[1fr_2fr] gap-6">
            {/* Lewa kolumna - stepper */}
            <div className="border-r pr-4">
              <Stepper currentStep={step} steps={steps} />
            </div>

            {/* Prawa kolumna - zawartość kroku */}
            <div>
              {step === 0 ? (
                <div className="space-y-4">
                  <Form {...form}>
                    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                      <FormField
                        control={form.control}
                        name="version_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nazwa wersji planu</FormLabel>
                            <FormControl>
                              <Input placeholder="np. Wersja podstawowa" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="questions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dodatkowe pytania (opcjonalnie)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Wpisz dodatkowe pytania lub sugestie dla AI..."
                                className="h-24 resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </form>
                  </Form>
                </div>
              ) : (
                <SimpleProgressSection />
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="secondary" onClick={handleCancel}>
              {isPending ? "Anuluj" : "Zamknij"}
            </Button>

            {step === 0 && (
              <Button onClick={handleNext} disabled={isPending} type="submit">
                Generuj
              </Button>
            )}
          </div>
        </ModalContent>
      </ModalBody>
    </Modal>
  );
}

// Wrapper z QueryProvider dla GeneratePlanModal
const GeneratePlanModal = (props: GeneratePlanModalProps) => (
  <QueryProvider>
    <GeneratePlanModalContent {...props} />
  </QueryProvider>
);

export default GeneratePlanModal;
