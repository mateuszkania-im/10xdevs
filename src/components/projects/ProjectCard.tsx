import { useState, useCallback } from "react";
import { CalendarIcon, MoreVertical, Edit, Trash2 } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/pl";
import type { ProjectListItemDTO } from "@/types";
import { cn } from "@/lib/utils";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Modal, ModalBody, ModalContent } from "@/components/ui/animated-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface ProjectCardProps {
  project: ProjectListItemDTO;
  onEdit: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

export default function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  const navigate = (path: string) => {
    window.location.href = path;
  };

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editedName, setEditedName] = useState(project.name);

  const hasConfig = project.has_config_note;
  const formattedDate = dayjs(project.updated_at).locale("pl").format("D MMMM YYYY");

  const handleCardClick = useCallback(() => {
    navigate(`/app/projects/${project.id}`);
  }, [project.id]);

  const handleEditClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setEditedName(project.name);
      setIsEditDialogOpen(true);
    },
    [project.name]
  );

  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteDialogOpen(true);
  }, []);

  const handleEditSubmit = useCallback(() => {
    onEdit(project.id, editedName);
    setIsEditDialogOpen(false);
  }, [project.id, editedName, onEdit]);

  const handleDeleteConfirm = useCallback(() => {
    onDelete(project.id);
    setIsDeleteDialogOpen(false);
  }, [project.id, onDelete]);

  return (
    <>
      <Card
        className={cn(
          "cursor-pointer transition-all hover:shadow-md",
          hasConfig ? "border-primary/20" : "border-muted"
        )}
        onClick={handleCardClick}
        data-test-id={`project-card-${project.id}`}
      >
        <CardHeader className="relative pb-2">
          <div className="absolute right-4 top-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEditClick}>
                  <Edit className="mr-2 h-4 w-4" />
                  <span>Zmień nazwę</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDeleteClick} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Usuń projekt</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <CardTitle className="pr-8 truncate" title={project.name}>
            {project.name}
          </CardTitle>
          <CardDescription className="flex items-center space-x-1 mt-1">
            <CalendarIcon className="h-3 w-3 mr-1" />
            <span>Aktualizacja: {formattedDate}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground truncate">ID: {project.id.substring(0, 8)}</p>
        </CardContent>
        <CardFooter className="pt-0">
          {hasConfig && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              Skonfigurowany
            </Badge>
          )}
        </CardFooter>
      </Card>

      {/* Dialog zmiany nazwy */}
      <Modal open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <ModalBody className="max-w-[425px]">
          <ModalContent>
            <div className="mb-6">
              <h2 className="text-2xl font-semibold">Zmień nazwę projektu</h2>
              <p className="text-sm text-muted-foreground">Wprowadź nową nazwę projektu podróży.</p>
            </div>
            <div className="py-4">
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                placeholder="Nazwa projektu"
                className="w-full"
              />
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Anuluj
              </Button>
              <Button onClick={handleEditSubmit} disabled={!editedName.trim() || editedName.trim().length < 3}>
                Zapisz
              </Button>
            </div>
          </ModalContent>
        </ModalBody>
      </Modal>

      {/* Dialog potwierdzenia usunięcia */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Czy na pewno chcesz usunąć ten projekt?</AlertDialogTitle>
            <AlertDialogDescription>
              Ta akcja jest nieodwracalna i spowoduje usunięcie wszystkich notatek i planów podróży.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Usuń projekt
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
