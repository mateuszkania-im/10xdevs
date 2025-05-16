import {
  MapPin,
  Clock,
  Coffee,
  Camera,
  Bed,
  Utensils,
  Bus,
  Plane,
  Heart,
  Music,
  Ticket,
  ShoppingBag,
  Wine,
  Book,
  Smile,
  Landmark,
  DollarSign,
  Star,
} from "lucide-react";
import type { PlanActivity } from "@/types";
import { cn } from "@/lib/utils";

// Własny interfejs zastępujący LucideIcon
interface IconComponent extends React.FC<React.SVGProps<SVGSVGElement>> {}

interface ActivityItemProps {
  activity: PlanActivity;
}

export function ActivityItem({ activity }: ActivityItemProps) {
  // Rozszerzone mapowanie typów aktywności na ikony
  const getIconAndColor = (): { icon: IconComponent; color: string; bgColor: string } => {
    switch (activity.type?.toLowerCase()) {
      case "attraction":
      case "sightseeing":
        return { icon: Camera, color: "text-teal-600", bgColor: "bg-teal-100" };
      case "food":
      case "restaurant":
      case "dining":
        return { icon: Utensils, color: "text-amber-600", bgColor: "bg-amber-100" };
      case "accommodation":
      case "hotel":
        return { icon: Bed, color: "text-indigo-600", bgColor: "bg-indigo-100" };
      case "transportation":
      case "travel":
      case "transit":
        return { icon: Bus, color: "text-blue-600", bgColor: "bg-blue-100" };
      case "flight":
        return { icon: Plane, color: "text-sky-600", bgColor: "bg-sky-100" };
      case "break":
      case "rest":
        return { icon: Coffee, color: "text-orange-600", bgColor: "bg-orange-100" };
      case "entertainment":
      case "event":
        return { icon: Ticket, color: "text-purple-600", bgColor: "bg-purple-100" };
      case "shopping":
        return { icon: ShoppingBag, color: "text-pink-600", bgColor: "bg-pink-100" };
      case "nightlife":
        return { icon: Wine, color: "text-rose-600", bgColor: "bg-rose-100" };
      case "cultural":
      case "museum":
        return { icon: Landmark, color: "text-emerald-600", bgColor: "bg-emerald-100" };
      case "outdoor":
      case "nature":
        return { icon: Heart, color: "text-green-600", bgColor: "bg-green-100" };
      case "music":
      case "concert":
        return { icon: Music, color: "text-violet-600", bgColor: "bg-violet-100" };
      case "education":
      case "tour":
        return { icon: Book, color: "text-cyan-600", bgColor: "bg-cyan-100" };
      default:
        return { icon: MapPin, color: "text-gray-600", bgColor: "bg-gray-100" };
    }
  };

  const { icon: Icon, color, bgColor } = getIconAndColor();

  // Przykładowe tagi (możesz dostosować na podstawie rzeczywistych danych)
  const renderTags = () => {
    const tags = [];

    // Zawsze dodaj podstawowy tag typu
    if (activity.type) {
      tags.push(activity.type);
    }

    // Dodaj tagi na podstawie innych właściwości aktywności
    if (activity.price_range) {
      tags.push(activity.price_range);
    }

    if (activity.duration) {
      tags.push(activity.duration);
    }

    if (activity.difficulty) {
      tags.push(activity.difficulty);
    }

    if (activity.mood) {
      tags.push(activity.mood);
    }

    if (tags.length === 0) {
      return null;
    }

    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {tags.map((tag, index) => (
          <span key={index} className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
            {tag}
          </span>
        ))}
      </div>
    );
  };

  // Renderowanie ocen, jeśli dostępne
  const renderRating = () => {
    if (!activity.rating) return null;

    return (
      <div className="flex items-center gap-1 text-amber-500">
        <Star className="h-3.5 w-3.5 fill-current" />
        <span className="text-xs font-medium">{activity.rating}</span>
      </div>
    );
  };

  // Renderowanie informacji o cenie, jeśli dostępne
  const renderPrice = () => {
    if (!activity.price && !activity.price_range) return null;

    return (
      <div className="flex items-center gap-1 text-emerald-600">
        <DollarSign className="h-3.5 w-3.5" />
        <span className="text-xs font-medium">{activity.price || activity.price_range}</span>
      </div>
    );
  };

  return (
    <div className="rounded-md border bg-card p-4 shadow-sm transition-all hover:shadow-md relative overflow-hidden">
      {/* Kolorowy pasek po lewej stronie jako akcentowy element designu */}
      <div className={cn("absolute left-0 top-0 w-1 h-full", bgColor)} />

      <div className="mb-3 flex items-center gap-3">
        <div className={cn("rounded-full p-2.5", bgColor, color)}>
          <Icon className="h-5 w-5" />
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">{activity.name}</h4>
            {renderRating()}
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
            {activity.time && (
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>{activity.time}</span>
              </div>
            )}
            {activity.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                <span>{activity.location}</span>
              </div>
            )}
            {renderPrice()}
          </div>
        </div>
      </div>

      {activity.description && (
        <div className="prose prose-sm max-w-none text-sm text-muted-foreground">{activity.description}</div>
      )}

      {renderTags()}

      {/* Dodatkowe informacje, jeśli dostępne */}
      {(activity.notes || activity.tips || activity.website || activity.contact) && (
        <div className="mt-3 pt-3 border-t text-xs space-y-1.5">
          {activity.notes && (
            <div className="flex items-start gap-1.5">
              <Smile className="h-3.5 w-3.5 text-blue-500 mt-0.5" />
              <span className="flex-1">
                <strong>Warto wiedzieć:</strong> {activity.notes}
              </span>
            </div>
          )}
          {activity.tips && (
            <div className="flex items-start gap-1.5">
              <Star className="h-3.5 w-3.5 text-amber-500 mt-0.5" />
              <span className="flex-1">
                <strong>Wskazówka:</strong> {activity.tips}
              </span>
            </div>
          )}
          {activity.website && (
            <div>
              <a
                href={activity.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                Odwiedź stronę
              </a>
            </div>
          )}
          {activity.contact && (
            <div className="text-muted-foreground">
              <strong>Kontakt:</strong> {activity.contact}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
