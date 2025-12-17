/* packages/ui/src/icons/CollapseIcon.tsx */
import React from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "../lib/utils";

interface CollapseIconProps {
  collapsed: boolean;
  className?: string;
  size?: number;
}

export function CollapseIcon({ collapsed, className, size = 16 }: CollapseIconProps) {
  const Icon = collapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <Icon
      size={size}
      className={cn(
        "transition-transform duration-200 ease-in-out",
        collapsed && "rotate-180",
        className
      )}
    />
  );
}