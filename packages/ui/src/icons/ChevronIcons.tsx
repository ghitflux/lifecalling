/* packages/ui/src/icons/ChevronIcons.tsx */
import React from "react";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "../lib/utils";

interface ChevronIconProps {
  className?: string;
  size?: number;
}

export function ChevronLeftIcon({ className, size = 16 }: ChevronIconProps) {
  return (
    <ChevronLeft
      size={size}
      className={cn("transition-transform duration-150", className)}
    />
  );
}

export function ChevronRightIcon({ className, size = 16 }: ChevronIconProps) {
  return (
    <ChevronRight
      size={size}
      className={cn("transition-transform duration-150", className)}
    />
  );
}

export function ChevronDownIcon({ className, size = 16 }: ChevronIconProps) {
  return (
    <ChevronDown
      size={size}
      className={cn("transition-transform duration-150", className)}
    />
  );
}

export function ChevronUpIcon({ className, size = 16 }: ChevronIconProps) {
  return (
    <ChevronUp
      size={size}
      className={cn("transition-transform duration-150", className)}
    />
  );
}