import { useState, useEffect, useCallback } from "react";
import { Toaster } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import ProjectFilters from "./projects/ProjectFilters";
import ProjectGrid from "./projects/ProjectGrid";
import ProjectListView from "./projects/ProjectListView";
import EmptyState from "./projects/EmptyState";
import NewProjectButton from "./projects/NewProjectButton";
import NewProjectModal from "./projects/NewProjectModal";
import { useProjectFilters } from "@/lib/hooks/useProjectFilters";
import { useProjects } from "@/lib/queries/projects";
import { useUpdateProject, useDeleteProject } from "@/lib/queries/projects";
import { toast } from "sonner";
import { withQueryClient } from "@/components/providers";

function ProjectsPageIsland() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { filters, setFilters, updatePaginationData } = useProjectFilters();

  const { data: projectsData, isLoading, error } = useProjects(filters);

  const projects = projectsData?.data ?? [];
  const pagination = projectsData?.pagination;

  // Debugowanie
  useEffect(() => {
    console.log("ProjectsPageIsland - Dane z useProjects:", {
      projects,
      isLoading,
      error,
      "Liczba projektów": projects?.length || 0,
      "Pierwszy projekt": projects?.length > 0 ? projects[0] : null,
    });
  }, [projects, isLoading, error]);

  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  // Bezpieczna aktualizacja danych paginacji tylko gdy mamy nowe dane i się zmieniły
  useEffect(() => {
    if (pagination && !isLoading && (pagination.total !== filters.total || pagination.pages !== filters.totalPages)) {
      updatePaginationData(pagination.total || 0, pagination.pages || 0);
    }
  }, [pagination, isLoading, filters.total, filters.totalPages, updatePaginationData]);

  const handleOpenModal = useCallback(() => {
    console.log("ProjectsPageIsland: Otwieranie modala - przed zmianą stanu isModalOpen:", isModalOpen);
    setIsModalOpen(true);
    console.log("ProjectsPageIsland: Otwieranie modala - po zmianie stanu");
  }, [isModalOpen]);
  
  const handleCloseModal = useCallback(() => {
    console.log("ProjectsPageIsland: Zamykanie modala");
    setIsModalOpen(false);
  }, []);

  const handleEdit = useCallback(
    async (id: string, name: string) => {
      try {
        await updateProject.mutateAsync({ id, data: { name } });
        toast.success("Nazwa projektu została zaktualizowana");
      } catch {
        toast.error("Nie udało się zaktualizować nazwy projektu");
      }
    },
    [updateProject]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteProject.mutateAsync(id);
        toast.success("Projekt został usunięty");
      } catch {
        toast.error("Nie udało się usunąć projektu");
      }
    },
    [deleteProject]
  );

  // Sprawdzamy, czy projekty są poprawnie zdefiniowane i czy jest to tablica
  const hasProjects = !isLoading && !error && Array.isArray(projects) && projects.length > 0;

  // Sprawdzanie, czy należy pokazać komunikat o braku projektów
  const showEmptyState = !isLoading && !error && (!Array.isArray(projects) || projects.length === 0);

  // Komponent listy lub siatki projektów - wybieramy na podstawie stanu
  const renderProjectsContent = useCallback(
    (viewType: "grid" | "list") => {
      if (isLoading) {
        return viewType === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-[200px] rounded-md" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-md" />
            ))}
          </div>
        );
      }

      if (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return (
          <div className="text-center py-10">
            <p className="text-destructive">Wystąpił błąd podczas ładowania projektów.</p>
            <p className="text-sm text-muted-foreground mt-2">{errorMessage}</p>
          </div>
        );
      }

      if (showEmptyState) {
        return <EmptyState onCreateProject={handleOpenModal} />;
      }

      return viewType === "grid" ? (
        <ProjectGrid projects={projects} />
      ) : (
        <ProjectListView projects={projects} onEdit={handleEdit} onDelete={handleDelete} />
      );
    },
    [isLoading, error, showEmptyState, projects, handleOpenModal, handleEdit, handleDelete]
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold" data-test-id="projects-heading">Twoje projekty</h1>
      </div>

      <Tabs defaultValue="grid" className="w-full">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0 mb-6">
          {hasProjects && (
            <>
              <TabsList>
                <TabsTrigger value="grid">Siatka</TabsTrigger>
                <TabsTrigger value="list">Lista</TabsTrigger>
              </TabsList>

              <ProjectFilters value={filters} onChange={setFilters} />
            </>
          )}
        </div>

        <TabsContent value="grid" className="mt-6">
          {renderProjectsContent("grid")}
        </TabsContent>

        <TabsContent value="list" className="mt-6">
          {renderProjectsContent("list")}
        </TabsContent>
      </Tabs>

      <NewProjectButton onClick={handleOpenModal} />
      <NewProjectModal isOpen={isModalOpen} onClose={handleCloseModal} />
      <Toaster />
    </div>
  );
}

export default withQueryClient(ProjectsPageIsland);
