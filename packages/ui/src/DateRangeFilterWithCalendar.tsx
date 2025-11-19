"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { Calendar } from "@heroui/react";
import { Button } from './Button';
import { cn } from './lib/utils';
import { parseDate } from "@internationalized/date";

export interface DateRangeFilterWithCalendarProps {
  startDate?: string;
  endDate?: string;
  onDateRangeChange: (startDate: string, endDate: string) => void;
  onClear?: () => void;
  className?: string;
  label?: string;
}

export function DateRangeFilterWithCalendar({
  startDate = '',
  endDate = '',
  onDateRangeChange,
  onClear,
  className = "",
  label = "Período personalizado:"
}: DateRangeFilterWithCalendarProps) {
  const [localStartDate, setLocalStartDate] = useState(startDate);
  const [localEndDate, setLocalEndDate] = useState(endDate);
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);

  const startCalendarRef = useRef<HTMLDivElement>(null);
  const endCalendarRef = useRef<HTMLDivElement>(null);
  const startButtonRef = useRef<HTMLButtonElement>(null);
  const endButtonRef = useRef<HTMLButtonElement>(null);

  const hasDateRange = localStartDate || localEndDate;

  // ✅ NOVO: Estilo CSS para o calendar (diferencia datas de outros meses)
  const calendarStyle = `
    .date-range-filter-calendar [role="button"][aria-selected="false"] {
      color: var(--muted-foreground);
    }

    .date-range-filter-calendar [role="button"][aria-disabled="true"] {
      opacity: 0.4;
      color: var(--muted-foreground);
    }

    .date-range-filter-calendar [role="button"][aria-selected="true"] {
      font-weight: 600;
      background: var(--primary);
      color: white;
      border-radius: 4px;
    }

    .date-range-filter-calendar [role="button"]:hover:not([aria-disabled="true"]) {
      background: var(--primary);
      opacity: 0.8;
      color: white;
    }
  `;

  // ✅ NOVO: Handler para fechar calendários ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      // Fechar calendário de início se clicar fora dele
      if (startCalendarRef.current && !startCalendarRef.current.contains(target) &&
          startButtonRef.current && !startButtonRef.current.contains(target)) {
        setShowStartCalendar(false);
      }

      // Fechar calendário de fim se clicar fora dele
      if (endCalendarRef.current && !endCalendarRef.current.contains(target) &&
          endButtonRef.current && !endButtonRef.current.contains(target)) {
        setShowEndCalendar(false);
      }
    }

    if (showStartCalendar || showEndCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showStartCalendar, showEndCalendar]);

  const formatDateForDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  // ✅ NOVO: Converter CalendarDate do HeroUI para ISO string (YYYY-MM-DD)
  const convertCalendarDateToISO = (calendarDate: any): string => {
    if (!calendarDate) return '';

    // Se já é string, retornar como está
    if (typeof calendarDate === 'string') {
      return calendarDate;
    }

    // CalendarDate tem propriedades: year, month, day
    if (calendarDate.year && calendarDate.month && calendarDate.day) {
      const year = calendarDate.year;
      const month = String(calendarDate.month).padStart(2, '0');
      const day = String(calendarDate.day).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    // Fallback: tentar usar toString() do objeto
    const str = calendarDate.toString?.();
    if (str && str.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return str;
    }

    return '';
  };

  const handleStartDateChange = (date: any) => {
    // ✅ CORRIGIDO: Converter CalendarDate corretamente para YYYY-MM-DD
    const dateStr = convertCalendarDateToISO(date);
    if (dateStr) {
      setLocalStartDate(dateStr);
      onDateRangeChange(dateStr, localEndDate);
    }
    setShowStartCalendar(false);
  };

  const handleEndDateChange = (date: any) => {
    // ✅ CORRIGIDO: Converter CalendarDate corretamente para YYYY-MM-DD
    const dateStr = convertCalendarDateToISO(date);
    if (dateStr) {
      setLocalEndDate(dateStr);
      onDateRangeChange(localStartDate, dateStr);
    }
    setShowEndCalendar(false);
  };

  const handleClear = () => {
    setLocalStartDate('');
    setLocalEndDate('');
    onDateRangeChange('', '');
    setShowStartCalendar(false);
    setShowEndCalendar(false);
    onClear?.();
  };

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* ✅ NOVO: Injetar estilos CSS do calendário */}
      <style>{calendarStyle}</style>

      <div className="flex items-center gap-2">
        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
        <label className="text-sm font-medium text-foreground">
          {label}
        </label>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        {/* Calendário de Data Inicial */}
        <div className="relative">
          <Button
            ref={startButtonRef}
            variant="outline"
            size="sm"
            onClick={() => setShowStartCalendar(!showStartCalendar)}
            className={cn(
              "w-40 justify-start text-left transition-all duration-200",
              showStartCalendar && "bg-blue-500/10 border-blue-500 text-blue-600"
            )}
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            <span className={cn(
              "truncate",
              localStartDate && "font-semibold text-foreground"
            )}>
              {localStartDate ? formatDateForDisplay(localStartDate) : 'Data início'}
            </span>
          </Button>

          {showStartCalendar && (
            <div
              ref={startCalendarRef}
              className="absolute z-50 mt-2 bg-card border border-blue-500/50 rounded-lg shadow-2xl p-4 min-w-max"
            >
              <div className="mb-4 text-xs font-semibold text-blue-600 text-center uppercase tracking-wide">
                Selecione Data de Início
              </div>
              <div className="date-range-filter-calendar">
                <Calendar
                  value={localStartDate ? parseDate(localStartDate) : undefined}
                  onChange={handleStartDateChange}
                  aria-label="Calendário de data inicial"
                />
              </div>
            </div>
          )}
        </div>

        <span className="text-muted-foreground text-sm font-semibold">até</span>

        {/* Calendário de Data Final */}
        <div className="relative">
          <Button
            ref={endButtonRef}
            variant="outline"
            size="sm"
            onClick={() => setShowEndCalendar(!showEndCalendar)}
            className={cn(
              "w-40 justify-start text-left transition-all duration-200",
              showEndCalendar && "bg-green-500/10 border-green-500 text-green-600"
            )}
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            <span className={cn(
              "truncate",
              localEndDate && "font-semibold text-foreground"
            )}>
              {localEndDate ? formatDateForDisplay(localEndDate) : 'Data fim'}
            </span>
          </Button>

          {showEndCalendar && (
            <div
              ref={endCalendarRef}
              className="absolute z-50 mt-2 bg-card border border-green-500/50 rounded-lg shadow-2xl p-4 min-w-max"
            >
              <div className="mb-4 text-xs font-semibold text-green-600 text-center uppercase tracking-wide">
                Selecione Data de Término
              </div>
              <div className="date-range-filter-calendar">
                <Calendar
                  value={localEndDate ? parseDate(localEndDate) : undefined}
                  onChange={handleEndDateChange}
                  aria-label="Calendário de data final"
                />
              </div>
            </div>
          )}
        </div>

        {hasDateRange && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            className="h-9"
          >
            <X className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>
    </div>
  );
}

export default DateRangeFilterWithCalendar;
