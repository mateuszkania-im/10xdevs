import { useEffect, useState, useCallback } from "react";
import { useController } from "react-hook-form";
import type { Control } from "react-hook-form";
import type { NoteEditorVM } from "@/types";
import { cn } from "@/lib/utils";

// Lexical Imports
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html"; // Dodano $generateNodesFromDOM
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListItemNode, ListNode } from "@lexical/list";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import type { EditorState, LexicalEditor } from "lexical";
import {
  $getRoot,
  $insertNodes,
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
} from "lexical"; // Dodano $getRoot, $insertNodes, $getSelection, $isRangeSelection, FORMAT_TEXT_COMMAND, SELECTION_CHANGE_COMMAND

// Podstawowy theme (można rozbudować lub przenieść do osobnego pliku)
const editorTheme = {
  ltr: "ltr",
  rtl: "rtl",
  placeholder: "editor-placeholder",
  paragraph: "editor-paragraph", // Można usunąć jeśli używamy `prose`
  quote: "editor-quote",
  heading: {
    h1: "editor-heading-h1", // Można usunąć jeśli używamy `prose`
    h2: "editor-heading-h2", // Można usunąć jeśli używamy `prose`
    h3: "editor-heading-h3", // Można usunąć jeśli używamy `prose`
    h4: "editor-heading-h4", // Można usunąć jeśli używamy `prose`
    h5: "editor-heading-h5", // Można usunąć jeśli używamy `prose`
  },
  list: {
    nested: {
      listitem: "editor-nested-listitem",
    },
    ol: "editor-list-ol", // Można usunąć jeśli używamy `prose`
    ul: "editor-list-ul", // Można usunąć jeśli używamy `prose`
    listitem: "editor-listitem", // Można usunąć jeśli używamy `prose`
  },
  link: "editor-link", // Można usunąć jeśli używamy `prose`
  text: {
    bold: "font-bold", // Używamy klas Tailwind
    italic: "italic", // Używamy klas Tailwind
    underline: "underline", // Używamy klas Tailwind
    strikethrough: "line-through", // Używamy klas Tailwind
    underlineStrikethrough: "underline line-through", // Używamy klas Tailwind
    code: "editor-text-code", // Wymaga definicji stylu
  },
  code: "editor-code", // Wymaga definicji stylu
  // Definicje dla codeHighlight można pominąć na razie lub zmapować na style Prism/Tailwind
};

// Komponent do ładowania początkowej zawartości HTML
function InitialValuePlugin({ initialHtml }: { initialHtml: string | null | undefined }) {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    // Usunięto warunek `editor.getEditorState().isEmpty()`
    // Teraz aktualizacja nastąpi zawsze, gdy `initialHtml` istnieje
    if (initialHtml) {
      try {
        editor.update(() => {
          const parser = new DOMParser();
          const dom = parser.parseFromString(initialHtml, "text/html");
          const nodes = $generateNodesFromDOM(editor, dom);
          $getRoot().select();
          // Czyścimy edytor przed wstawieniem nowych węzłów, aby uniknąć duplikacji
          $getRoot().clear();
          $insertNodes(nodes);
        });
      } catch (error) {
        console.error("Błąd podczas ładowania początkowej zawartości HTML:", error);
        // Opcjonalnie: Wyczyść edytor lub ustaw domyślną wartość w razie błędu parsowania
        editor.update(() => {
          $getRoot().clear();
        });
      }
    }
    // Uruchom tylko raz przy inicjalizacji lub zmianie initialHtml
    // Dodajemy `initialHtml` do zależności, aby przeładować, gdy wartość z RHF się zmieni
  }, [editor, initialHtml]);
  return null;
}

// Obsługa błędów Lexical
function onError(error: Error) {
  console.error("Lexical Error:", error);
  // Można dodać logikę raportowania błędów lub próbę odzyskania stanu
  // np. editor.setEditorState(editor.parseEditorState(fallbackState));
}

// Dodano ikony dla toolbara
import { Bold, Italic, Underline } from "lucide-react";
import { Button } from "@/components/ui/button"; // Import Button

