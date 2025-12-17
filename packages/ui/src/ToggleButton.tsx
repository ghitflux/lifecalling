/* packages/ui/src/ToggleButton.tsx */
import React from "react";
import { cn } from "./lib/utils";

export interface ToggleButtonProps {
  pressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outline" | "ghost" | "slide";
  children: React.ReactNode;
  className?: string;
}

export function ToggleButton({
  pressed = false,
  onPressedChange,
  disabled = false,
  size = "md",
  variant = "default",
  children,
  className,
  ...props
}: ToggleButtonProps) {
  const handleClick = () => {
    if (!disabled && onPressedChange) {
      onPressedChange(!pressed);
    }
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  const slideSizeClasses = {
    sm: "w-8 h-4",
    md: "w-11 h-6",
    lg: "w-14 h-8"
  };

  const slideThumbSizeClasses = {
    sm: "w-3 h-3",
    md: "w-5 h-5",
    lg: "w-6 h-6"
  };

  const isSlideVariant = variant === "slide";

  const baseClasses = cn(
    isSlideVariant 
      ? "relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      : "inline-flex items-center justify-center font-medium rounded-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
    isSlideVariant ? slideSizeClasses[size] : sizeClasses[size]
  );

  const variantClasses = {
    default: cn(
      pressed
        ? "bg-primary text-primary-foreground shadow-sm"
        : "bg-background text-foreground border border-input hover:bg-accent hover:text-accent-foreground"
    ),
    outline: cn(
      pressed
        ? "bg-primary text-primary-foreground border-primary"
        : "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
    ),
    ghost: cn(
      pressed
        ? "bg-accent text-accent-foreground"
        : "hover:bg-accent hover:text-accent-foreground"
    ),
    slide: cn(
      pressed
        ? "bg-primary"
        : "bg-input"
    )
  };

  return (
    <button
      className={cn(baseClasses, variantClasses[variant], className)}
      onClick={handleClick}
      disabled={disabled}
      aria-pressed={pressed}
      {...props}
    >
      {isSlideVariant ? (
        <span
          className={cn(
            "pointer-events-none inline-block rounded-full bg-background shadow-lg ring-0 transition-transform duration-200 ease-in-out",
            slideThumbSizeClasses[size],
            pressed ? "translate-x-5" : "translate-x-0"
          )}
        />
      ) : (
        children
      )}
    </button>
  );
}