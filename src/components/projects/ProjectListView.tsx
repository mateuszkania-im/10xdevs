import { useMemo } from "react";
import type { ProjectListItemDTO } from "@/types";
import dayjs from "dayjs";
import "dayjs/locale/pl";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, CalendarIcon, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectListViewProps {
  projects: ProjectListItemDTO[];
  onEdit: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

export default function ProjectListView({ projects, onEdit, onDelete }: ProjectListViewProps) {
  const sortedProjects = useMemo(() => {
    return [...projects];
  }, [projects]);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Nazwa projektu</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data utworzenia</TableHead>
            <TableHead>Ostatnia aktualizacja</TableHead>
            <TableHead className="text-right">Akcje</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedProjects.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                Brak projektów do wyświetlenia
              </TableCell>
            </TableRow>
          ) : (
            sortedProjects.map((project) => (
              <TableRow key={project.id}>
                <TableCell className="font-medium">
                  <a href={`/app/projects/${project.id}`} className="flex items-center hover:underline">
                    {project.name}
                    <ExternalLink className="ml-2 h-3 w-3 text-muted-foreground" />
                  </a>
                </TableCell>
                <TableCell>
                  {project.has_config_note ? (
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      Skonfigurowany
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-muted/50">
                      Nowy
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <span className="flex items-center text-muted-foreground">
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    {dayjs(project.created_at).locale("pl").format("D MMM YYYY")}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="flex items-center text-muted-foreground">
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    {dayjs(project.updated_at).locale("pl").format("D MMM YYYY")}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onEdit(project.id, project.name)}
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edytuj</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => onDelete(project.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Usuń</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