// Komponent ToolbarPlugin
function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      // Sprawdź formatowanie dla zaznaczenia
      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
      setIsUnderline(selection.hasFormat("underline"));
    }
  }, [editor]);

  useEffect(() => {
    // Nasłuchuj na zmiany selekcji i aktualizuj stan toolbara
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateToolbar();
        return false;
      },
      1 // Niski priorytet
    );
  }, [editor, updateToolbar]);

  useEffect(() => {
    // Nasłuchuj na zmiany w edytorze (np. po komendach formatowania) i aktualizuj toolbar
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateToolbar();
      });
    });
  }, [editor, updateToolbar]);

  return (
    <div className="flex gap-1 border-b border-input p-1 mb-1">
      {" "}
      {/* Stylizacja paska */}
      <Button
        type="button"
        variant={isBold ? "secondary" : "ghost"}
        size="sm"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
        aria-label="Format Bold"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant={isItalic ? "secondary" : "ghost"}
        size="sm"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
        aria-label="Format Italic"
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant={isUnderline ? "secondary" : "ghost"}
        size="sm"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}
        aria-label="Format Underline"
      >
        <Underline className="h-4 w-4" />
      </Button>
    </div>
  );
}

// Nowy komponent RichTextEditor oparty na Lexical
export function RichTextEditor({
  name,
  control,
  placeholder = "Wpisz treść notatki...",
  minHeight = "200px",
}: {
  name: "content";
  control: Control<NoteEditorVM>;
  placeholder?: string;
  minHeight?: string;
}) {
  const {
    field: { value, onChange },
    fieldState: { error },
  } = useController({
    name,
    control,
  });

  const initialConfig = {
    namespace: "MyRichTextEditor",
    theme: editorTheme,
    onError,
    nodes: [
      // Wymień wszystkie używane typy węzłów
      HeadingNode,
      ListNode,
      ListItemNode,
      QuoteNode,
      CodeNode,
      CodeHighlightNode,
      // TableNode, TableCellNode, TableRowNode, // Można pominąć jeśli nie używamy tabel
      AutoLinkNode,
      LinkNode,
    ],
    // Nie ustawiamy editorState bezpośrednio z HTML, użyjemy pluginu InitialValuePlugin
    // editorState: value ? initialEditorState : undefined // Można by próbować tak, ale plugin jest bezpieczniejszy
  };

  // Funkcja wywoływana przy każdej zmianie stanu edytora
  const handleOnChange = (editorState: EditorState, editor: LexicalEditor) => {
    editorState.read(() => {
      // Konwertuj stan Lexical na HTML
      const htmlString = $generateHtmlFromNodes(editor, null);

      // Proste sprawdzenie czy edytor jest pusty (tylko paragraf z <br>)
      const isEmpty = htmlString === "<p><br></p>";

      // Przekaż HTML do React Hook Form, pusty string jeśli edytor jest pusty
      onChange(isEmpty ? "" : htmlString);
    });
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="border border-input rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1">
        <ToolbarPlugin />
        <div className="relative">
          <RichTextPlugin
            contentEditable={
              // Stylizujemy bezpośrednio ContentEditable zamiast wrapującego div
              <ContentEditable
                className={cn(
                  "w-full p-3 min-h-[var(--min-height)] focus:outline-none overflow-auto bg-background text-foreground prose dark:prose-invert max-w-none prose-sm", // Używamy prose-sm dla mniejszej czcionki
                  // Usunięto border i ring stąd, przeniesiono na wrapper LexicalComposer
                  error ? "border-red-500" : "" // Dodajemy klasę błędu jeśli trzeba
                )}
                style={{ "--min-height": minHeight } as React.CSSProperties} // Przekazanie minHeight przez CSS variable
              />
            }
            placeholder={
              <div className="editor-placeholder absolute top-3 left-3 text-muted-foreground pointer-events-none select-none">
                {" "}
                {/* Dodano select-none */}
                {placeholder}
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <OnChangePlugin onChange={handleOnChange} />
          {/* Plugin do ustawiania wartości początkowej z RHF */}
          <InitialValuePlugin initialHtml={value} />
        </div>
      </div>
      {/* Komunikat błędu poza głównym wrapperem */}
      {error && <p className="text-sm text-destructive mt-1">{error.message}</p>}
    </LexicalComposer>
  );
}

// TODO: Dodać ToolbarPlugin i zaimplementować przyciski formatowania
// TODO: Dodać style CSS dla klas z `editorTheme` które nie są pokryte przez Tailwind/Prose (np. code, codeHighlight)
