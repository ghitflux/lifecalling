/* packages/ui/src/KPICard.tsx */
import React from "react";
const motion = {
  div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
};
import { LucideIcon, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "./lib/utils";

type GradientVariant = "emerald" | "amber" | "rose" | "violet" | "sky";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  icon?: LucideIcon;
  color?: "primary" | "success" | "warning" | "danger" | "info";
  gradientVariant?: GradientVariant;
  isLoading?: boolean;
  className?: string;
  children?: React.ReactNode;
  miniChart?: React.ReactNode;
}

const gradientMap: Record<GradientVariant, string> = {
  emerald: "bg-gradient-to-br from-emerald-500/25 via-emerald-500/10 to-emerald-500/5",
  amber: "bg-gradient-to-br from-amber-500/25 via-amber-500/10 to-amber-500/5",
  rose: "bg-gradient-to-br from-rose-500/25 via-rose-500/10 to-rose-500/5",
  violet: "bg-gradient-to-br from-violet-500/25 via-violet-500/10 to-violet-500/5",
  sky: "bg-gradient-to-br from-sky-500/25 via-sky-500/10 to-sky-500/5",
};

const legacyMap = {
  primary: "bg-gradient-to-br from-indigo-500/15 via-indigo-500/10 to-indigo-500/5",
  success: "bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-emerald-500/5",
  warning: "bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-amber-500/5",
  danger: "bg-gradient-to-br from-rose-500/25 via-rose-500/10 to-rose-500/5",
  info: "bg-gradient-to-br from-sky-500/25 via-sky-500/10 to-sky-500/5",
};

export function KPICard({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  color = "primary",
  gradientVariant,
  isLoading = false,
  className,
  children,
  miniChart,
}: KPICardProps) {
  const TrendIcon =
    trend === undefined
      ? null
      : trend > 0
        ? TrendingUp
        : trend < 0
          ? TrendingDown
          : Minus;

  const trendColor =
    trend === undefined
      ? "text-slate-400"
      : trend > 0
        ? "text-emerald-400"
        : trend < 0
          ? "text-rose-400"
          : "text-slate-400";

  const backgroundClass =
    (gradientVariant && gradientMap[gradientVariant]) ||
    legacyMap[color] ||
    "bg-slate-900/70";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn(
        "relative overflow-hidden rounded-3xl border border-white/10 p-[1px]",
        "shadow-lg shadow-black/20 backdrop-blur",
        className
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 opacity-60 blur-xl",
          backgroundClass
        )}
      />
      <div
        className={cn(
          "relative flex h-full flex-col justify-between rounded-[calc(1.5rem-4px)]",
          "bg-slate-950/80 p-6 text-slate-100"
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-300">{title}</p>
            <div className="mt-2 flex items-end gap-3">
              {isLoading ? (
                <span className="h-8 w-32 animate-pulse rounded-lg bg-white/10" />
              ) : (
                <p className="text-3xl font-semibold tracking-tight">{value}</p>
              )}
            </div>
            {subtitle && (
              <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
            )}
          </div>
          {Icon && !miniChart && (
            <div className="rounded-2xl bg-slate-900/60 p-3 text-slate-200 shadow-inner shadow-white/10">
              <Icon className="h-6 w-6" strokeWidth={1.5} />
            </div>
          )}
        </div>

        {/* Mini Chart */}
        {miniChart && (
          <div className="mt-4 -mb-2 -mx-2">
            {miniChart}
          </div>
        )}

        {(trend !== undefined || children) && (
          <div className="mt-4 flex items-center justify-between gap-3 text-sm">
            {trend !== undefined ? (
              <div className={cn("flex items-center gap-1 font-medium", trendColor)}>
                {TrendIcon && <TrendIcon className="h-4 w-4" strokeWidth={2} />}
                <span>
                  {Math.abs(trend).toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}%
                </span>
              </div>
            ) : (
              <span />
            )}
            {children && <div className="text-right text-slate-300">{children}</div>}
          </div>
        )}
      </div>
    </motion.div>
  );
}
