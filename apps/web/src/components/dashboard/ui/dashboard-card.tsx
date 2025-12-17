"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface DashboardCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const DashboardCard = forwardRef<HTMLDivElement, DashboardCardProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <Card
        ref={ref}
        className={cn(
          "dashboard-gradient border-white/10 p-6 text-white backdrop-blur-sm",
          className
        )}
        {...props}
      >
        {children}
      </Card>
    );
  }
);

DashboardCard.displayName = "DashboardCard";