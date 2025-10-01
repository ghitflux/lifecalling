/* packages/ui/index.ts */
// Core Components
export * from "./src/Button";
export * from "./src/Card";
export * from "./src/Input";
export * from "./src/Badge";
export * from "./src/Tabs";
export * from "./src/Dialog";

// Advanced Components
export * from "./src/StatusBadge";
export * from "./src/KPICard";
export * from "./src/AdvancedCard";
export * from "./src/EsteiraCard";
export * from "./src/SimulationCard";
export * from "./src/SimulationForm";
export * from "./src/SimulationWorkspace";
export * from "./src/SimulationResultCard";
export * from "./src/SimulationHistoryCard";
export * from "./src/lib/simulationUtils";
export * from "./src/ChartContainer";
export * from "./src/AreaChart";
export * from "./src/PieChart";
export * from "./src/BarChart";
export * from "./src/LineChart";
export * from "./src/GridSystem";
export * from "./src/CaseCard";
export * from "./src/CaseDetails";
export * from "./src/CaseNotesEditor";

// New Components
export * from "./src/ProgressBar";
export * from "./src/ToggleButton";
export * from "./src/FinanceCard";
export * from "./src/FinanceMetrics";
export * from "./src/ExpenseModal";
export * from "./src/ContractCard";
export * from "./src/ContractSummary";
export * from "./src/components/CardFechamento";

// User Components
export * from "./src/UserCard";
export * from "./src/UserTable";
export * from "./src/CasesTable";
export * from "./src/UserForm";

// Filter Components
export * from "./src/FilterComponent";
export * from "./src/QuickFilters";
export { AdvancedFilters, type FilterGroup, type AdvancedFilterValue } from "./src/AdvancedFilters";
export { FilterProvider, useFilters as useFiltersContext } from "./src/FilterProvider";

// Pagination
export * from "./src/Pagination";

// Hooks
export { useFilters } from "./src/hooks/useFilters";

// Skeletons
export * from "./src/Skeleton";
export * from "./src/CaseSkeleton";
export * from "./src/DetailsSkeleton";

// Icons
export * from "./src/icons";

// Utils
export * from "./src/lib/utils";
