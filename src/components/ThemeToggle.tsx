import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    console.log("ThemeToggle mounted, current theme:", theme);
  }, [theme]);

  if (!mounted) return null;

  console.log("ThemeToggle rendering, theme:", theme);

  const handleToggle = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    console.log("ThemeToggle: switching theme from", theme, "to", newTheme);
    setTheme(newTheme);
  };

  return (
    <button
      aria-label="Przełącz motyw"
      onClick={handleToggle}
      className="flex h-9 w-9 items-center justify-center rounded-md border bg-secondary text-secondary-foreground shadow hover:bg-secondary/80"
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
