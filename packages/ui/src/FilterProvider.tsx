/* packages/ui/src/FilterProvider.tsx */
import React, { createContext, useContext, useState, useCallback } from "react";
import { QuickFilter } from "./QuickFilters";
import { FilterGroup, AdvancedFilterValue } from "./AdvancedFilters";

export interface FilterState {
  searchTerm: string;
  quickFilters: string[];
  advancedFilters: AdvancedFilterValue[];
}

export interface FilterContextType {
  // State
  searchTerm: string;
  quickFilters: string[];
  advancedFilters: AdvancedFilterValue[];

  // Quick Filters
  setSearchTerm: (term: string) => void;
  toggleQuickFilter: (filterId: string) => void;
  setQuickFilters: (filters: string[]) => void;

  // Advanced Filters
  setAdvancedFilters: (filters: AdvancedFilterValue[]) => void;

  // Actions
  clearAll: () => void;
  clearQuickFilters: () => void;
  clearAdvancedFilters: () => void;

  // Utilities
  hasActiveFilters: boolean;
  getFilteredData: <T>(data: T[], filterFn: (item: T, state: FilterState) => boolean) => T[];
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export interface FilterProviderProps {
  children: React.ReactNode;
  initialState?: Partial<FilterState>;
  onStateChange?: (state: FilterState) => void;
}

export function FilterProvider({
  children,
  initialState = {},
  onStateChange
}: FilterProviderProps) {
  const [searchTerm, setSearchTermState] = useState(initialState.searchTerm || "");
  const [quickFilters, setQuickFiltersState] = useState<string[]>(initialState.quickFilters || []);
  const [advancedFilters, setAdvancedFiltersState] = useState<AdvancedFilterValue[]>(initialState.advancedFilters || []);

  // Create current state object
  const currentState: FilterState = {
    searchTerm,
    quickFilters,
    advancedFilters
  };

  // Notify parent of state changes
  React.useEffect(() => {
    onStateChange?.(currentState);
  }, [searchTerm, quickFilters, advancedFilters, onStateChange]);

  const setSearchTerm = useCallback((term: string) => {
    setSearchTermState(term);
  }, []);

  const toggleQuickFilter = useCallback((filterId: string) => {
    setQuickFiltersState(prev => (prev.includes(filterId) ? [] : [filterId]));
  }, []);

  const setQuickFilters = useCallback((filters: string[]) => {
    setQuickFiltersState(filters);
  }, []);

  const setAdvancedFilters = useCallback((filters: AdvancedFilterValue[]) => {
    setAdvancedFiltersState(filters);
  }, []);

  const clearAll = useCallback(() => {
    setSearchTermState("");
    setQuickFiltersState([]);
    setAdvancedFiltersState([]);
  }, []);

  const clearQuickFilters = useCallback(() => {
    setQuickFiltersState([]);
  }, []);

  const clearAdvancedFilters = useCallback(() => {
    setAdvancedFiltersState([]);
  }, []);

  const hasActiveFilters = searchTerm.length > 0 || quickFilters.length > 0 || advancedFilters.length > 0;

  const getFilteredData = useCallback(<T,>(
    data: T[],
    filterFn: (item: T, state: FilterState) => boolean
  ): T[] => {
    return data.filter(item => filterFn(item, currentState));
  }, [currentState]);

  const contextValue: FilterContextType = {
    // State
    searchTerm,
    quickFilters,
    advancedFilters,

    // Quick Filters
    setSearchTerm,
    toggleQuickFilter,
    setQuickFilters,

    // Advanced Filters
    setAdvancedFilters,

    // Actions
    clearAll,
    clearQuickFilters,
    clearAdvancedFilters,

    // Utilities
    hasActiveFilters,
    getFilteredData
  };

  return (
    <FilterContext.Provider value={contextValue}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters(): FilterContextType {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
}

// Helper hooks for specific filter types
export function useQuickFilters() {
  const { searchTerm, quickFilters, setSearchTerm, toggleQuickFilter, setQuickFilters, clearQuickFilters } = useFilters();

  return {
    searchTerm,
    quickFilters,
    setSearchTerm,
    toggleQuickFilter,
    setQuickFilters,
    clearQuickFilters
  };
}

export function useAdvancedFilters() {
  const { advancedFilters, setAdvancedFilters, clearAdvancedFilters } = useFilters();

  return {
    advancedFilters,
    setAdvancedFilters,
    clearAdvancedFilters
  };
}
