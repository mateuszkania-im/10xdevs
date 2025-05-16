import { useMemo } from "react";
import type { ProjectListItemDTO } from "@/types";
import ProjectCard from "./ProjectCard";
import { useUpdateProject, useDeleteProject } from "@/lib/queries/projects";
import { toast } from "sonner";

interface ProjectGridProps {
  projects: ProjectListItemDTO[];
}

export default function ProjectGrid({ projects }: ProjectGridProps) {
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const sortedProjects = useMemo(() => {
    return [...projects];
  }, [projects]);

  const handleEdit = async (id: string, name: string) => {
    try {
      await updateProject.mutateAsync({ id, data: { name } });
      toast.success("Nazwa projektu została zaktualizowana");
    } catch {
      toast.error("Nie udało się zaktualizować nazwy projektu");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProject.mutateAsync(id);
      toast.success("Projekt został usunięty");
    } catch {
      toast.error("Nie udało się usunąć projektu");
    }
  };

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {sortedProjects.map((project) => (
        <ProjectCard key={project.id} project={project} onEdit={handleEdit} onDelete={handleDelete} />
      ))}
    </section>
  );
}
