import { Controller } from "react-hook-form";
import { useEffect } from "react";
import dayjs from "dayjs";
import "dayjs/locale/pl";

// Importujemy typy z react-hook-form
import type { Control, FieldValues, FieldErrors, UseFormWatch, UseFormSetValue } from "react-hook-form";

// Komponenty UI
import { Input } from "@/components/ui/input"; // Potrzebne dla innych pól
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button"; // Potrzebne dla Trigger i przycisków
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TagInput } from "@/components/ui/tag-input"; // Odkomentowane dla pola interests
import { CalendarIcon } from "lucide-react";

// Interfejs dla danych formularza konfiguracyjnego
interface ConfigFormData extends FieldValues {
  arrival_date?: string;
  departure_date?: string;
  num_days?: number;
  num_people?: number;
  destination?: string;
  accommodation_address?: string;
  travel_style?: string;
  budget?: string;
  interests?: string[];
}

dayjs.locale("pl");

interface ConfigFormProps {
  // Propsy otrzymywane z nadrzędnego formularza
  control: Control<ConfigFormData>; // Control z react-hook-form
  errors?: FieldErrors<ConfigFormData>;
  watch: UseFormWatch<ConfigFormData>; // Funkcja watch z react-hook-form
  setValue: UseFormSetValue<ConfigFormData>; // Funkcja setValue z react-hook-form
  // Czy formularz jest renderowany w modalu?
  isModal?: boolean;
}

