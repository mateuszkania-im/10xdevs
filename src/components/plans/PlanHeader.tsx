import { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MoreVertical, AlertTriangle, Trash, Calendar, MapPin, Users, CreditCard, Clock, Edit3, Map, Folder, Info } from "lucide-react";
import type { TravelPlanDetailDTO } from "@/types";
import { formatDate } from "@/lib/utils";
import GeneratePlanModal from "@/components/GeneratePlanModal";

interface PlanHeaderProps {
  plan: TravelPlanDetailDTO;
  onTitleUpdate: (title: string) => void;
  onDelete: () => void;
  destinationInfo?: {
    destination?: string;
    arrival_date?: string;
    departure_date?: string;
    num_people?: number;
    budget?: string;
    travel_style?: string;
  };
  projectId?: string;
}

export function PlanHeader({ plan, onTitleUpdate, onDelete, destinationInfo, projectId }: PlanHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(plan.version_name);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleEditStart = () => {
    setIsEditing(true);
  };

  const handleEditSave = () => {
    if (title.trim() !== "" && title !== plan.version_name) {
      onTitleUpdate(title);
    } else {
      setTitle(plan.version_name);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleEditSave();
    } else if (e.key === "Escape") {
      setTitle(plan.version_name);
      setIsEditing(false);
    }
  };

  const formattedArrivalDate = destinationInfo?.arrival_date
    ? formatDate(destinationInfo.arrival_date)
    : "Nie ustawiono";
  const formattedDepartureDate = destinationInfo?.departure_date
    ? formatDate(destinationInfo.departure_date)
    : "Nie ustawiono";

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleGenerateNewVersion = () => {
    if (projectId) {
      setIsGenerateModalOpen(true);
    }
  };

  // Formatowanie dat
  const formatDateRange = () => {
    if (!destinationInfo?.arrival_date || !destinationInfo?.departure_date) {
      return null;
    }

    try {
      const arrivalDate = new Date(destinationInfo.arrival_date);
      const departureDate = new Date(destinationInfo.departure_date);

      if (isNaN(arrivalDate.getTime()) || isNaN(departureDate.getTime())) {
        return null;
      }

      const formatOptions: Intl.DateTimeFormatOptions = {
        day: "numeric",
        month: "long",
        year: "numeric",
      };

      return {
        arrival: arrivalDate.toLocaleDateString("pl-PL", formatOptions),
        departure: departureDate.toLocaleDateString("pl-PL", formatOptions),
        days: Math.round((departureDate.getTime() - arrivalDate.getTime()) / (1000 * 60 * 60 * 24)) + 1,
      };
    } catch (e) {
      return null;
    }
  };

  const dateInfo = formatDateRange();

  // Określenie wersji planu (czy jest to podstawowy plan, czy alternatywny)
  const isPrimaryPlan =
    plan.version_name.toLowerCase().includes("podstawow") || plan.version_name.toLowerCase().includes("główny");

  return (
    <header className="space-y-4">
      {plan.is_outdated && projectId && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-center text-amber-800">
          <AlertTriangle className="h-5 w-5 mr-2" />
          <div>
            <p className="font-medium">Plan jest nieaktualny</p>
            <p className="text-sm">Notatka konfiguracyjna została zmieniona. Rozważ wygenerowanie nowego planu.</p>
          </div>
          <Button variant="outline" size="sm" className="ml-auto" onClick={handleGenerateNewVersion}>
            Generuj nową wersję
          </Button>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="space-y-1 flex-1">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleEditSave}
              onKeyDown={handleKeyDown}
              className="text-3xl font-bold w-full p-1 border-b-2 border-primary focus:outline-none"
              maxLength={50}
            />
          ) : (
            <h1 className="text-3xl font-bold truncate" onClick={handleEditStart}>
              {plan.version_name}
            </h1>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleEditStart}>Zmień nazwę</DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              Usuń plan
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {destinationInfo && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6 bg-muted/50 p-4 rounded-lg">
          {destinationInfo.destination && (
            <div className="flex items-center">
              <Map className="h-5 w-5 mr-2 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Cel podróży</div>
                <div className="text-sm">{destinationInfo.destination}</div>
              </div>
            </div>
          )}

          {(destinationInfo.arrival_date || destinationInfo.departure_date) && (
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Termin</div>
                <div className="text-sm">
                  {formattedArrivalDate} - {formattedDepartureDate}
                </div>
              </div>
            </div>
          )}

          {destinationInfo.num_people && (
            <div className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Liczba osób</div>
                <div className="text-sm">{destinationInfo.num_people}</div>
              </div>
            </div>
          )}

          {destinationInfo.travel_style && (
            <div className="flex items-center">
              <Folder className="h-5 w-5 mr-2 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Styl podróży</div>
                <div className="text-sm">{destinationInfo.travel_style}</div>
              </div>
            </div>
          )}

          {destinationInfo.budget && (
            <div className="flex items-center">
              <Info className="h-5 w-5 mr-2 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Budżet</div>
                <div className="text-sm">{destinationInfo.budget}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {projectId && (
        <GeneratePlanModal
          projectId={projectId}
          isOpen={isGenerateModalOpen}
          onClose={() => setIsGenerateModalOpen(false)}
          hasConfigNote={true}
        />
      )}

      {/* Informacje o podróży */}
      {(destinationInfo || dateInfo) && (
        <div className="bg-muted/40 rounded-lg p-4 flex flex-col sm:flex-row flex-wrap gap-5 text-sm">
          {destinationInfo?.destination && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="font-medium">Cel podróży:</span> {destinationInfo.destination}
            </div>
          )}

          {dateInfo && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="font-medium">Termin:</span> {dateInfo.arrival} - {dateInfo.departure} ({dateInfo.days}{" "}
              {dateInfo.days === 1 ? "dzień" : "dni"})
            </div>
          )}

          {destinationInfo?.num_people && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="font-medium">Liczba osób:</span> {destinationInfo.num_people}
            </div>
          )}

          {destinationInfo?.budget && (
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              <span className="font-medium">Budżet:</span> {destinationInfo.budget}
            </div>
          )}

          {destinationInfo?.travel_style && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="font-medium">Styl podróży:</span> {destinationInfo.travel_style}
            </div>
          )}
        </div>
      )}

      {/* Szybkie podsumowanie planu */}
      {plan.content?.days && (
        <div className="text-sm text-muted-foreground">
          Plan obejmuje {plan.content.days.length} {plan.content.days.length === 1 ? "dzień" : "dni"} i łącznie{" "}
          {calculateTotalActivities(plan)} {getActivitiesText(calculateTotalActivities(plan))}.
        </div>
      )}
    </header>
  );
}

// Pomocnicze funkcje
function calculateTotalActivities(plan: TravelPlanDetailDTO): number {
  return plan.content?.days?.reduce((total, day) => total + day.activities.length, 0) || 0;
}

function getActivitiesText(count: number): string {
  if (count === 1) return "aktywność";
  if (count >= 2 && count <= 4) return "aktywności";
  return "aktywności";
}
