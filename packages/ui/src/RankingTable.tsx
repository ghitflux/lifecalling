import React from "react";
import { cn } from "./lib/utils";

type Column = {
  key: string;
  header: string;
  format?: "currency" | "signedCurrency" | "number";
  render?: (row: any) => React.ReactNode;
};

export interface RankingTableProps {
  data: any[];
  columns: Column[];
  className?: string;
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
  return value as React.ReactNode;
}

export function RankingTable({ data, columns, className }: RankingTableProps) {
  return (
    <div className={cn("rounded-xl border border-white/10 overflow-hidden", className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-900/60">
            {columns.map((c) => (
              <th key={c.key} className="text-left p-3 font-medium text-slate-300">{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx} className="border-t border-white/5 hover:bg-slate-900/40">
              {columns.map((c) => (
                <td key={c.key} className="p-3">
                  {c.render ? c.render(row) : formatValue(row[c.key], c.format)}
                </td>
              ))}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="p-4 text-center text-slate-400">Nenhum dado encontrado</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}