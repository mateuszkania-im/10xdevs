import { useState, useEffect, memo } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Modal, ModalBody, ModalContent } from "@/components/ui/animated-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

import { useCreateProject } from "@/lib/queries/projects";
import { withQueryClient } from "@/components/providers";

// Schema walidacji dla formularza
const formSchema = z.object({
  name: z
    .string()
    .min(3, "Nazwa musi mieć co najmniej 3 znaki")
    .max(100, "Nazwa nie może przekraczać 100 znaków")
    .trim(),
});

type FormValues = z.infer<typeof formSchema>;

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function NewProjectModal({ isOpen, onClose }: NewProjectModalProps) {
  const createProject = useCreateProject();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inicjalizacja React Hook Form z walidacją zod
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  // Resetujemy formularz gdy modal zostanie otwarty
  useEffect(() => {
    if (isOpen) {
      form.reset();
      console.log("NewProjectModal: Modal otwarty");
    }
  }, [isOpen, form]);

  const handleSubmit = async (values: FormValues) => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      console.log("NewProjectModal: Tworzenie projektu o nazwie:", values.name);
      await createProject.mutateAsync({ name: values.name });
      toast.success("Projekt został utworzony");
      form.reset();
      onClose();
    } catch (error) {
      console.error("NewProjectModal: Błąd tworzenia projektu:", error);
      // Sprawdzamy, czy błąd jest specyficznym błędem (np. duplikat nazwy)
      if (error instanceof Error && error.message.includes("już istnieje")) {
        form.setError("name", {
          type: "manual",
          message: "Projekt o tej nazwie już istnieje",
        });
      } else {
        toast.error("Nie udało się utworzyć projektu");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Callback do zamknięcia modalu i zresetowania formularza
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      console.log("NewProjectModal: Zamykanie modalu");
      form.reset();
      onClose();
    }
  };

  console.log("NewProjectModal: Renderowanie z isOpen =", isOpen);

  return (
    <Modal open={isOpen} onOpenChange={handleOpenChange} data-test-id="new-project-modal">
      <ModalBody className="max-w-md w-full">
        <ModalContent className="p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-2">Utwórz nowy projekt</h2>
            <p className="text-sm text-muted-foreground">Wprowadź nazwę swojego nowego projektu podróży.</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6" data-test-id="new-project-form">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nazwa projektu</FormLabel>
                    <FormControl>
                      <Input placeholder="Np. Wakacje we Włoszech 2024" {...field} data-test-id="new-project-name-input" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" type="button" onClick={onClose} data-test-id="new-project-cancel-button">
                  Anuluj
                </Button>
                <Button type="submit" disabled={isSubmitting} data-test-id="new-project-submit-button">
                  {isSubmitting ? "Tworzenie..." : "Utwórz projekt"}
                </Button>
              </div>
            </form>
          </Form>
        </ModalContent>
      </ModalBody>
    </Modal>
  );
}

// Memoizujemy komponent by zapobiec zbędnym rerenderingom
const MemoizedNewProjectModal = memo(NewProjectModal);

// Exportujemy komponent bez React Query Provider
export default withQueryClient(MemoizedNewProjectModal);
