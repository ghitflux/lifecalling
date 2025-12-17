/* packages/ui/src/UserCard.tsx */
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./Card";
import { cn } from "./lib/utils";

interface UserCardProps {
  title: string;
  value: number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function UserCard({ title, value, icon, trend, className }: UserCardProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <p className={cn(
            "text-xs",
            trend.isPositive ? "text-green-600" : "text-red-600"
          )}>
            {trend.isPositive ? "+" : ""}{trend.value} em relação ao mês anterior
          </p>
        )}
      </CardContent>
    </Card>
  );
}