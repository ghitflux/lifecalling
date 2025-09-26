/* packages/ui/src/KPICard.tsx */
import React from "react";
import { cn } from "./lib/utils";
import { TrendingUp, TrendingDown, Minus, LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  icon?: LucideIcon;
  color?: "primary" | "success" | "warning" | "danger" | "info";
  className?: string;
}

export function KPICard({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  color = "primary",
  className
}: KPICardProps) {
  const colorMap = {
    primary: "from-primary/20 to-primary/5 border-primary/20",
    success: "from-success/20 to-success/5 border-success/20",
    warning: "from-warning/20 to-warning/5 border-warning/20",
    danger: "from-danger/20 to-danger/5 border-danger/20",
    info: "from-info/20 to-info/5 border-info/20"
  };

  const TrendIcon = trend && trend > 0 ? TrendingUp : trend && trend < 0 ? TrendingDown : Minus;
  const trendColor = trend && trend > 0 ? "text-success" : trend && trend < 0 ? "text-danger" : "text-muted-foreground";

  return (
    <div className={cn(
      "relative overflow-hidden rounded-xl border bg-gradient-to-br p-6 backdrop-blur-sm transition-all hover:shadow-lg hover:scale-[1.02]",
      colorMap[color],
      className
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className="p-3 rounded-lg bg-background/50">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        )}
      </div>
      {trend !== undefined && (
        <div className={cn("flex items-center gap-1 mt-4", trendColor)}>
          <TrendIcon className="h-4 w-4" />
          <span className="text-sm font-medium">
            {Math.abs(trend)}%
          </span>
        </div>
      )}
    </div>
  );
}
