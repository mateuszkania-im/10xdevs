import { cn } from "@/lib/utils";
import React, { createContext, useContext, useEffect, useRef, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { usePortal } from "@/components/PortalRoot";

interface ModalContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  props: Record<string, any>;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

interface ModalProviderProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  [key: string]: any;
}

export const ModalProvider = ({ children, open: controlledOpen, onOpenChange, ...props }: ModalProviderProps) => {
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = useMemo(() => controlledOpen !== undefined, [controlledOpen]);
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = useMemo(
    () => (newOpen: boolean) => {
      if (!isControlled) {
        setInternalOpen(newOpen);
      }
      if (onOpenChange) {
        onOpenChange(newOpen);
      }
    },
    [isControlled, onOpenChange]
  );

  console.log("ModalProvider: Renderowanie z open=", open, "isControlled=", isControlled);

  return <ModalContext.Provider value={{ open, setOpen, props }}>{children}</ModalContext.Provider>;
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};

interface ModalProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  [key: string]: any;
}

export function Modal({ children, open, onOpenChange, ...props }: ModalProps) {
  return (
    <ModalProvider open={open} onOpenChange={onOpenChange} {...props}>
      {children}
    </ModalProvider>
  );
}

export const ModalTrigger = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  const { setOpen } = useModal();
  return (
    <button
      className={cn("px-4 py-2 rounded-md text-black dark:text-white text-center relative overflow-hidden", className)}
      onClick={() => setOpen(true)}
    >
      {children}
    </button>
  );
};

export const ModalBody = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  const { open, setOpen, props } = useModal();
  const { portalRoot } = usePortal();
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [open]);

  useOutsideClick(modalRef, () => setOpen(false));

  // Nie renderujemy jeśli modal jest zamknięty
  if (!open) return null;

  // Renderujemy bezpośrednio jeśli portal nie jest dostępny
  if (!portalRoot) {
    console.warn("ModalBody: Portal root not available, rendering directly");
    return renderModalContent();
  }

  // Używamy createPortal jeśli portal jest dostępny
  return createPortal(renderModalContent(), portalRoot);

  // Pomocnicza funkcja do renderowania zawartości modalu
  function renderModalContent() {
    return (
      <div
        className="fixed inset-0 h-full w-full flex items-start justify-center z-50 pointer-events-auto overflow-y-auto pt-4 pb-20"
        style={{
          perspective: "800px",
          transformStyle: "preserve-3d",
        }}
        data-test-id="modal-container"
      >
        <Overlay />

        <div
          ref={modalRef}
          {...props}
          className={cn(
            "w-[90%] max-h-[90vh] md:max-w-xl bg-white dark:bg-neutral-950 border border-transparent dark:border-neutral-800 md:rounded-2xl relative z-50 flex flex-col flex-1 overflow-y-auto pointer-events-auto my-4",
            className
          )}
          style={{
            animation: "modal-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
          }}
          data-test-id="modal-body"
        >
          <CloseIcon />
          {children}
        </div>

        <style>{`
          @keyframes modal-in {
            0% {
              opacity: 0;
              transform: scale(0.5) rotateX(40deg) translateY(40px);
            }
            100% {
              opacity: 1;
              transform: scale(1) rotateX(0deg) translateY(0);
            }
          }
          @keyframes overlay-in {
            0% {
              opacity: 0;
              backdrop-filter: blur(0px);
            }
            100% {
              opacity: 1;
              backdrop-filter: blur(10px);
            }
          }
        `}</style>
      </div>
    );
  }
};

export const ModalContent = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return <div className={cn("flex flex-col flex-1 p-8 md:p-10", className)}>{children}</div>;
};

export const ModalFooter = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return <div className={cn("flex justify-end p-4 bg-gray-100 dark:bg-neutral-900", className)}>{children}</div>;
};

const Overlay = ({ className }: { className?: string }) => {
  return (
    <div
      style={{
        animation: "overlay-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      }}
      className={`fixed inset-0 h-full w-full bg-black bg-opacity-50 backdrop-blur-[10px] z-40 pointer-events-auto ${className}`}
    ></div>
  );
};

const CloseIcon = () => {
  const { setOpen } = useModal();
  return (
    <button
      onClick={() => {
        console.log("CloseIcon: Zamykam modal");
        setOpen(false);
      }}
      className="absolute top-4 right-4 group z-50"
      aria-label="Zamknij"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-black dark:text-white h-4 w-4 group-hover:scale-125 group-hover:rotate-3 transition duration-200"
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M18 6l-12 12" />
        <path d="M6 6l12 12" />
      </svg>
    </button>
  );
};

export const useOutsideClick = (ref: React.RefObject<HTMLDivElement>, callback: Function) => {
  useEffect(() => {
    const listener = (event: any) => {
      // Sprawdzamy, czy kliknięcie jest wewnątrz ref.current
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }

      // Sprawdzamy, czy kliknięcie jest wewnątrz selecta lub innych elementów dropdown
      const isSelectOpen = !!document.querySelector('[data-state="open"][role="combobox"]');
      const isSelectContentOpen = !!document.querySelector('[data-state="open"][role="listbox"]');
      const isComboboxOpen = !!document.querySelector("[data-radix-combobox-content]");
      const isDropdownOpen = !!document.querySelector("[data-radix-dropdown-content]");
      const isPopoverOpen = !!document.querySelector("[data-radix-popover-content]");

      // Sprawdź czy kliknięcie było w selekcie shadcn/ui
      const clickedOnSelect =
        event.target.closest('[role="combobox"]') ||
        event.target.closest('[role="listbox"]') ||
        event.target.closest(".select-content") ||
        event.target.closest("[cmdk-input]");

      // Jeśli jakikolwiek dropdown jest otwarty lub kliknięto w select, nie zamykamy modalu
      if (isSelectOpen || isSelectContentOpen || isComboboxOpen || isDropdownOpen || isPopoverOpen || clickedOnSelect) {
        console.log("Wykryto otwarty dropdown, nie zamykam modalu");
        return;
      }

      callback(event);
    };

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, callback]);
};
