import { useCallback } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import type { ProjectFilterState } from "@/lib/hooks/useProjectFilters";

interface ProjectFiltersProps {
  value: ProjectFilterState;
  onChange: (value: ProjectFilterState) => void;
}

export default function ProjectFilters({ value, onChange }: ProjectFiltersProps) {
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ ...value, search: e.target.value });
    },
    [value, onChange]
  );

  const handleSortByChange = useCallback(
    (value: string) => {
      onChange({ ...value, sortBy: value as ProjectFilterState["sortBy"] });
    },
    [value, onChange]
  );

  const handleOrderChange = useCallback(
    (value: string) => {
      onChange({ ...value, order: value as ProjectFilterState["order"] });
    },
    [value, onChange]
  );

  const handleLimitChange = useCallback(
    (value: string) => {
      onChange({ ...value, limit: parseInt(value, 10) });
    },
    [value, onChange]
  );

  // Generowanie stron do wyświetlenia (max 5 stron + pierwsza i ostatnia)
  const pagesToShow = useCallback(() => {
    if (value.totalPages <= 7) {
      return Array.from({ length: value.totalPages }, (_, i) => i + 1);
    }

    const pages = [1];
    const startPage = Math.max(2, value.page - 2);
    const endPage = Math.min(value.totalPages - 1, value.page + 2);

    if (startPage > 2) {
      pages.push(-1); // -1 oznacza ellipsis
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < value.totalPages - 1) {
      pages.push(-1); // -1 oznacza ellipsis
    }

    pages.push(value.totalPages);

    return pages;
  }, [value.totalPages, value.page]);

  return (
    <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:space-y-0">
      <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Sortuj wg:</span>
          <Select value={value.sortBy} onValueChange={handleSortByChange}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Nazwa</SelectItem>
              <SelectItem value="created_at">Data utworzenia</SelectItem>
              <SelectItem value="updated_at">Data aktualizacji</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Kolejność:</span>
          <Select value={value.order} onValueChange={handleOrderChange}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Rosnąco</SelectItem>
              <SelectItem value="desc">Malejąco</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Limit:</span>
          <Select value={value.limit.toString()} onValueChange={handleLimitChange}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="30">30</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {value.totalPages > 1 && (
        <Pagination className="justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (value.page > 1) onChange({ ...value, page: value.page - 1 });
                }}
                className={value.page <= 1 ? "opacity-50 pointer-events-none" : ""}
              />
            </PaginationItem>

            {pagesToShow().map((pageNum, index) =>
              pageNum === -1 ? (
                <PaginationItem key={`ellipsis-${index}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      onChange({ ...value, page: pageNum });
                    }}
                    isActive={pageNum === value.page}
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              )
            )}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (value.page < value.totalPages) onChange({ ...value, page: value.page + 1 });
                }}
                className={value.page >= value.totalPages ? "opacity-50 pointer-events-none" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
