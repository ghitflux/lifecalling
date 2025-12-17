import { useState, useCallback, useMemo } from 'react';

export interface FilterValue {
  [key: string]: any;
}

export interface UseFiltersOptions {
  initialFilters?: FilterValue;
  onFiltersChange?: (filters: FilterValue) => void;
  onSearch?: (searchTerm: string) => void;
  debounceMs?: number;
}

export interface UseFiltersReturn {
  filters: FilterValue;
  searchTerm: string;
  setFilter: (key: string, value: any) => void;
  removeFilter: (key: string) => void;
  clearAllFilters: () => void;
  setSearchTerm: (term: string) => void;
  clearSearch: () => void;
  activeFiltersCount: number;
  hasActiveFilters: boolean;
  getFilteredData: <T>(data: T[], filterFn?: (item: T, filters: FilterValue, searchTerm: string) => boolean) => T[];
}

export const useFilters = (options: UseFiltersOptions = {}): UseFiltersReturn => {
  const {
    initialFilters = {},
    onFiltersChange,
    onSearch,
    debounceMs = 300
  } = options;

  const [filters, setFilters] = useState<FilterValue>(initialFilters);
  const [searchTerm, setSearchTermState] = useState('');

  // Debounce function
  const debounce = useCallback((func: Function, delay: number) => {
    let timeoutId: ReturnType<typeof setTimeout>;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  }, []);

  const debouncedOnFiltersChange = useMemo(
    () => debounce((newFilters: FilterValue) => {
      if (onFiltersChange) {
        onFiltersChange(newFilters);
      }
    }, debounceMs),
    [onFiltersChange, debounceMs, debounce]
  );

  const debouncedOnSearch = useMemo(
    () => debounce((term: string) => {
      if (onSearch) {
        onSearch(term);
      }
    }, debounceMs),
    [onSearch, debounceMs, debounce]
  );

  const setFilter = useCallback((key: string, value: any) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      if (value === null || value === undefined || value === '' ||
          (Array.isArray(value) && value.length === 0)) {
        delete newFilters[key];
      } else {
        newFilters[key] = value;
      }
      debouncedOnFiltersChange(newFilters);
      return newFilters;
    });
  }, [debouncedOnFiltersChange]);

  const removeFilter = useCallback((key: string) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      debouncedOnFiltersChange(newFilters);
      return newFilters;
    });
  }, [debouncedOnFiltersChange]);

  const clearAllFilters = useCallback(() => {
    setFilters({});
    setSearchTermState('');
    debouncedOnFiltersChange({});
    debouncedOnSearch('');
  }, [debouncedOnFiltersChange, debouncedOnSearch]);

  const setSearchTerm = useCallback((term: string) => {
    setSearchTermState(term);
    debouncedOnSearch(term);
  }, [debouncedOnSearch]);

  const clearSearch = useCallback(() => {
    setSearchTermState('');
    debouncedOnSearch('');
  }, [debouncedOnSearch]);

  const activeFiltersCount = useMemo(() => {
    return Object.keys(filters).length + (searchTerm ? 1 : 0);
  }, [filters, searchTerm]);

  const hasActiveFilters = useMemo(() => {
    return activeFiltersCount > 0;
  }, [activeFiltersCount]);

  // Função genérica para filtrar dados
  const getFilteredData = useCallback(<T>(
    data: T[],
    filterFn?: (item: T, filters: FilterValue, searchTerm: string) => boolean
  ): T[] => {
    if (!hasActiveFilters) {
      return data;
    }

    if (filterFn) {
      return data.filter(item => filterFn(item, filters, searchTerm));
    }

    // Filtro padrão básico
    return data.filter(item => {
      // Filtro de busca por texto
      if (searchTerm) {
        const searchableText = Object.values(item as any)
          .join(' ')
          .toLowerCase();
        if (!searchableText.includes(searchTerm.toLowerCase())) {
          return false;
        }
      }

      // Aplicar filtros específicos
      for (const [key, value] of Object.entries(filters)) {
        const itemValue = (item as any)[key];

        if (Array.isArray(value)) {
          // Filtro multiselect
          if (!value.includes(itemValue)) {
            return false;
          }
        } else if (typeof value === 'object' && value.start && value.end) {
          // Filtro de range de data
          const itemDate = new Date(itemValue);
          const startDate = new Date(value.start);
          const endDate = new Date(value.end);
          if (itemDate < startDate || itemDate > endDate) {
            return false;
          }
        } else if (typeof value === 'boolean') {
          // Filtro booleano
          if (Boolean(itemValue) !== value) {
            return false;
          }
        } else if (typeof value === 'string') {
          // Filtro de texto exato
          if (String(itemValue).toLowerCase() !== value.toLowerCase()) {
            return false;
          }
        } else if (typeof value === 'number') {
          // Filtro numérico
          if (Number(itemValue) !== value) {
            return false;
          }
        }
      }

      return true;
    });
  }, [filters, searchTerm, hasActiveFilters]);

  return {
    filters,
    searchTerm,
    setFilter,
    removeFilter,
    clearAllFilters,
    setSearchTerm,
    clearSearch,
    activeFiltersCount,
    hasActiveFilters,
    getFilteredData
  };
};

export default useFilters;
