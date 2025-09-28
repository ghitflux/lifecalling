/* packages/ui/src/AdvancedFilters.tsx */
import React from "react";
import { Button } from "./Button";
import { Dialog } from "./Dialog";
import { Badge } from "./Badge";
import { cn } from "./lib/utils";
import { Filter, X, Calendar, DollarSign, Building, User, Hash } from "lucide-react";

export interface FilterOption {
  id: string;
  label: string;
  value: string;
  count?: number;
}

export interface FilterGroup {
  id: string;
  label: string;
  type: "select" | "multiselect" | "date" | "daterange" | "number" | "numberrange";
  options?: FilterOption[];
  placeholder?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface AdvancedFilterValue {
  groupId: string;
  values: string[];
}

export interface AdvancedFiltersProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filterGroups: FilterGroup[];
  values: AdvancedFilterValue[];
  onValuesChange: (values: AdvancedFilterValue[]) => void;
  onApply: () => void;
  onClear: () => void;
  className?: string;
}

export function AdvancedFilters({
  open,
  onOpenChange,
  filterGroups,
  values,
  onValuesChange,
  onApply,
  onClear,
  className
}: AdvancedFiltersProps) {
  const getGroupValue = (groupId: string): string[] => {
    return values.find(v => v.groupId === groupId)?.values || [];
  };

  const updateGroupValue = (groupId: string, newValues: string[]) => {
    const updatedValues = values.filter(v => v.groupId !== groupId);
    if (newValues.length > 0) {
      updatedValues.push({ groupId, values: newValues });
    }
    onValuesChange(updatedValues);
  };

  const renderFilterControl = (group: FilterGroup) => {
    const currentValues = getGroupValue(group.id);
    const IconComponent = group.icon;

    switch (group.type) {
      case "select":
        return (
          <select
            value={currentValues[0] || ""}
            onChange={(e) => updateGroupValue(group.id, e.target.value ? [e.target.value] : [])}
            className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">{group.placeholder || "Selecione..."}</option>
            {group.options?.map((option) => (
              <option key={option.id} value={option.value}>
                {option.label} {option.count !== undefined && `(${option.count})`}
              </option>
            ))}
          </select>
        );

      case "multiselect":
        return (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1 mb-2">
              {currentValues.map((value) => {
                const option = group.options?.find(o => o.value === value);
                return (
                  <Badge
                    key={value}
                    variant="secondary"
                    className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => updateGroupValue(group.id, currentValues.filter(v => v !== value))}
                  >
                    {option?.label || value}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                );
              })}
            </div>
            <select
              onChange={(e) => {
                if (e.target.value && !currentValues.includes(e.target.value)) {
                  updateGroupValue(group.id, [...currentValues, e.target.value]);
                }
                e.target.value = "";
              }}
              className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">{group.placeholder || "Adicionar..."}</option>
              {group.options?.filter(option => !currentValues.includes(option.value)).map((option) => (
                <option key={option.id} value={option.value}>
                  {option.label} {option.count !== undefined && `(${option.count})`}
                </option>
              ))}
            </select>
          </div>
        );

      case "date":
        return (
          <input
            type="date"
            value={currentValues[0] || ""}
            onChange={(e) => updateGroupValue(group.id, e.target.value ? [e.target.value] : [])}
            className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        );

      case "daterange":
        return (
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={currentValues[0] || ""}
              onChange={(e) => {
                const newValues = [e.target.value, currentValues[1] || ""].filter(Boolean);
                updateGroupValue(group.id, newValues);
              }}
              placeholder="Data inicial"
              className="px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <input
              type="date"
              value={currentValues[1] || ""}
              onChange={(e) => {
                const newValues = [currentValues[0] || "", e.target.value].filter(Boolean);
                updateGroupValue(group.id, newValues);
              }}
              placeholder="Data final"
              className="px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        );

      case "number":
        return (
          <input
            type="number"
            value={currentValues[0] || ""}
            onChange={(e) => updateGroupValue(group.id, e.target.value ? [e.target.value] : [])}
            placeholder={group.placeholder}
            className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        );

      case "numberrange":
        return (
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={currentValues[0] || ""}
              onChange={(e) => {
                const newValues = [e.target.value, currentValues[1] || ""].filter(Boolean);
                updateGroupValue(group.id, newValues);
              }}
              placeholder="Mínimo"
              className="px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <input
              type="number"
              value={currentValues[1] || ""}
              onChange={(e) => {
                const newValues = [currentValues[0] || "", e.target.value].filter(Boolean);
                updateGroupValue(group.id, newValues);
              }}
              placeholder="Máximo"
              className="px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        );

      default:
        return null;
    }
  };

  const hasActiveFilters = values.length > 0;
  const activeFilterCount = values.reduce((total, group) => total + group.values.length, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
        <div className={cn(
          "relative bg-background rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] flex flex-col",
          className
        )}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Filtros Avançados</h2>
              {hasActiveFilters && (
                <Badge variant="secondary">
                  {activeFilterCount} filtros ativos
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid gap-6">
              {filterGroups.map((group) => {
                const IconComponent = group.icon;
                return (
                  <div key={group.id} className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium">
                      {IconComponent && <IconComponent className="h-4 w-4" />}
                      {group.label}
                    </label>
                    {renderFilterControl(group)}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t bg-muted/30">
            <Button
              variant="ghost"
              onClick={onClear}
              disabled={!hasActiveFilters}
            >
              <X className="h-4 w-4 mr-1" />
              Limpar Tudo
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button onClick={() => {
                onApply();
                onOpenChange(false);
              }}>
                Aplicar Filtros
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
}