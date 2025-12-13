"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@lifecalling/ui";
import { CheckCircle2, AlertCircle, Clock, TrendingUp, TrendingDown, Eye } from "lucide-react";

interface SLACardsProps {
  withinSLA: number;
  outsideSLA: number;
  totalCases: number;
  percentageWithinSLA: number;
  slaHours?: number;
  isLoading?: boolean;
  onCardClick?: (type: 'within' | 'outside' | 'total') => void;
}

export function SLACards({
  withinSLA,
  outsideSLA,
  totalCases,
  percentageWithinSLA,
  slaHours = 48,
  isLoading = false,
  onCardClick,
}: SLACardsProps) {
  const safeWithinPercentage = Number.isFinite(percentageWithinSLA)
    ? Math.min(Math.max(percentageWithinSLA, 0), 100)
    : 0;
  const outsidePercentage = totalCases > 0
    ? Math.min(Math.max((outsideSLA / totalCases) * 100, 0), 100)
    : 0;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="h-5 bg-muted rounded w-3/4" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/2 mb-2" />
              <div className="h-4 bg-muted rounded w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Card: Casos Dentro do SLA */}
      <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-all">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-5 w-5" />
              Dentro do SLA ({slaHours}h)
            </CardTitle>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCardClick?.('within');
              }}
              className="p-1 hover:bg-green-100 dark:hover:bg-green-900 rounded-full transition-colors"
              title="Ver detalhes"
            >
              <Eye className="h-4 w-4 text-green-600 dark:text-green-400" />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-green-600 dark:text-green-400">
                {withinSLA}
              </span>
              <span className="text-sm text-muted-foreground">casos</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-500 ease-out"
                  style={{ width: `${safeWithinPercentage}%` }}
                />
              </div>
              <span className="font-semibold text-green-600 dark:text-green-400 min-w-[48px] text-right">
                {safeWithinPercentage.toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Casos atendidos dentro do prazo estabelecido
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Card: Casos Fora do SLA */}
      <Card className="border-l-4 border-l-red-500 hover:shadow-lg transition-all">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertCircle className="h-5 w-5" />
              Fora do SLA ({slaHours}h)
            </CardTitle>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCardClick?.('outside');
              }}
              className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded-full transition-colors"
              title="Ver detalhes"
            >
              <Eye className="h-4 w-4 text-red-600 dark:text-red-400" />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-red-600 dark:text-red-400">
                {outsideSLA}
              </span>
              <span className="text-sm text-muted-foreground">casos</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-red-500 transition-all duration-500 ease-out"
                  style={{
                    width: `${outsidePercentage}%`,
                  }}
                />
              </div>
              <span className="font-semibold text-red-600 dark:text-red-400 min-w-[48px] text-right">
                {outsidePercentage.toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Casos que ultrapassaram o prazo estabelecido
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Card: Resumo Total */}
      <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-all">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-700 dark:text-blue-400">
              <Clock className="h-5 w-5" />
              Total de Casos
            </CardTitle>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCardClick?.('total');
              }}
              className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-full transition-colors"
              title="Ver detalhes"
            >
              <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {totalCases}
              </span>
              <span className="text-sm text-muted-foreground">casos</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1">
                {percentageWithinSLA >= 80 ? (
                  <>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-green-600 dark:text-green-400 font-semibold">
                      Excelente
                    </span>
                  </>
                ) : percentageWithinSLA >= 60 ? (
                  <>
                    <TrendingUp className="h-4 w-4 text-amber-500" />
                    <span className="text-amber-600 dark:text-amber-400 font-semibold">
                      Atenção
                    </span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    <span className="text-red-600 dark:text-red-400 font-semibold">
                      Crítico
                    </span>
                  </>
                )}
              </div>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                Meta: 80%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Performance geral do time de atendimento
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
