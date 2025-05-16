import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";
import type { ToasterProps as SonnerToasterProps } from "sonner";

type ToasterProps = SonnerToasterProps;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: (toast) => 
            `data-test-id="toast-${toast.type || "default"}" toast-${toast.type || "default"}`,
          title: (toast) => 
            `data-test-id="toast-title-${toast.type || "default"}"`,
          description: (toast) => 
            `data-test-id="toast-description-${toast.type || "default"}"`,
          loader: (toast) => 
            `data-test-id="toast-loader-${toast.type || "default"}"`,
          closeButton: (toast) => 
            `data-test-id="toast-close-${toast.type || "default"}"`,
        }
      }}
      {...props}
    />
  );
};

export { Toaster };
