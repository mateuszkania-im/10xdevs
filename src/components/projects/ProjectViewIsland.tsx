import { useState, useEffect } from "react";
import { fetchNote } from "@/lib/api/notes";
import type { NoteDetailDTO } from "../../types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { NoteList } from "@/components/notes/NoteList";
import { PlanList } from "@/components/projects/PlanList";
import GeneratePlanModal from "@/components/GeneratePlanModal";
import { NoteEditorModal } from "@/components/NoteEditorModal";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { useToast } from "@/components/ui/use-toast";
import { supabaseClient } from "@/db/supabase.client";

interface Props {
  projectId: string;
}

// Główny komponent, który opakuje zawartość w QueryProvider
export function ProjectViewIsland({ projectId }: Props) {
  return (
    <QueryProvider>
      <ProjectContent projectId={projectId} />
    </QueryProvider>
  );
}

// Komponenty wewnętrzy z logiką, który ma dostęp do React Query
function ProjectContent({ projectId }: Props) {
  const { toast } = useToast();
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("notes");
  const [editingNote, setEditingNote] = useState<NoteDetailDTO | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [hasConfigNote, setHasConfigNote] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [planRefreshKey, setPlanRefreshKey] = useState(0);

  // Sprawdzenie, czy projekt ma notatkę konfiguracyjną
  useEffect(() => {
    const checkConfigNote = async () => {
      try {
        setIsLoading(true);

        // Bezpośrednie użycie instancji klienta zamiast funkcji createClient
        const { data: notes, error } = await supabaseClient
          .from("notes")
          .select("id")
          .eq("project_id", projectId)
          .eq("is_config_note", true)
          .limit(1);

        if (error) {
          console.error("Błąd podczas sprawdzania notatki konfiguracyjnej:", error);
          setHasConfigNote(false);
        } else {
          const hasConfig = notes && notes.length > 0;
          setHasConfigNote(hasConfig);
          console.log("Sprawdzono notatkę konfiguracyjną:", hasConfig);
        }
      } catch (error) {
        console.error("Błąd podczas sprawdzania notatki konfiguracyjnej:", error);
        setHasConfigNote(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkConfigNote();
  }, [projectId, refreshCounter]);

  // Dodajemy efekt, który będzie sprawdzał notatkę konfiguracyjną przy zmianie zakładki na "plans"
  useEffect(() => {
    if (activeTab === "plans") {
      // Odświeżamy stan notatki konfiguracyjnej przy każdym przejściu do zakładki planów
      setRefreshCounter(prev => prev + 1);
      // Wymuszamy odświeżenie komponentu PlanList
      setPlanRefreshKey(prev => prev + 1);
    }
  }, [activeTab]);

  // Nasłuchiwanie na zdarzenie utworzenia notatki konfiguracyjnej
  useEffect(() => {
    const handleConfigNoteCreated = (event: CustomEvent) => {
      console.log("Otrzymano zdarzenie configNoteCreated:", event.detail);
      // Sprawdzamy czy to zdarzenie dotyczy tego projektu
      if (event.detail?.projectId === projectId) {
        // Odświeżamy stan notatki konfiguracyjnej
        setRefreshCounter(prev => prev + 1);
        // Wymuszamy odświeżenie komponentu PlanList
        setPlanRefreshKey(prev => prev + 1);
        // Aktualizujemy stan hasConfigNote bezpośrednio
        setHasConfigNote(true);
      }
    };

    // Rejestrujemy nasłuchiwanie zdarzenia
    window.addEventListener('configNoteCreated', handleConfigNoteCreated as EventListener);

    // Sprzątamy po sobie
    return () => {
      window.removeEventListener('configNoteCreated', handleConfigNoteCreated as EventListener);
    };
  }, [projectId]);

  const handleEditNote = async (noteId: string) => {
    try {
      const noteData = await fetchNote(projectId, noteId);
      setEditingNote(noteData);
    } catch (error) {
      console.error("Nie udało się pobrać szczegółów notatki:", error);
    }
  };

  const handleEditModalSuccess = () => {
    setEditingNote(null);
    setRefreshCounter(prev => prev + 1);
    setPlanRefreshKey(prev => prev + 1);
  };

  const handleGeneratePlanClick = () => {
    if (!hasConfigNote) {
      toast("Brak notatki konfiguracyjnej", {
        description: "Utwórz notatkę konfiguracyjną przed generowaniem planu.",
      });
      return;
    }

    // Otwórz modal
    setIsGenerateModalOpen(true);
  };

  // Aktualizacja akcji handleTabChange, aby dodatkowo wymuszać sprawdzenie notatki konfiguracyjnej
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Jeśli przechodzimy do zakładki planów, odświeżmy stan notatki konfiguracyjnej
    if (value === "plans") {
      console.log("Przełączono na zakładkę planów - sprawdzam notatkę konfiguracyjną");
      // Wymuszamy sprawdzenie istnienia notatki konfiguracyjnej
      setRefreshCounter(prev => prev + 1);
      // Wymuszamy odświeżenie komponentu PlanList
      setPlanRefreshKey(prev => prev + 1);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projekt podróży</h1>
      </div>

      <Tabs defaultValue="notes" onValueChange={handleTabChange} value={activeTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="notes">Notatki</TabsTrigger>
          <TabsTrigger value="plans">Plany</TabsTrigger>
        </TabsList>
        <TabsContent value="notes">
          <NoteList projectId={projectId} onEdit={handleEditNote} refreshCounter={refreshCounter} />
        </TabsContent>
        <TabsContent value="plans">
          <div className="mb-4 flex justify-end">
            <Button onClick={handleGeneratePlanClick} className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              <span>Generuj plan</span>
            </Button>
          </div>
          <PlanList key={planRefreshKey} projectId={projectId} hasConfigNote={hasConfigNote} />
        </TabsContent>
      </Tabs>

      <GeneratePlanModal
        projectId={projectId}
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        hasConfigNote={hasConfigNote}
      />

      {editingNote && (
        <NoteEditorModal
          mode="edit"
          initialData={editingNote}
          projectId={projectId}
          open={true}
          onSuccess={handleEditModalSuccess}
          onClose={() => setEditingNote(null)}
        />
      )}
    </div>
  );
}
