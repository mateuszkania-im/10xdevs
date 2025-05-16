import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/card";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  hideToast: (id: string) => void;
}

// Utworzenie kontekstu z domyślnymi wartościami
const defaultValue: ToastContextType = {
  toasts: [],
  showToast: () => "",
  hideToast: () => {},
};

// Kontekst z bezpiecznymi wartościami domyślnymi
const ToastContext = createContext<ToastContextType>(defaultValue);

export function useToast() {
  const context = useContext(ToastContext);
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  // Sprawdzenie, czy działamy w środowisku przeglądarki
  const [isMounted, setIsMounted] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Oznacz komponent jako zamontowany po renderowaniu po stronie klienta
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "info", duration = 5000) => {
      const id = Date.now().toString();
      const newToast: Toast = { id, message, type, duration };

      setToasts((prevToasts) => [...prevToasts, newToast]);

      if (duration !== Infinity) {
        setTimeout(() => {
          hideToast(id);
        }, duration);
      }

      return id;
    },
    [hideToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast }}>
      {children}
      {isMounted && (
        <div className="fixed bottom-0 right-0 z-50 m-4 flex flex-col-reverse gap-2">
          {toasts.map((toast) => (
            <Toast key={toast.id} toast={toast} onClose={() => hideToast(toast.id)} />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

function Toast({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const typeClasses = {
    success: "border-green-500 bg-green-50 text-green-700",
    error: "border-red-500 bg-red-50 text-red-700",
    warning: "border-yellow-500 bg-yellow-50 text-yellow-700",
    info: "border-blue-500 bg-blue-50 text-blue-700",
  };

  return (
    <Card 
      className={`flex w-80 items-center justify-between border-l-4 p-3 shadow-md ${typeClasses[toast.type]}`}
      data-test-id={`toast-${toast.type}`}
      role="status"
    >
      <p className="mr-2 text-sm" data-test-id={`toast-message-${toast.type}`}>{toast.message}</p>
      <button 
        onClick={onClose} 
        className="rounded-full p-1 hover:bg-gray-200" 
        aria-label="Zamknij"
        data-test-id={`toast-close-${toast.type}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </Card>
  );
}

// Dodanie domyślnego eksportu
export default ToastProvider;
