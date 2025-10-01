import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Filter, X, ChevronDown, Calendar, SlidersHorizontal } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { Badge } from './Badge';
import { Card, CardContent, CardHeader, CardTitle } from './Card';

export interface FilterOption {
  key: string;
  label: string;
  type: 'text' | 'select' | 'multiselect' | 'date' | 'daterange' | 'number' | 'boolean';
  options?: { value: string; label: string }[];
  placeholder?: string;
  min?: number;
  max?: number;
}

export interface FilterValue {
  [key: string]: any;
}

export interface FilterComponentProps {
  filters: FilterOption[];
  onFiltersChange: (filters: FilterValue) => void;
  onSearch?: (searchTerm: string) => void;
  searchPlaceholder?: string;
  showSearch?: boolean;
  showFilterCount?: boolean;
  className?: string;
  compact?: boolean;
  debounceMs?: number;
  initialFilters?: FilterValue;
}

export const FilterComponent: React.FC<FilterComponentProps> = ({
  filters,
  onFiltersChange,
  onSearch,
  searchPlaceholder = "Buscar...",
  showSearch = true,
  showFilterCount = true,
  className = "",
  compact = false,
  debounceMs = 300,
  initialFilters = {}
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterValues, setFilterValues] = useState<FilterValue>(initialFilters);
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set());

  // Debounce para busca em tempo real
  const debounce = useCallback((func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  }, []);

  const debouncedSearch = useMemo(
    () => debounce((term: string) => {
      if (onSearch) {
        onSearch(term);
      }
    }, debounceMs),
    [onSearch, debounceMs, debounce]
  );

  const debouncedFilterChange = useMemo(
    () => debounce((filters: FilterValue) => {
      onFiltersChange(filters);
    }, debounceMs),
    [onFiltersChange, debounceMs, debounce]
  );

  // Efeito para busca em tempo real
  useEffect(() => {
    debouncedSearch(searchTerm);
  }, [searchTerm, debouncedSearch]);

  // Efeito para mudanças de filtro em tempo real
  useEffect(() => {
    debouncedFilterChange(filterValues);
  }, [filterValues, debouncedFilterChange]);

  const handleFilterChange = (key: string, value: any) => {
    setFilterValues(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilter = (key: string) => {
    setFilterValues(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  };

  const clearAllFilters = () => {
    setFilterValues({});
    setSearchTerm("");
  };

  const toggleDropdown = (key: string) => {
    setOpenDropdowns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const activeFiltersCount = Object.keys(filterValues).length + (searchTerm ? 1 : 0);

  const renderFilterInput = (filter: FilterOption) => {
    const value = filterValues[filter.key];

    switch (filter.type) {
      case 'text':
      case 'number':
        return (
          <div className="relative">
            <Input
              type={filter.type}
              placeholder={filter.placeholder || filter.label}
              value={value || ''}
              onChange={(e) => handleFilterChange(filter.key, e.target.value)}
              className="w-full"
              min={filter.min}
              max={filter.max}
            />
            {value && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => clearFilter(filter.key)}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        );

      case 'select':
        return (
          <div className="relative">
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => toggleDropdown(filter.key)}
            >
              {value ? filter.options?.find(opt => opt.value === value)?.label : filter.placeholder || filter.label}
              <ChevronDown className="h-4 w-4" />
            </Button>
            {openDropdowns.has(filter.key) && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                {filter.options?.map(option => (
                  <button
                    key={option.value}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                    onClick={() => {
                      handleFilterChange(filter.key, option.value);
                      toggleDropdown(filter.key);
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        );

      case 'multiselect':
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            <div className="relative">
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => toggleDropdown(filter.key)}
              >
                {selectedValues.length > 0 ? `${selectedValues.length} selecionados` : filter.placeholder || filter.label}
                <ChevronDown className="h-4 w-4" />
              </Button>
              {openDropdowns.has(filter.key) && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                  {filter.options?.map(option => (
                    <label
                      key={option.value}
                      className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedValues.includes(option.value)}
                        onChange={(e) => {
                          const newValues = e.target.checked
                            ? [...selectedValues, option.value]
                            : selectedValues.filter(v => v !== option.value);
                          handleFilterChange(filter.key, newValues);
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">{option.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            {selectedValues.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedValues.map(val => {
                  const option = filter.options?.find(opt => opt.value === val);
                  return (
                    <Badge key={val} variant="secondary" className="text-xs">
                      {option?.label}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-1 h-3 w-3 p-0"
                        onClick={() => {
                          const newValues = selectedValues.filter(v => v !== val);
                          handleFilterChange(filter.key, newValues);
                        }}
                      >
                        <X className="h-2 w-2" />
                      </Button>
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>
        );

      case 'date':
        return (
          <div className="relative">
            <Input
              type="date"
              value={value || ''}
              onChange={(e) => handleFilterChange(filter.key, e.target.value)}
              className="w-full"
            />
            {value && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => clearFilter(filter.key)}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        );

      case 'daterange':
        const dateRange = value || { start: '', end: '' };
        return (
          <div className="space-y-2">
            <Input
              type="date"
              placeholder="Data inicial"
              value={dateRange.start || ''}
              onChange={(e) => handleFilterChange(filter.key, { ...dateRange, start: e.target.value })}
              className="w-full"
            />
            <Input
              type="date"
              placeholder="Data final"
              value={dateRange.end || ''}
              onChange={(e) => handleFilterChange(filter.key, { ...dateRange, end: e.target.value })}
              className="w-full"
            />
          </div>
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={filter.key}
              checked={value || false}
              onChange={(e) => handleFilterChange(filter.key, e.target.checked)}
              className="rounded"
            />
            <label htmlFor={filter.key} className="text-sm font-medium">
              {filter.label}
            </label>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <SlidersHorizontal className="h-5 w-5" />
            Filtros
            {showFilterCount && activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                className="text-xs"
              >
                Limpar tudo
              </Button>
            )}
            {compact && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <Filter className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Campo de busca */}
          {showSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}

          {/* Filtros */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filters.map(filter => (
              <div key={filter.key} className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  {filter.label}
                </label>
                {renderFilterInput(filter)}
              </div>
            ))}
          </div>

          {/* Filtros ativos */}
          {activeFiltersCount > 0 && (
            <div className="pt-4 border-t">
              <div className="flex flex-wrap gap-2">
                {searchTerm && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    Busca: "{searchTerm}"
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-3 w-3 p-0 ml-1"
                      onClick={() => setSearchTerm("")}
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  </Badge>
                )}
                {Object.entries(filterValues).map(([key, value]) => {
                  const filter = filters.find(f => f.key === key);
                  if (!filter || !value) return null;

                  let displayValue = value;
                  if (filter.type === 'select') {
                    displayValue = filter.options?.find(opt => opt.value === value)?.label || value;
                  } else if (filter.type === 'multiselect' && Array.isArray(value)) {
                    displayValue = `${value.length} selecionados`;
                  } else if (filter.type === 'daterange') {
                    displayValue = `${value.start || ''} - ${value.end || ''}`;
                  }

                  return (
                    <Badge key={key} variant="outline" className="flex items-center gap-1">
                      {filter.label}: {displayValue}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-3 w-3 p-0 ml-1"
                        onClick={() => clearFilter(key)}
                      >
                        <X className="h-2 w-2" />
                      </Button>
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default FilterComponent;