export function ConfigForm({ control, errors = {}, watch, setValue, isModal = false }: ConfigFormProps) {
  // Śledzenie wartości dat do obliczeń
  const arrivalDate = watch("arrival_date");
  const departureDate = watch("departure_date");

  // Obliczanie liczby dni
  useEffect(() => {
    if (arrivalDate && departureDate) {
      const startDate = dayjs(arrivalDate);
      const endDate = dayjs(departureDate);

      // Sprawdzamy poprawność dat przed obliczeniem różnicy
      if (!startDate.isValid() || !endDate.isValid() || endDate.isBefore(startDate)) {
        setValue("num_days", undefined); // Resetujemy, jeśli daty są niepoprawne
        return;
      }

      // Obliczamy różnicę dni i dodajemy 1 (uwzględniając dzień przyjazdu i wyjazdu)
      const daysDiff = endDate.diff(startDate, "day") + 1;
      setValue("num_days", daysDiff);
      console.log(`Obliczono liczbę dni: ${daysDiff} (z uwzględnieniem dnia przyjazdu i wyjazdu)`);
    } else {
      setValue("num_days", undefined); // Resetujemy, jeśli brakuje którejś daty
    }
  }, [arrivalDate, departureDate, setValue]);

  return (
    // Zamiast form, zwracamy div
    <div className={`space-y-4 ${isModal ? "p-0" : "p-4 rounded-lg border"}`}>
      {/* Pola dat */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Data przyjazdu */}
        <div className="space-y-2">
          <Label htmlFor="arrival_date">Data przyjazdu</Label>
          {isModal ? (
            <Controller
              name="arrival_date"
              control={control}
              render={({ field }) => (
                <Input
                  id="arrival_date"
                  type="date"
                  value={field.value || ""}
                  onChange={(e) => field.onChange(e.target.value)}
                  className="w-full"
                />
              )}
            />
          ) : (
            <Controller
              name="arrival_date"
              control={control}
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? dayjs(field.value).format("DD MMMM YYYY") : <span>Wybierz datę</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => field.onChange(date ? dayjs(date).format("YYYY-MM-DD") : "")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
          )}
          {errors.arrival_date && <p className="text-sm text-red-500 mt-1">{errors.arrival_date.message}</p>}
        </div>

        {/* Data wyjazdu */}
        <div className="space-y-2">
          <Label htmlFor="departure_date">Data wyjazdu</Label>
          {isModal ? (
            <Controller
              name="departure_date"
              control={control}
              render={({ field }) => (
                <Input
                  id="departure_date"
                  type="date"
                  value={field.value || ""}
                  onChange={(e) => field.onChange(e.target.value)}
                  className="w-full"
                />
              )}
            />
          ) : (
            <Controller
              name="departure_date"
              control={control}
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? dayjs(field.value).format("DD MMMM YYYY") : <span>Wybierz datę</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => field.onChange(date ? dayjs(date).format("YYYY-MM-DD") : "")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
          )}
          {/* Wyświetlamy błąd zarówno dla samego pola, jak i dla błędu porównania dat (jeśli wystąpił) */}
          {(errors.departure_date || errors.root) && (
            <p className="text-sm text-red-500 mt-1">{errors.departure_date?.message || errors.root?.message}</p>
          )}
        </div>
      </div>

      {/* Liczba dni i liczba osób */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Liczba dni (tylko do odczytu) */}
        <div className="space-y-2">
          <Label htmlFor="num_days">Liczba dni</Label>
          <Controller
            name="num_days"
            control={control}
            render={({ field }) => (
              <Input
                id="num_days"
                type="number"
                value={field.value ?? ""} // Używamy ?? '', aby uniknąć błędu uncontrolled/controlled
                disabled // Pole jest tylko do odczytu
                readOnly // Dodatkowy atrybut dla semantyki
              />
            )}
          />
          <p className="text-xs text-muted-foreground">Obliczane automatycznie na podstawie dat.</p>
          {errors.num_days && <p className="text-sm text-red-500 mt-1">{errors.num_days.message}</p>}
        </div>

        {/* Liczba osób */}
        <div className="space-y-2">
          <Label htmlFor="num_people">Liczba osób</Label>
          <Controller
            name="num_people"
            control={control}
            render={({ field }) => (
              <Input
                id="num_people"
                type="number"
                min={1}
                value={field.value ?? 1}
                onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 1)}
              />
            )}
          />
          {errors.num_people && <p className="text-sm text-red-500 mt-1">{errors.num_people.message}</p>}
        </div>
      </div>

      {/* Cel podróży (destination) - pole wymagane */}
      <div className="space-y-2">
        <Label htmlFor="destination" className="font-medium">
          Cel podróży<span className="text-red-500 ml-1">*</span>
        </Label>
        <Controller
          name="destination"
          control={control}
          render={({ field }) => (
            <Input
              id="destination"
              placeholder="Np. Paryż, Włochy, Azja Południowo-Wschodnia"
              value={field.value || ""}
              onChange={(e) => {
                const newValue = e.target.value;
                console.log(`destination onChange: "${newValue}"`);
                field.onChange(newValue);
                // Dodatkowo ustawiamy bezpośrednio wartość dla pewności
                setValue("destination", newValue);
              }}
              aria-required="true"
            />
          )}
        />
        {errors.destination && <p className="text-sm text-red-500 mt-1">{errors.destination.message}</p>}
      </div>

      {/* Adres noclegu (accommodation_address) - pole opcjonalne */}
      <div className="space-y-2">
        <Label htmlFor="accommodation_address">Adres noclegu</Label>
        <Controller
          name="accommodation_address"
          control={control}
          render={({ field }) => (
            <Input
              id="accommodation_address"
              placeholder="Wprowadź adres lub nazwę miejsca noclegu"
              value={field.value || ""}
              onChange={(e) => {
                const newValue = e.target.value;
                console.log(`accommodation_address onChange: "${newValue}"`);
                field.onChange(newValue);
                // Dodatkowo ustawiamy bezpośrednio wartość dla pewności
                setValue("accommodation_address", newValue);
              }}
            />
          )}
        />
        {errors.accommodation_address && (
          <p className="text-sm text-red-500 mt-1">{errors.accommodation_address.message}</p>
        )}
      </div>

      {/* Styl podróży i budżet w jednej linii */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Styl podróży (travel_style) - pole opcjonalne */}
        <div className="space-y-2">
          <Label htmlFor="travel_style">Styl podróży</Label>
          <Controller
            name="travel_style"
            control={control}
            render={({ field }) => (
              <Input
                id="travel_style"
                placeholder="Np. zwiedzanie, relaks, przygoda"
                value={field.value || ""}
                onChange={(e) => {
                  const newValue = e.target.value;
                  console.log(`travel_style onChange: "${newValue}"`);
                  field.onChange(newValue);
                  // Dodatkowo ustawiamy bezpośrednio wartość dla pewności
                  setValue("travel_style", newValue);
                }}
              />
            )}
          />
          {errors.travel_style && <p className="text-sm text-red-500 mt-1">{errors.travel_style.message}</p>}
        </div>

        {/* Budżet (budget) - pole opcjonalne */}
        <div className="space-y-2">
          <Label htmlFor="budget">Budżet dzienny (PLN)</Label>
          <Controller
            name="budget"
            control={control}
            render={({ field }) => (
              <Input
                id="budget"
                placeholder="Kwota na dzień w PLN"
                value={field.value || ""}
                onChange={(e) => {
                  const newValue = e.target.value;
                  console.log(`budget onChange: "${newValue}"`);
                  field.onChange(newValue);
                  // Dodatkowo ustawiamy bezpośrednio wartość dla pewności
                  setValue("budget", newValue);
                }}
              />
            )}
          />
          <p className="text-xs text-muted-foreground">Przeciętna kwota, jaką planujesz wydawać na osobę dziennie</p>
          {errors.budget && <p className="text-sm text-red-500 mt-1">{errors.budget.message}</p>}
        </div>
      </div>

      {/* zainteresowania */}
      <div className="space-y-2">
        <Label htmlFor="interests">Zainteresowania (max 10)</Label>
        <TagInput
          name="interests"
          control={control}
          placeholder="Np. muzea, góry, plaża, historia..."
          maxTags={10}
          maxTagLength={30}
        />
        <p className="text-xs text-muted-foreground">Wpisz zainteresowanie i naciśnij Enter, aby dodać.</p>
      </div>

      {/* Informacja o polach wymaganych */}
      <div className="text-xs">
        <p className="text-muted-foreground">
          <span className="text-red-500">*</span> Pola wymagane
        </p>
      </div>
    </div>
  );
}
