/* packages/ui/src/AdvancedCard.tsx */
import React from "react";
import { cn } from "./lib/utils";
import { MoreHorizontal } from "lucide-react";

interface AdvancedCardProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  highlight?: boolean;
  className?: string;
}

export function AdvancedCard({
  title,
  subtitle,
  badge,
  actions,
  children,
  footer,
  highlight,
  className
}: AdvancedCardProps) {
  return (
    <div className={cn(
      "group relative rounded-xl border bg-card transition-all duration-200",
      "hover:shadow-lg hover:border-primary/30",
      highlight && "ring-2 ring-primary/50 shadow-glow",
      className
    )}>
      {/* Glow Effect on Hover */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Header */}
      <div className="relative border-b p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">{title}</h3>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {badge}
            {actions}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative p-4">
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <div className="relative border-t p-4 bg-muted/5">
          {footer}
        </div>
      )}
    </div>
  );
}
