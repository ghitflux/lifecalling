/* packages/ui/src/FilterDropdown.tsx */
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./lib/utils";
import { ChevronDown, Check, Search, X } from "lucide-react";

const dropdownVariants = cva(
  "relative w-full",
  {
    variants: {
      variant: {
        default: "border-input",
        error: "border-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface FilterOption {
  value: string;
  label: string;
  category?: string;
}

export interface FilterDropdownProps extends VariantProps<typeof dropdownVariants> {
  options: FilterOption[];
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  helperText?: string;
  searchable?: boolean;
  multiple?: boolean;
  className?: string;
  disabled?: boolean;
}

const FilterDropdown = React.forwardRef<HTMLDivElement, FilterDropdownProps>(
  (
    {
      options = [],
      value,
      onChange,
      placeholder = "Selecione...",
      label,
      error,
      helperText,
      searchable = false,
      multiple = false,
      className,
      variant,
      disabled = false,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState("");
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Handle click outside
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
      }

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [isOpen]);

    const selectedValues = React.useMemo((): string[] => {
      if (multiple) {
        return Array.isArray(value) ? value : [];
      }
      return value && typeof value === 'string' ? [value] : [];
    }, [value, multiple]);

    const filteredOptions = React.useMemo(() => {
      if (!searchQuery) return options;
      return options.filter((option) =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }, [options, searchQuery]);

    const handleSelect = (optionValue: string) => {
      if (multiple) {
        const newValues = selectedValues.includes(optionValue)
          ? selectedValues.filter((v) => v !== optionValue)
          : [...selectedValues, optionValue];
        onChange?.(newValues);
      } else {
        onChange?.(optionValue);
        setIsOpen(false);
      }
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange?.(multiple ? [] : "");
    };

    const getDisplayText = () => {
      if (selectedValues.length === 0) return placeholder;
      if (!multiple) {
        const selected = options.find((opt) => opt.value === selectedValues[0]);
        return selected?.label || placeholder;
      }
      return `${selectedValues.length} selecionado(s)`;
    };

    // Group options by category
    const groupedOptions = React.useMemo(() => {
      const groups: Record<string, FilterOption[]> = {};
      filteredOptions.forEach((option) => {
        const category = option.category || "Sem categoria";
        if (!groups[category]) groups[category] = [];
        groups[category].push(option);
      });
      return groups;
    }, [filteredOptions]);

    const hasCategories = filteredOptions.some((opt) => opt.category);

    return (
      <div ref={containerRef} className={cn(dropdownVariants({ variant, className }))}>
        {label && (
          <label className="block text-sm font-medium mb-2 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </label>
        )}

        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            "flex items-center justify-between w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-destructive"
          )}
        >
          <span className={cn(!selectedValues.length && "text-muted-foreground")}>
            {getDisplayText()}
          </span>
          <div className="flex items-center gap-1">
            {selectedValues.length > 0 && !disabled && (
              <X
                className="h-4 w-4 opacity-50 hover:opacity-100"
                onClick={handleClear}
              />
            )}
            <ChevronDown
              className={cn(
                "h-4 w-4 opacity-50 transition-transform",
                isOpen && "rotate-180"
              )}
            />
          </div>
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-2 w-full rounded-md border bg-popover shadow-md">
            {searchable && (
              <div className="flex items-center border-b px-3 py-2">
                <Search className="mr-2 h-4 w-4 opacity-50" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm"
                />
              </div>
            )}

            <div className="max-h-60 overflow-auto p-1">
              {filteredOptions.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Nenhuma opção encontrada
                </div>
              ) : hasCategories ? (
                Object.entries(groupedOptions).map(([category, categoryOptions]) => (
                  <div key={category}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      {category}
                    </div>
                    {categoryOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleSelect(option.value)}
                        className={cn(
                          "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
                          "hover:bg-accent hover:text-accent-foreground",
                          selectedValues.includes(option.value) && "bg-accent"
                        )}
                      >
                        {multiple && (
                          <div
                            className={cn(
                              "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                              selectedValues.includes(option.value)
                                ? "bg-primary text-primary-foreground"
                                : "opacity-50"
                            )}
                          >
                            {selectedValues.includes(option.value) && (
                              <Check className="h-3 w-3" />
                            )}
                          </div>
                        )}
                        <span className="flex-1">{option.label}</span>
                        {!multiple && selectedValues.includes(option.value) && (
                          <Check className="h-4 w-4" />
                        )}
                      </button>
                    ))}
                  </div>
                ))
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      selectedValues.includes(option.value) && "bg-accent"
                    )}
                  >
                    {multiple && (
                      <div
                        className={cn(
                          "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                          selectedValues.includes(option.value)
                            ? "bg-primary text-primary-foreground"
                            : "opacity-50"
                        )}
                      >
                        {selectedValues.includes(option.value) && (
                          <Check className="h-3 w-3" />
                        )}
                      </div>
                    )}
                    <span className="flex-1">{option.label}</span>
                    {!multiple && selectedValues.includes(option.value) && (
                      <Check className="h-4 w-4" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {error && (
          <p className="mt-2 text-sm font-medium text-destructive">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-2 text-sm text-muted-foreground">{helperText}</p>
        )}
      </div>
    );
  }
);

FilterDropdown.displayName = "FilterDropdown";

export { FilterDropdown, dropdownVariants };
