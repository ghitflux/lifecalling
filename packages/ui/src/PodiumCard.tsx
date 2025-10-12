import React from "react";
import { cn } from "./lib/utils";
import { Trophy, TrendingUp } from "lucide-react";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

export interface PodiumCardProps {
  position: 1 | 2 | 3;
  userName: string;
  contracts: number;
  consultoriaLiq: number;
  avatar?: string;
  className?: string;
}

const POSITION_CONFIGS = {
  1: {
    gradient: "from-yellow-500 via-yellow-400 to-yellow-600",
    bgGradient: "from-yellow-500/20 to-yellow-600/10",
    borderColor: "border-yellow-500/50",
    textColor: "text-yellow-600",
    icon: "🥇",
    label: "1º Lugar",
    size: "large"
  },
  2: {
    gradient: "from-gray-400 via-gray-300 to-gray-500",
    bgGradient: "from-gray-400/20 to-gray-500/10",
    borderColor: "border-gray-400/50",
    textColor: "text-gray-600",
    icon: "🥈",
    label: "2º Lugar",
    size: "medium"
  },
  3: {
    gradient: "from-amber-700 via-amber-600 to-amber-800",
    bgGradient: "from-amber-600/20 to-amber-700/10",
    borderColor: "border-amber-600/50",
    textColor: "text-amber-700",
    icon: "🥉",
    label: "3º Lugar",
    size: "medium"
  }
} as const;

export function PodiumCard({
  position,
  userName,
  contracts,
  consultoriaLiq,
  avatar,
  className
}: PodiumCardProps) {
  const config = POSITION_CONFIGS[position];
  const isFirst = position === 1;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl",
        `bg-gradient-to-br ${config.bgGradient}`,
        config.borderColor,
        isFirst ? "p-8 shadow-xl" : "p-6 shadow-lg",
        className
      )}
    >
      {/* Background Gradient Overlay */}
      <div className={cn(
        "absolute inset-0 opacity-10 bg-gradient-to-br",
        config.gradient
      )} />

      {/* Content */}
      <div className="relative z-10 space-y-4">
        {/* Header com Posição */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={cn("transition-transform duration-300 hover:scale-110", isFirst ? "text-5xl" : "text-4xl")}>{config.icon}</span>
            <div>
              <div className={cn("font-bold", isFirst ? "text-lg" : "text-md", config.textColor)}>
                {config.label}
              </div>
              <div className="text-xs text-muted-foreground">Top Performer</div>
            </div>
          </div>
          <Trophy className={cn("transition-all duration-300 hover:rotate-12", isFirst ? "h-9 w-9" : "h-8 w-8", config.textColor)} />
        </div>

        {/* Avatar e Nome */}
        <div className="flex flex-col items-center gap-3 py-4">
          <div className={cn(
            "rounded-full flex items-center justify-center font-bold transition-transform duration-300 hover:scale-105",
            isFirst ? "h-32 w-32 text-2xl" : "h-16 w-16 text-xl bg-gradient-to-br text-white shadow-lg",
            !isFirst && config.gradient
          )}>
            {isFirst ? (
              <DotLottieReact
                src="https://lottie.host/d2c00569-38c4-4910-b5b3-9bea095ff602/uN1szORaiA.lottie"
                loop
                autoplay
                className="w-32 h-32"
              />
            ) : avatar ? (
              <img src={avatar} alt={userName} className="rounded-full w-full h-full object-cover" />
            ) : (
              userName.charAt(0).toUpperCase()
            )}
          </div>
          <h3 className={cn(
            "font-bold text-center",
            isFirst ? "text-2xl" : "text-lg"
          )}>
            {userName}
          </h3>
        </div>

        {/* Métricas */}
        <div className="space-y-3 pt-2">
          {/* Consultoria Líquida */}
          <div className="bg-card/50 backdrop-blur-sm rounded-lg p-4 border border-border/50">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground font-medium">Consultoria Líquida</div>
                <div className={cn(
                  "font-bold",
                  isFirst ? "text-2xl" : "text-xl"
                )}>
                  {consultoriaLiq.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL"
                  })}
                </div>
              </div>
              <TrendingUp className={cn("h-6 w-6", config.textColor)} />
            </div>
          </div>

          {/* Contratos Fechados */}
          <div className="bg-card/50 backdrop-blur-sm rounded-lg p-4 border border-border/50">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground font-medium">Contratos Fechados</div>
                <div className={cn(
                  "font-bold",
                  isFirst ? "text-2xl" : "text-xl"
                )}>
                  {contracts}
                </div>
              </div>
              <div className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center bg-gradient-to-br",
                config.gradient,
                "text-white font-bold"
              )}>
                {contracts}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
