import { toast as sonnerToast, type ToastT, type ToastOptions } from "sonner";

// Re-export sonner toast as use-toast for compatibility
export function useToast() {
  return {
    toast: sonnerToast,
    dismiss: sonnerToast.dismiss,
    error: sonnerToast.error,
    success: sonnerToast.success,
    warning: sonnerToast.warning,
    info: sonnerToast.info,
  };
}

export { type ToastT as Toast, type ToastOptions };
