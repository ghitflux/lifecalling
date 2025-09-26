/* packages/ui/src/ProgressBar.tsx */
import React from "react";
import { cn } from "./lib/utils";

export interface ProgressBarProps {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "success" | "warning" | "danger";
  showLabel?: boolean;
  label?: string;
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  size = "md",
  variant = "default",
  showLabel = false,
  label,
  className
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  const sizeClasses = {
    sm: "h-2",
    md: "h-3",
    lg: "h-4"
  };

  const variantClasses = {
    default: "bg-primary",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    danger: "bg-red-500"
  };

  const backgroundClasses = {
    default: "bg-primary/20",
    success: "bg-green-100",
    warning: "bg-yellow-100",
    danger: "bg-red-100"
  };

  return (
    <div className={cn("w-full space-y-2", className)}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center text-sm">
          <span className="font-medium text-foreground">
            {label || "Progresso"}
          </span>
          <span className="text-muted-foreground">
            {Math.round(percentage)}%
          </span>
        </div>
      )}

      <div className={cn(
        "w-full rounded-full overflow-hidden",
        backgroundClasses[variant],
        sizeClasses[size]
      )}>
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300 ease-out",
            variantClasses[variant]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}