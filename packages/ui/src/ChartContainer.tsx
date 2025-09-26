/* packages/ui/src/ChartContainer.tsx */
import React from "react";
import { cn } from "./lib/utils";

interface ChartContainerProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function ChartContainer({
  title,
  subtitle,
  children,
  actions,
  className
}: ChartContainerProps) {
  return (
    <div className={cn(
      "rounded-xl border bg-card p-6 shadow-sm",
      className
    )}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex gap-2">
            {actions}
          </div>
        )}
      </div>
      <div className="min-h-[300px]">
        {children}
      </div>
    </div>
  );
}
