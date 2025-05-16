import React, { useEffect, useState } from "react";
import type { ProjectListItemDTO } from "@/types";
import { useAuth } from "@/lib/hooks/useAuth";

interface ProjectListProps {
  activeProjectId?: string;
}

const ProjectList: React.FC<ProjectListProps> = ({ activeProjectId }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectListItemDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Jeśli nie ma zalogowanego użytkownika, nie pobieraj projektów
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const token = localStorage.getItem("accessToken");
        if (!token) {
          throw new Error("Brak tokenu autoryzacyjnego");
        }

        const response = await fetch("/api/projects?page=1&limit=50&sort_by=updated_at&order=desc", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Błąd pobierania projektów: ${response.status}`);
        }

        const data = await response.json();
        setProjects(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Nieznany błąd");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [user]); // Uruchom ponownie po zmianie użytkownika

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 py-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded-md bg-muted"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-4 text-center text-sm text-muted-foreground">
        <p>Nie udało się załadować projektów</p>
        <button onClick={() => window.location.reload()} className="mt-2 text-primary hover:underline">
          Spróbuj ponownie
        </button>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="py-4 text-center text-sm text-muted-foreground">
        <p>Nie masz jeszcze żadnych projektów</p>
        <p className="mt-1">Kliknij &ldquo;Nowy projekt&rdquo; poniżej, aby rozpocząć</p>
      </div>
    );
  }

  return (
    <ul className="space-y-1">
      {projects.map((project) => (
        <ProjectListItem key={project.id} project={project} isActive={project.id === activeProjectId} />
      ))}
    </ul>
  );
};

interface ProjectListItemProps {
  project: ProjectListItemDTO;
  isActive: boolean;
}

const ProjectListItem: React.FC<ProjectListItemProps> = ({ project, isActive }) => {
  return (
    <li>
      <a
        href={`/app/projects/${project.id}`}
        className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors ${
          isActive ? "bg-accent text-accent-foreground" : "hover:bg-muted/50 hover:text-foreground"
        }`}
      >
        <span className="truncate">{project.name}</span>
      </a>
    </li>
  );
};

export default ProjectList;
