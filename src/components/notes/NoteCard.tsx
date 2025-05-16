import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Edit,
  Trash,
  Calendar,
  Users,
  MapPin,
  ArrowRightLeft,
  Compass,
  DollarSign,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";
import { deleteNote } from "@/lib/api/notes";
import type { NoteDetailDTO } from "@/types";
import { cn } from "@/lib/utils";
import { createClientSync } from "@/db";

interface NoteCardProps {
  note: NoteDetailDTO;
  projectId: string;
  onDeleted: () => void;
  onEdit: (noteId: string) => void;
}

export function NoteCard({ note, projectId, onDeleted, onEdit }: NoteCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [configData, setConfigData] = useState(note.config_data);
  const { toast } = useToast();

  // Jeśli notatka jest konfiguracyjna, ale nie ma danych konfiguracyjnych, to je pobieramy
  useEffect(() => {
    const fetchConfigData = async () => {
      if (note.is_config_note && !note.config_data) {
        try {
          // Używamy synchronicznej wersji createClient
          const supabase = createClientSync();

          // Pobieramy notatkę konfiguracyjną bezpośrednio
          const { data: configNote } = await supabase
            .from("notes")
            .select("id")
            .eq("project_id", projectId)
            .eq("is_config_note", true)
            .single();

          if (configNote) {
            // Pobieramy dane konfiguracyjne z uwzględnieniem faktycznej struktury tabeli
            // Usuwamy accommodation_address, którego nie ma w schemacie
            const { data } = await supabase
              .from("config_data")
              .select(
                "arrival_date, departure_date, num_days, num_people, destination, travel_style, budget, interests"
              )
              .eq("note_id", configNote.id)
              .single();

            if (data) {
              setConfigData({
                arrival_date: data.arrival_date,
                departure_date: data.departure_date,
                num_days: data.num_days,
                num_people: data.num_people,
                destination: data.destination || "",
                travel_style: data.travel_style || "",
                budget: data.budget || "",
                interests: data.interests || [],
                // Ustawiamy domyślną wartość dla pola, które nie istnieje w bazie danych
                accommodation_address: "",
              });
            }
          }
        } catch (error) {
          console.error("Błąd podczas pobierania danych konfiguracyjnych:", error);
        }
      }
    };

    fetchConfigData();
  }, [note.is_config_note, note.config_data, note.id, projectId]);

  // Funkcja do określania koloru priorytetu na podstawie wartości
  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1:
        return "bg-blue-500"; // Niski priorytet - niebieski
      case 2:
        return "bg-amber-500"; // Średni priorytet - żółty/bursztynowy
      case 3:
        return "bg-orange-500"; // Wysoki priorytet - pomarańczowy
      case 4:
      case 5:
        return "bg-red-500"; // Bardzo wysoki priorytet - czerwony
      default:
        return "bg-slate-400"; // Domyślny (0 lub nieprawidłowy) - szary
    }
  };

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await deleteNote(projectId, note.id);

      toast({
        title: "Sukces",
        description: "Notatka została usunięta",
      });

      // Wywołujemy callback onDeleted z informacją o zaktualizowanym projekcie
      onDeleted();

      // Jeśli to była notatka konfiguracyjna, odświeżamy całą stronę
      // aby zaktualizować wszystkie komponenty, które mogą zależeć od tego stanu
      if (note.is_config_note) {
        window.location.reload();
      }
    } catch (error) {
      console.error("Błąd podczas usuwania notatki:", error);
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć notatki",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const truncateContent = (content: string | null, maxLength = 100) => {
    if (!content) return "";

    try {
      // Usunięcie atrybutów dir="ltr" i innych niechcianych atrybutów
      const cleanedHtml = content.replace(/\s+dir="ltr"/g, "");

      // Pobranie czystego tekstu do sprawdzenia długości
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = cleanedHtml;
      const textContent = tempDiv.textContent || tempDiv.innerText || "";

      // Jeśli tekst jest krótszy niż maksymalna długość, zwróć oczyszczony HTML
      if (textContent.length <= maxLength) {
        return cleanedHtml;
      }

      // W przeciwnym razie przytnij treść i zachowaj zamknięcie tagów
      // Przygotuj parser do bezpiecznego obcinania HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(cleanedHtml, "text/html");

      let currentLength = 0;
      let isTruncated = false;

      // Funkcja rekurencyjna do ograniczania długości tekstu w węzłach
      function truncateNode(node: Node) {
        if (isTruncated) return;

        if (node.nodeType === Node.TEXT_NODE && node.textContent) {
          if (currentLength + node.textContent.length > maxLength) {
            // Przytnij tekst w tym węźle
            node.textContent = node.textContent.slice(0, maxLength - currentLength) + "...";
            currentLength = maxLength;
            isTruncated = true;
          } else {
            currentLength += node.textContent.length;
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          // Przetwarzaj elementy potomne
          Array.from(node.childNodes).forEach((child) => truncateNode(child));
        }
      }

      // Zacznij od body
      truncateNode(doc.body);

      return doc.body.innerHTML;
    } catch (error) {
      console.error("Błąd podczas przetwarzania treści HTML:", error);
      // W przypadku błędu zwróć czysty tekst
      return content.replace(/<[^>]*>/g, "").slice(0, maxLength) + "...";
    }
  };

  return (
    <>
      <Card
        className={cn(
          "h-full flex flex-col",
          note.is_config_note && "border-blue-400 dark:border-blue-600 border-2 bg-blue-50/30 dark:bg-blue-900/10"
        )}
      >
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg">{note.title}</CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(note.id)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edytuj
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  disabled={isDeleting}
                  onClick={handleDeleteClick}
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Usuń
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex gap-1 flex-wrap mt-1">
            {note.is_config_note && (
              <Badge variant="default" className="bg-blue-500 hover:bg-blue-500/90">
                <Calendar className="h-3 w-3 mr-1" />
                Konfiguracja
              </Badge>
            )}
            {!note.is_config_note && note.priority > 0 && (
              <Badge variant="default" className={cn(getPriorityColor(note.priority))}>
                Priorytet: {note.priority}
              </Badge>
            )}
            {note.tags &&
              note.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
          </div>
        </CardHeader>
        <CardContent className="flex-grow">
          {note.is_config_note && configData && (
            <div className="mb-4 space-y-2 text-sm">
              {/* Daty podróży */}
              <div className="flex items-center gap-1">
                <ArrowRightLeft className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  {configData.arrival_date ? formatDate(configData.arrival_date) : "Brak daty przyjazdu"} -
                  {configData.departure_date ? formatDate(configData.departure_date) : "Brak daty wyjazdu"}
                </span>
              </div>

              {/* Liczba osób */}
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-blue-600 dark:text-blue-400">
                  {configData.num_people || "Brak"}{" "}
                  {configData.num_people === 1
                    ? "osoba"
                    : configData.num_people && configData.num_people < 5
                      ? "osoby"
                      : "osób"}
                </span>
              </div>

              {/* Destination - zawsze wyświetlaj */}
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-blue-600 dark:text-blue-400">
                  {configData.destination || "Brak celu podróży"}
                </span>
              </div>

              {/* Styl podróży */}
              {configData.travel_style && (
                <div className="flex items-center gap-1">
                  <Compass className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-blue-600 dark:text-blue-400">{configData.travel_style}</span>
                </div>
              )}

              {/* Budżet */}
              {configData.budget && (
                <div className="flex items-start gap-1">
                  <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <span className="text-blue-600 dark:text-blue-400">Budżet: {configData.budget}</span>
                </div>
              )}

              {/* Zainteresowania */}
              {configData.interests && configData.interests.length > 0 && (
                <div className="flex items-start gap-1 mt-1">
                  <span className="text-blue-600 dark:text-blue-400 font-medium">Zainteresowania:</span>
                  <div className="flex flex-wrap gap-1">
                    {configData.interests.map((interest) => (
                      <Badge
                        key={interest}
                        variant="secondary"
                        className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                      >
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div
            className="text-muted-foreground prose dark:prose-invert prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: note.content ? truncateContent(note.content) : "Brak treści" }}
          />
        </CardContent>

        <CardFooter className="pt-2 text-xs text-muted-foreground">
          Aktualizacja: {formatDate(note.updated_at)}
        </CardFooter>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Potwierdzenie usunięcia</AlertDialogTitle>
            <AlertDialogDescription>
              Czy na pewno chcesz usunąć tę notatkę? Tej operacji nie można cofnąć.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground"
              disabled={isDeleting}
            >
              {isDeleting ? "Usuwanie..." : "Usuń"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
