/* packages/ui/src/Skeleton.tsx */
import React from "react";
import { cn } from "./lib/utils";

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  variant?: "rectangular" | "circular" | "text";
  animation?: "pulse" | "wave" | "none";
}

export function Skeleton({
  className,
  width,
  height,
  variant = "rectangular",
  animation = "pulse"
}: SkeletonProps) {
  const baseClasses = cn(
    "bg-muted",
    animation === "pulse" && "animate-pulse",
    animation === "wave" && "animate-[wave_1.2s_ease-in-out_infinite] bg-gradient-to-r from-muted via-muted-foreground/5 to-muted bg-[length:200%_100%]",
    animation === "none" && "",
    className
  );

  const variantClasses = {
    rectangular: "rounded-md",
    circular: "rounded-full",
    text: "rounded-sm"
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === "number" ? `${width}px` : width;
  if (height) style.height = typeof height === "number" ? `${height}px` : height;

  return (
    <div
      className={cn(baseClasses, variantClasses[variant])}
      style={style}
      aria-hidden="true"
    />
  );
}

// Componentes específicos para casos comuns
export function SkeletonText({ lines = 1, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          variant="text"
          height={16}
          width={i === lines - 1 ? "75%" : "100%"}
        />
      ))}
    </div>
  );
}

export function SkeletonAvatar({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <Skeleton
      variant="circular"
      width={size}
      height={size}
      className={className}
    />
  );
}

export function SkeletonButton({ className }: { className?: string }) {
  return (
    <Skeleton
      height={36}
      width={100}
      className={cn("rounded-md", className)}
    />
  );
}