import * as React from "react";
import { cn } from "@/lib/utils";

// Tabs Context
interface TabsContextType {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const TabsContext = React.createContext<TabsContextType | undefined>(undefined);

function useTabsContext() {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs compound components must be used within Tabs component");
  }
  return context;
}

// Main Tabs component
interface TabsProps {
  children: React.ReactNode;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

function Tabs({ children, defaultValue, value, onValueChange, className }: TabsProps) {
  const [activeTab, setActiveTabState] = React.useState(defaultValue || "");

  const activeValue = value !== undefined ? value : activeTab;
  const setActiveTab = React.useCallback(
    (id: string) => {
      if (value === undefined) {
        setActiveTabState(id);
      }
      onValueChange?.(id);
    },
    [onValueChange, value]
  );

  return (
    <TabsContext.Provider value={{ activeTab: activeValue, setActiveTab }}>
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

// Tabs List
interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

function TabsList({ children, className }: TabsListProps) {
  return <div className={cn("flex border-b", className)}>{children}</div>;
}

// Tab Trigger
interface TabsTriggerProps {
  children: React.ReactNode;
  value: string;
  className?: string;
  disabled?: boolean;
}

function TabsTrigger({ children, value, className, disabled = false }: TabsTriggerProps) {
  const { activeTab, setActiveTab } = useTabsContext();
  const isActive = activeTab === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      disabled={disabled}
      onClick={() => setActiveTab(value)}
      className={cn(
        "flex-1 px-3 py-2 text-center text-sm font-medium transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isActive ? "border-b-2 border-primary text-foreground" : "text-muted-foreground hover:text-foreground",
        disabled && "pointer-events-none opacity-50",
        className
      )}
    >
      {children}
    </button>
  );
}

// Tab Content
interface TabsContentProps {
  children: React.ReactNode;
  value: string;
  className?: string;
}

function TabsContent({ children, value, className }: TabsContentProps) {
  const { activeTab } = useTabsContext();
  const isActive = activeTab === value;

  if (!isActive) return null;

  return (
    <div role="tabpanel" className={cn("mt-4", className)}>
      {children}
    </div>
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
