import { useState, useRef } from "react";
import type { KeyboardEvent, ChangeEvent, FocusEvent } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useController } from "react-hook-form";
import type { Control } from "react-hook-form";

interface TagInputProps {
  placeholder?: string;
  tags: string[];
  setTags: (tags: string[]) => void;
  maxTags?: number;
  maxTagLength?: number;
}

export function TagInputBase({
  placeholder = "Dodaj tag...",
  tags,
  setTags,
  maxTags = 20,
  maxTagLength = 30,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Funkcja dodająca tag
  const addTag = (tag: string) => {
    // Ignoruj puste tagi
    if (!tag.trim()) return;

    // Przytnij do maksymalnej długości
    const trimmedTag = tag.trim().substring(0, maxTagLength);

    // Nie dodawaj duplikatów
    if (tags.includes(trimmedTag)) {
      setInputValue("");
      return;
    }

    // Nie przekraczaj maksymalnej liczby tagów
    if (tags.length >= maxTags) return;

    setTags([...tags, trimmedTag]);
    setInputValue("");
  };

  // Funkcja usuwająca tag
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  // Obsługa klawisza Enter i przecinka do dodawania tagów
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && inputValue.trim()) {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      // Usuń ostatni tag po naciśnięciu Backspace w pustym inpucie
      removeTag(tags[tags.length - 1]);
    }
  };

  // Obsługa zmiany wartości input
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    // Nie pozwól na bezpośrednie wprowadzenie przecinka
    setInputValue(e.target.value.replace(/,/g, ""));
  };

  // Obsługa kliknięcia w container - focusuje input
  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  // Obsługa utraty focusu - dodaje tag jeśli jest wartość
  const handleInputBlur = (e: FocusEvent<HTMLInputElement>) => {
    setIsInputFocused(false);
    if (inputValue.trim()) {
      addTag(inputValue);
    }
  };

  // Obsługa focusu na inpucie
  const handleInputFocus = () => {
    setIsInputFocused(true);
  };

  return (
    <div
      className={`
        flex flex-wrap min-h-[38px] gap-1.5 p-1 border rounded-md bg-background
        ${isInputFocused ? "ring-2 ring-ring ring-offset-background" : ""}
        ${tags.length >= maxTags ? "cursor-not-allowed" : "cursor-text"}
      `}
      onClick={handleContainerClick}
    >
      {tags.map((tag, index) => (
        <Badge key={`${tag}-${index}`} variant="secondary" className="gap-1 py-1 px-2">
          {tag}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeTag(tag);
            }}
            className="ml-1 rounded-full hover:bg-muted p-0.5"
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Usuń tag</span>
          </button>
        </Badge>
      ))}

      {tags.length < maxTags && (
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleInputBlur}
          onFocus={handleInputFocus}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] border-0 p-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      )}
    </div>
  );
}

// Hook Form adapter
interface HookFormTagInputProps {
  name: string;
  control?: Control<any>;
  placeholder?: string;
  maxTags?: number;
  maxTagLength?: number;
}

export function TagInput({
  name,
  control,
  placeholder = "Dodaj tag...",
  maxTags = 20,
  maxTagLength = 30,
}: HookFormTagInputProps) {
  // Obsługa przypadku gdy control nie jest dostępny
  if (!control) {
    const [tags, setTags] = useState<string[]>([]);
    return (
      <TagInputBase
        placeholder={placeholder}
        tags={tags}
        setTags={setTags}
        maxTags={maxTags}
        maxTagLength={maxTagLength}
      />
    );
  }

  // Standardowa obsługa z react-hook-form
  const {
    field: { value = [], onChange },
    fieldState: { error },
  } = useController({
    name,
    control,
  });

  return (
    <div>
      <TagInputBase
        placeholder={placeholder}
        tags={value}
        setTags={onChange}
        maxTags={maxTags}
        maxTagLength={maxTagLength}
      />
      {error && <p className="text-sm text-red-500 mt-1">{error.message}</p>}
    </div>
  );
}
