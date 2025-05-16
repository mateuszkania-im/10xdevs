import {
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Clock,
  Copy,
  Edit,
  Eye,
  File,
  FileText,
  Folder,
  FolderPlus,
  Home,
  LayoutGrid,
  List,
  LogOut,
  Map,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Settings,
  Trash,
  User,
} from "lucide-react";
import type { LucideProps } from "lucide-react";

// Typ dla komponentów ikon
type IconComponent = React.ForwardRefExoticComponent<LucideProps & React.RefAttributes<SVGSVGElement>>;

// Reeksport podstawowych ikon
export {
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Clock,
  Copy,
  Edit,
  Eye,
  File,
  FileText,
  Folder,
  FolderPlus,
  Home,
  LayoutGrid,
  List,
  LogOut,
  Map,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Settings,
  Trash,
  User,
};

// Własna ikona plus
export const PlusIcon = (props: React.ComponentProps<IconComponent>) => <Plus {...props} />;

// Niestandardowa ikona notatki
export const NoteIcon = (props: React.ComponentProps<IconComponent>) => <FileText {...props} />;

// Ikona projektu
export const ProjectIcon = (props: React.ComponentProps<IconComponent>) => <Folder {...props} />;

// Ikona dodawania projektu
export const AddProjectIcon = (props: React.ComponentProps<IconComponent>) => <FolderPlus {...props} />;
