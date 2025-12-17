/* packages/ui/src/GradientPanel.tsx */
import React from "react";
import { cn } from "./lib/utils";

type GradientVariant = "emerald" | "amber" | "rose" | "violet" | "sky" | "slate";

interface GradientPanelProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  variant?: GradientVariant;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

const variantMap: Record<GradientVariant, string> = {
  emerald: "bg-gradient-conic from-emerald-500/35 via-emerald-500/10 to-transparent",
  amber: "bg-gradient-conic from-amber-500/40 via-amber-500/10 to-transparent",
  rose: "bg-gradient-conic from-rose-500/35 via-rose-500/10 to-transparent",
  violet: "bg-gradient-conic from-violet-500/35 via-violet-500/10 to-transparent",
  sky: "bg-gradient-conic from-sky-500/35 via-sky-500/10 to-transparent",
  slate: "bg-gradient-conic from-slate-500/25 via-slate-500/8 to-transparent",
};

export function GradientPanel({
  title,
  description,
  actions,
  variant = "slate",
  children,
  className,
  contentClassName,
}: GradientPanelProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-white/10 p-[1px]",
        "shadow-xl shadow-black/30 backdrop-blur",
        className
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 opacity-70 blur-2xl",
          variantMap[variant]
        )}
      />
      <div
        className={cn(
          "relative h-full rounded-[calc(1.5rem-4px)] bg-slate-950/80 p-6",
          "ring-1 ring-inset ring-white/5",
          contentClassName
        )}
      >
        {(title || actions || description) && (
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              {title && (
                <h3 className="text-lg font-semibold tracking-tight text-slate-100">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-sm text-slate-300/80">{description}</p>
              )}
            </div>
            {actions && <div className="flex items-center gap-3 text-sm">{actions}</div>}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
