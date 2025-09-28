/* packages/ui/src/QuickFilters.tsx */
import React from "react";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { cn } from "./lib/utils";
import { Search, Filter, X, Calendar, DollarSign, User } from "lucide-react";

export interface QuickFilter {
  id: string;
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  color?: "default" | "primary" | "secondary" | "success" | "warning" | "danger";
  count?: number;
}

export interface QuickFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  activeFilters: string[];
  onFilterToggle: (filterId: string) => void;
  availableFilters: QuickFilter[];
  onClearAll: () => void;
  onAdvancedFilters?: () => void;
  className?: string;
  placeholder?: string;
}

export function QuickFilters({
  searchTerm,
  onSearchChange,
  activeFilters,
  onFilterToggle,
  availableFilters,
  onClearAll,
  onAdvancedFilters,
  className,
  placeholder = "Buscar..."
}: QuickFiltersProps) {
  const hasActiveFilters = activeFilters.length > 0 || searchTerm.length > 0;

  const getFilterColor = (filter: QuickFilter) => {
    const isActive = activeFilters.includes(filter.id);
    if (!isActive) return "outline";

    switch (filter.color) {
      case "primary": return "default";
      case "success": return "default";
      case "warning": return "default";
      case "danger": return "destructive";
      default: return "default";
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search Bar */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
        {searchTerm && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Quick Filter Buttons */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span>Filtros:</span>
        </div>

        {availableFilters.map((filter) => {
          const isActive = activeFilters.includes(filter.id);
          const IconComponent = filter.icon;

          return (
            <Button
              key={filter.id}
              variant={getFilterColor(filter)}
              size="sm"
              onClick={() => onFilterToggle(filter.id)}
              className={cn(
                "transition-all",
                isActive && "ring-2 ring-primary/20"
              )}
            >
              {IconComponent && <IconComponent className="h-3 w-3 mr-1" />}
              {filter.label}
              {filter.count !== undefined && (
                <Badge
                  variant="secondary"
                  className="ml-1 text-xs h-4 w-auto px-1"
                >
                  {filter.count}
                </Badge>
              )}
            </Button>
          );
        })}

        {/* Advanced Filters Button */}
        {onAdvancedFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onAdvancedFilters}
            className="border border-dashed"
          >
            <Filter className="h-3 w-3 mr-1" />
            Filtros Avançados
          </Button>
        )}

        {/* Clear All Button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3 mr-1" />
            Limpar tudo
          </Button>
        )}
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Filtros ativos:</span>
          {searchTerm && (
            <Badge variant="outline" className="text-xs">
              Busca: "{searchTerm}"
            </Badge>
          )}
          {activeFilters.map((filterId) => {
            const filter = availableFilters.find(f => f.id === filterId);
            if (!filter) return null;

            return (
              <Badge
                key={filterId}
                variant="outline"
                className="text-xs cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => onFilterToggle(filterId)}
              >
                {filter.label}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}