import React, { useState } from "react";
import { cn } from "./lib/utils";
import { Pagination } from "./Pagination";

type Column = {
  key: string;
  header: string;
  format?: "currency" | "signedCurrency" | "number" | "date" | "cpf";
  render?: (row: any) => React.ReactNode;
};

export interface RankingTableProps {
  data: any[];
  columns: Column[];
  className?: string;
  highlightTop3?: boolean;
  showPagination?: boolean;
  defaultItemsPerPage?: number;
}

function formatValue(value: any, format?: Column["format"]) {
  if (format === "currency") {
    return (Number(value) || 0).toLocaleString(undefined, { style: "currency", currency: "BRL" });
  }
  if (format === "signedCurrency") {
    const n = Number(value) || 0;
    const sign = n > 0 ? "+" : "";
    return `${sign}${n.toLocaleString(undefined, { style: "currency", currency: "BRL" })}`;
  }
  if (format === "number") {
    return (Number(value) || 0).toLocaleString();
  }
  if (format === "date") {
    if (!value) return "—";
    const date = new Date(value);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
  if (format === "cpf") {
    if (!value) return "—";
    const cleaned = String(value).replace(/\D/g, '');
    if (cleaned.length !== 11) return value;
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
  }
  return value as React.ReactNode;
}

export function RankingTable({ 
  data, 
  columns, 
  className, 
  highlightTop3 = false,
  showPagination = true,
  defaultItemsPerPage = 10
}: RankingTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage);

  // Calculate pagination
  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = showPagination ? data.slice(startIndex, endIndex) : data;

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle items per page change
  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="rounded-xl border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-900/60">
              {columns.map((c) => (
                <th key={c.key} className="text-left p-3 font-medium text-slate-300">{c.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, idx) => {
              const isTop3 = highlightTop3 && (row.pos <= 3 || idx < 3);
              return (
                <tr 
                  key={idx} 
                  className={cn(
                    "border-t border-white/5 hover:bg-slate-900/40 transition-colors",
                    isTop3 && "bg-gradient-to-r from-yellow-500/10 to-transparent"
                  )}
                >
                  {columns.map((c) => (
                    <td key={c.key} className="p-3">
                      {c.render ? c.render(row) : formatValue(row[c.key], c.format)}
                    </td>
                  ))}
                </tr>
              );
            })}
            {paginatedData.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="p-4 text-center text-slate-400">Nenhum dado encontrado</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {showPagination && totalItems > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          itemsPerPageOptions={[10, 20, 50]}
          showItemsPerPage={true}
        />
      )}
    </div>
  );
}