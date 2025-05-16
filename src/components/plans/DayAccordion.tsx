import * as React from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ActivityItem } from "./ActivityItem";
import type { PlanDay } from "@/types";
import { Calendar, MapPin, Sun, Cloud, CloudRain, CloudSnow, Droplet, Clock } from "lucide-react";

interface DayAccordionProps {
  days: PlanDay[];
}

export function DayAccordion({ days }: DayAccordionProps) {
  // Domyślnie otwórz pierwszy dzień
  const defaultValue = days.length > 0 ? `day-${0}` : undefined;

  // Pomocnicze funkcje do uzyskania informacji o dniu
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;

      // Zwracamy date w formacie: Poniedziałek, 10 maja 2023
      return date.toLocaleDateString("pl-PL", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Funkcja do uzyskania ikony pogody (domyślnie słońce, jeśli nie ma informacji)
  const getWeatherIcon = (day: PlanDay) => {
    if (!day.weather) return Sun;

    const weather = day.weather.toLowerCase();
    if (weather.includes("deszcz")) return CloudRain;
    if (weather.includes("śnieg")) return CloudSnow;
    if (weather.includes("pochmurn")) return Cloud;
    if (weather.includes("zachmurzen")) return Cloud;
    if (weather.includes("wilgotn")) return Droplet;
    return Sun;
  };

  // Obliczenie łącznego czasu aktywności dla dnia
  const calculateDayDuration = (day: PlanDay) => {
    // Jeśli aktywności mają określony czas trwania, można go zsumować
    const totalDuration = day.activities.reduce((total, activity) => {
      if (!activity.duration) return total;

      // Próba wyodrębnienia liczby godzin/minut z formatu "2h 30min" lub podobnego
      const hourMatch = activity.duration.match(/(\d+)\s*h/);
      const minuteMatch = activity.duration.match(/(\d+)\s*min/);

      const hours = hourMatch ? parseInt(hourMatch[1], 10) : 0;
      const minutes = minuteMatch ? parseInt(minuteMatch[1], 10) : 0;

      return total + hours * 60 + minutes;
    }, 0);

    if (totalDuration === 0) return null;

    // Format wyniku jako godziny i minuty
    const hours = Math.floor(totalDuration / 60);
    const minutes = totalDuration % 60;

    if (hours === 0) return `${minutes} min`;
    if (minutes === 0) return `${hours} h`;
    return `${hours} h ${minutes} min`;
  };

  // Znajdź najważniejsze miejsca do odwiedzenia danego dnia
  const getKeyLocations = (day: PlanDay) => {
    // Zbierz unikalne lokacje z aktywności
    const locations = day.activities
      .filter((activity) => activity.location)
      .map((activity) => activity.location as string);

    // Usuń duplikaty
    const uniqueLocations = [...new Set(locations)];

    // Zwróć maksymalnie 3 lokacje
    return uniqueLocations.slice(0, 3);
  };

  return (
    <Accordion type="single" collapsible defaultValue={defaultValue} className="w-full">
      {days.map((day, index) => {
        const WeatherIcon = getWeatherIcon(day);
        const formattedDate = formatDate(day.date);
        const dayDuration = calculateDayDuration(day);
        const keyLocations = getKeyLocations(day);

        return (
          <AccordionItem
            key={index}
            value={`day-${index}`}
            className="border rounded-lg mb-6 px-4 py-1 shadow-sm hover:shadow transition-all"
          >
            <AccordionTrigger className="text-left py-5 px-2 hover:no-underline">
              <div className="flex w-full items-center justify-between">
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-primary/15 text-primary h-12 w-12 flex items-center justify-center font-bold text-xl">
                    {day.day_number}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{formattedDate}</h3>
                      {day.weather && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <WeatherIcon className="h-4 w-4" />
                          <span>{day.weather}</span>
                        </div>
                      )}
                    </div>

                    <div className="text-sm text-muted-foreground mt-1 flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{day.activities.length} aktywności</span>
                      </div>

                      {dayDuration && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span>Łącznie: {dayDuration}</span>
                        </div>
                      )}
                    </div>

                    {keyLocations.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-1.5 hidden sm:block">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{keyLocations.join(" • ")}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {day.summary && (
                  <div className="hidden md:block max-w-xs text-sm text-muted-foreground text-right pr-6">
                    {day.summary}
                  </div>
                )}
              </div>
            </AccordionTrigger>

            <AccordionContent className="py-6">
              {day.summary && (
                <div className="mb-6 pl-16 pr-4 text-muted-foreground md:hidden">
                  <p>{day.summary}</p>
                </div>
              )}

              <div className="space-y-5 pl-16">
                {day.activities.map((activity, activityIndex) => (
                  <ActivityItem key={activityIndex} activity={activity} />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
