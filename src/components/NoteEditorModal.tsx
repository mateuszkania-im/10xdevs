import { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import dayjs from "dayjs";
import { Modal, ModalBody, ModalContent } from "@/components/ui/animated-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  CreateNoteDTO,
  UpdateNoteDTO,
  CreateConfigNoteDTO,
  UpdateConfigNoteDTO,
  NoteDetailDTO,
  NoteEditorVM,
} from "@/types";
import { noteEditorSchema } from "@/lib/schemas/noteEditorSchema";
import { useUpsertNote } from "@/lib/hooks/useUpsertNote";
import { useToast } from "@/components/ui/use-toast";
import { TagInput } from "@/components/ui/tag-input";
import { PrioritySelector } from "@/components/ui/priority-selector";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { ConfigForm } from "@/components/notes/ConfigForm";

interface NoteEditorModalProps {
  mode: "create" | "edit";
  initialData?: NoteDetailDTO;
  projectId: string;
  onSuccess: () => void;
  onClose: () => void;
  open: boolean;
  projectHasConfigNote?: boolean;
}

export function NoteEditorModal({
  mode,
  initialData,
  projectId,
  onSuccess,
  onClose,
  open,
  projectHasConfigNote = false,
}: NoteEditorModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>(initialData?.is_config_note ? "config" : "regular");
  const [hasConfigNote, setHasConfigNote] = useState<boolean>(projectHasConfigNote);

  const defaultValues: NoteEditorVM = {
    title: initialData?.title || "",
    content: initialData?.content || "",
    priority: initialData?.is_config_note ? 0 : initialData?.priority || 0,
    tags: initialData?.tags || [],
    isConfig: initialData?.is_config_note || false,
    arrival_date: initialData?.config_data?.arrival_date,
    departure_date: initialData?.config_data?.departure_date,
    num_days: initialData?.config_data?.num_days,
    num_people: initialData?.config_data?.num_people,
    destination: initialData?.config_data?.destination || "",
    travel_style: initialData?.config_data?.travel_style || "zwiedzanie",
    budget: initialData?.config_data?.budget || "",
    interests: initialData?.config_data?.interests || [],
    accommodation_address: initialData?.config_data?.accommodation_address || "",
  };

  // @ts-expect-error - problemy typowania z zodResolver i react-hook-form
  const methods = useForm<NoteEditorVM>({
    resolver: zodResolver(noteEditorSchema),
    defaultValues,
    mode: "onChange",
  });

  const {
    formState: { isSubmitting, isDirty, errors },
    setValue,
    control,
    watch,
  } = methods;

  // Hooks
  const { upsertNote, isLoading } = useUpsertNote();

  // Sprawdź, czy projekt ma już notatkę konfiguracyjną
  useEffect(() => {
    // Jeśli jesteśmy w trybie edycji notatki konfiguracyjnej, to możemy ją edytować
    if (mode === "edit" && initialData?.is_config_note) {
      setHasConfigNote(false);
      return;
    }

    // Zaktualizuj stan na podstawie projektHasConfigNote
    setHasConfigNote(projectHasConfigNote);

    // Jeśli projekt ma już notatkę konfiguracyjną, a jesteśmy na zakładce config, przełącz na regular
    if (projectHasConfigNote && activeTab === "config" && mode === "create") {
      setActiveTab("regular");
      setValue("isConfig", false, { shouldValidate: true });
    }
  }, [projectHasConfigNote, mode, initialData]);

  // Aktualizacja flagi isConfig przy zmianie zakładki
  const handleTabChange = (value: string) => {
    // Jeśli projekt ma już notatkę konfiguracyjną i próbujemy przełączyć na config w trybie tworzenia, zablokuj
    if (hasConfigNote && value === "config" && mode === "create") {
      // @ts-expect-error - błąd typowania w Shadcn UI toast
      toast({
        title: "Uwaga",
        description: "Ten projekt ma już notatkę konfiguracyjną.",
        variant: "destructive",
      });
      return;
    }

    console.log("Zmiana zakładki na:", value);
    setActiveTab(value);
    setValue("isConfig", value === "config", { shouldValidate: true });
  };

  // Automatycznie ustaw isConfig na true, jeśli edytujemy notatkę konfiguracyjną
  useEffect(() => {
    if (initialData?.is_config_note) {
      setValue("isConfig", true);
    }
  }, [initialData, setValue]);

  // Form submission
  const onSubmit = async (data: NoteEditorVM) => {
    try {
      const isConfigNote = activeTab === "config";
      let savedNote;

      // Dokładne logowanie wszystkich pól formularza, szczególnie dla notatki konfiguracyjnej
      console.log("PRZED ZAPISEM - Wszystkie dane formularza:", {
        title: data.title,
        content: data.content,
        tags: data.tags,
        isConfig: data.isConfig,
        // Pola konfiguracyjne
        arrival_date: data.arrival_date,
        departure_date: data.departure_date,
        num_days: data.num_days,
        num_people: data.num_people,
        destination: data.destination, // Sprawdź, czy to pole ma wartość
        destination_type: typeof data.destination,
        destination_length: data.destination ? data.destination.length : 0,
        travel_style: data.travel_style,
        budget: data.budget,
        interests: data.interests,
        accommodation_address: data.accommodation_address,
      });

      console.log("Dane formularza:", {
        destination: data.destination,
        accommodation_address: data.accommodation_address,
        wszystkieDane: data,
      });

      // Przygotowanie danych do zapisu
      if (mode === "create") {
        if (isConfigNote) {
          // Ręcznie pobierz aktualne wartości z formularza (dla pewności)
          const currentValues = methods.getValues();

          // Upewnij się, że wszystkie wymagane pola są wypełnione
          const createConfigDTO: CreateConfigNoteDTO = {
            title: data.title,
            content: data.content,
            priority: 0, // Zawsze 0 dla notatki konfiguracyjnej
            tags: data.tags || [],
            arrival_date: data.arrival_date || dayjs().format("YYYY-MM-DD"),
            departure_date: data.departure_date || dayjs().add(1, "day").format("YYYY-MM-DD"),
            num_days: data.num_days || 1,
            num_people: data.num_people || 1,

            // Dla pól tekstowych: upewnij się, że nie przekazujemy undefined ani null
            // Pobieramy wartości bezpośrednio, aby zniwelować problem z synchronizacją w formularzu
            destination: currentValues.destination || "",
            travel_style: currentValues.travel_style || "zwiedzanie",
            budget: currentValues.budget || "",
            interests: currentValues.interests || [],
            accommodation_address: currentValues.accommodation_address || "",
          };

          console.log("Dane wysyłane do API (CREATE):", {
            destination: createConfigDTO.destination,
            accommodation_address: createConfigDTO.accommodation_address,
            travel_style: createConfigDTO.travel_style,
            budget: createConfigDTO.budget,
            interests: createConfigDTO.interests,
          });

          try {
            savedNote = await upsertNote.createConfigNote(projectId, createConfigDTO);
            console.log("Odpowiedź z API:", savedNote);

            // Po zapisaniu notatki konfiguracyjnej, natychmiast zaktualizuj stan lokalny
            if (savedNote) {
              setHasConfigNote(true);
              
              // Wymuszamy natychmiastowe odświeżenie widoku, aby zakładka "Plany" widziała nową notatkę konfiguracyjną
              // Generujemy zdarzenie niestandardowe, które poinformuje inne komponenty o utworzeniu notatki konfiguracyjnej
              const event = new CustomEvent('configNoteCreated', { detail: { projectId } });
              window.dispatchEvent(event);
            }
          } catch (createError) {
            console.error("Błąd podczas tworzenia notatki konfiguracyjnej:", createError);
            throw createError;
          }
        } else {
          const createDTO: CreateNoteDTO = {
            title: data.title,
            content: data.content,
            priority: data.priority,
            tags: data.tags,
          };
          savedNote = await upsertNote.createNote(projectId, createDTO);
        }
      } else if (initialData) {
        if (isConfigNote) {
          // Ręcznie pobierz aktualne wartości z formularza (dla pewności)
          const currentValues = methods.getValues();

          // Upewnij się, że wszystkie pola mają wartości (domyślne, jeśli są undefined)
          const updateConfigDTO: UpdateConfigNoteDTO = {
            title: data.title,
            content: data.content,
            priority: 0, // Zawsze 0 dla notatki konfiguracyjnej
            tags: data.tags || [],
            arrival_date: data.arrival_date || initialData.config_data?.arrival_date,
            departure_date: data.departure_date || initialData.config_data?.departure_date,
            num_days: data.num_days !== undefined ? data.num_days : initialData.config_data?.num_days,
            num_people: data.num_people !== undefined ? data.num_people : initialData.config_data?.num_people,

            // Dla pól tekstowych: upewnij się, że nie przekazujemy undefined ani null
            // Pobieramy wartości bezpośrednio, aby zniwelować problem z synchronizacją w formularzu
            destination: currentValues.destination !== undefined ? currentValues.destination : "",
            travel_style: currentValues.travel_style !== undefined ? currentValues.travel_style : "zwiedzanie",
            budget: currentValues.budget !== undefined ? currentValues.budget : "",
            interests: currentValues.interests || [],
            accommodation_address:
              currentValues.accommodation_address !== undefined ? currentValues.accommodation_address : "",
          };

          console.log("Dane wysyłane do API (UPDATE):", {
            destination: updateConfigDTO.destination,
            accommodation_address: updateConfigDTO.accommodation_address,
            travel_style: updateConfigDTO.travel_style,
            budget: updateConfigDTO.budget,
            interests: updateConfigDTO.interests,
          });

          savedNote = await upsertNote.updateConfigNote(projectId, initialData.id, updateConfigDTO);
        } else {
          const updateDTO: UpdateNoteDTO = {
            title: data.title,
            content: data.content,
            priority: data.priority,
            tags: data.tags,
          };
          savedNote = await upsertNote.updateNote(projectId, initialData.id, updateDTO);
        }
      }

      // Powiadomienie o sukcesie
      toast({
        title: "Sukces",
        description: `Notatka została ${mode === "create" ? "utworzona" : "zaktualizowana"}.`,
      });

      // Zamknij modal i odśwież rodzica
      onSuccess();
    } catch (error) {
      console.error("Błąd podczas zapisywania notatki:", error);
      toast({
        title: "Błąd",
        description: `Wystąpił błąd podczas ${mode === "create" ? "tworzenia" : "aktualizacji"} notatki.`,
        variant: "destructive",
      });
    }
  };

  // Renderowanie formularza
  return (
    <Modal open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <ModalBody className="p-0 max-w-3xl w-full">
        <ModalContent className="p-0">
          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)}>
              <div className="p-6 space-y-4">
                <h2 className="text-2xl font-bold">
                  {mode === "create" ? "Nowa notatka" : "Edytuj notatkę"}
                </h2>

                {/* Zakładki dla wyboru typu notatki */}
                <Tabs
                  value={activeTab}
                  onValueChange={handleTabChange}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="regular">Zwykła notatka</TabsTrigger>
                    <TabsTrigger value="config" disabled={hasConfigNote && mode === "create"}>
                      Notatka konfiguracyjna
                    </TabsTrigger>
                  </TabsList>

                  {/* Zawartość dla zwykłej notatki */}
                  <TabsContent value="regular" className="pt-4 space-y-4">
                    {/* Tytuł */}
                    <div>
                      <Input
                        placeholder="Tytuł notatki"
                        {...methods.register("title")}
                        className="text-lg font-semibold"
                      />
                      {errors.title && (
                        <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
                      )}
                    </div>

                    {/* Priorytet */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Priorytet</label>
                      <PrioritySelector control={control} name="priority" />
                      {errors.priority && (
                        <p className="text-sm text-red-500 mt-1">{errors.priority.message}</p>
                      )}
                    </div>

                    {/* Tagi */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Tagi</label>
                      <TagInput
                        placeholder="Dodaj tagi..."
                        name="tags"
                        control={methods.control}
                      />
                    </div>

                    {/* Zawartość - edytor Rich Text */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Zawartość</label>
                      <RichTextEditor
                        name="content"
                        control={methods.control}
                        initialContent={initialData?.content || ""}
                      />
                      {errors.content && (
                        <p className="text-sm text-red-500 mt-1">{errors.content.message}</p>
                      )}
                    </div>
                  </TabsContent>

                  {/* Zawartość dla notatki konfiguracyjnej */}
                  <TabsContent value="config" className="pt-4 space-y-4">
                    {/* Tytuł */}
                    <div>
                      <Input
                        placeholder="Tytuł konfiguracji"
                        {...methods.register("title")}
                        className="text-lg font-semibold"
                      />
                      {errors.title && (
                        <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
                      )}
                    </div>

                    {/* Formularz konfiguracyjny */}
                    <ConfigForm
                      control={methods.control}
                      errors={errors}
                      watch={methods.watch}
                      setValue={methods.setValue}
                      isModal={true}
                    />

                    {/* Zawartość - edytor Rich Text */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Dodatkowe informacje</label>
                      <RichTextEditor
                        name="content"
                        control={methods.control}
                        initialContent={initialData?.content || ""}
                      />
                      {errors.content && (
                        <p className="text-sm text-red-500 mt-1">{errors.content.message}</p>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Przyciski akcji */}
              <div className="flex justify-end gap-2 p-4 border-t border-border">
                <Button type="button" variant="outline" onClick={onClose}>
                  Anuluj
                </Button>
                <Button type="submit" disabled={isSubmitting || isLoading}>
                  {mode === "create" ? "Utwórz" : "Zapisz zmiany"}
                </Button>
              </div>
            </form>
          </FormProvider>
        </ModalContent>
      </ModalBody>
    </Modal>
  );
}
