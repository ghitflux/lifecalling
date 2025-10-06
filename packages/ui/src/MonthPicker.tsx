/* packages/ui/src/MonthPicker.tsx */
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./lib/utils";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

const monthPickerVariants = cva(
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

const MONTHS = [
  { value: "01", label: "Janeiro", short: "Jan" },
  { value: "02", label: "Fevereiro", short: "Fev" },
  { value: "03", label: "Março", short: "Mar" },
  { value: "04", label: "Abril", short: "Abr" },
  { value: "05", label: "Maio", short: "Mai" },
  { value: "06", label: "Junho", short: "Jun" },
  { value: "07", label: "Julho", short: "Jul" },
  { value: "08", label: "Agosto", short: "Ago" },
  { value: "09", label: "Setembro", short: "Set" },
  { value: "10", label: "Outubro", short: "Out" },
  { value: "11", label: "Novembro", short: "Nov" },
  { value: "12", label: "Dezembro", short: "Dez" },
];

export interface MonthPickerProps extends VariantProps<typeof monthPickerVariants> {
  value?: string; // Format: "YYYY-MM"
  onChange?: (value: string) => void;
  label?: string;
  error?: string;
  helperText?: string;
  className?: string;
  disabled?: boolean;
  minYear?: number;
  maxYear?: number;
  showShortMonths?: boolean;
}

const MonthPicker = React.forwardRef<HTMLDivElement, MonthPickerProps>(
  (
    {
      value,
      onChange,
      label,
      error,
      helperText,
      className,
      variant,
      disabled = false,
      minYear,
      maxYear,
      showShortMonths = false,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = String(currentDate.getMonth() + 1).padStart(2, "0");

    const [selectedYear, setSelectedYear] = React.useState(() => {
      if (value) {
        const [year] = value.split("-");
        return parseInt(year);
      }
      return currentYear;
    });

    const selectedMonth = React.useMemo(() => {
      if (value) {
        const [, month] = value.split("-");
        return month;
      }
      return "";
    }, [value]);

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

    const handleMonthSelect = (month: string) => {
      const newValue = `${selectedYear}-${month}`;
      onChange?.(newValue);
      setIsOpen(false);
    };

    const handleYearChange = (direction: "prev" | "next") => {
      const newYear = direction === "prev" ? selectedYear - 1 : selectedYear + 1;
      if (minYear && newYear < minYear) return;
      if (maxYear && newYear > maxYear) return;
      setSelectedYear(newYear);
    };

    const getDisplayText = () => {
      if (!value) return "Selecione o mês";
      const month = MONTHS.find((m) => m.value === selectedMonth);
      return month ? `${month.label} ${selectedYear}` : "Selecione o mês";
    };

    const getDateRange = () => {
      if (!value) return null;
      const [year, month] = value.split("-");
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      return {
        start: startDate,
        end: endDate,
        startISO: startDate.toISOString().split("T")[0],
        endISO: endDate.toISOString().split("T")[0],
      };
    };

    return (
      <div ref={containerRef} className={cn(monthPickerVariants({ variant, className }))}>
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
          <span className={cn(!value && "text-muted-foreground")}>
            {getDisplayText()}
          </span>
          <Calendar className="h-4 w-4 opacity-50" />
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-2 w-full rounded-md border bg-popover shadow-md p-4">
            {/* Year selector */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => handleYearChange("prev")}
                disabled={minYear !== undefined && selectedYear <= minYear}
                className="p-1 hover:bg-accent rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="font-semibold text-sm">{selectedYear}</span>
              <button
                type="button"
                onClick={() => handleYearChange("next")}
                disabled={maxYear !== undefined && selectedYear >= maxYear}
                className="p-1 hover:bg-accent rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Month grid */}
            <div className="grid grid-cols-3 gap-2">
              {MONTHS.map((month) => {
                const isSelected = selectedMonth === month.value && selectedYear === parseInt(value?.split("-")[0] || "0");
                const isCurrent = currentYear === selectedYear && currentMonth === month.value;

                return (
                  <button
                    key={month.value}
                    type="button"
                    onClick={() => handleMonthSelect(month.value)}
                    className={cn(
                      "px-3 py-2 text-sm rounded-md transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      isSelected && "bg-primary text-primary-foreground hover:bg-primary/90",
                      isCurrent && !isSelected && "border border-primary"
                    )}
                  >
                    {showShortMonths ? month.short : month.label}
                  </button>
                );
              })}
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

MonthPicker.displayName = "MonthPicker";

export { MonthPicker, monthPickerVariants, MONTHS };
