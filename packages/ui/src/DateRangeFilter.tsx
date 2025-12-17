"use client";

import React, { useState, useMemo } from 'react';
import { Calendar, Filter, X } from 'lucide-react';
import { Button } from './Button';
import { Badge } from './Badge';
import { Input } from './Input';
import { cn } from './lib/utils';

export interface DateRangeFilterProps {
  startDate?: string;
  endDate?: string;
  onDateRangeChange: (startDate: string, endDate: string) => void;
  onClear?: () => void;
  className?: string;
  label?: string;
}

export function DateRangeFilter({
  startDate = '',
  endDate = '',
  onDateRangeChange,
  onClear,
  className = "",
  label = "Período personalizado:"
}: DateRangeFilterProps) {
  const [localStartDate, setLocalStartDate] = useState(startDate);
  const [localEndDate, setLocalEndDate] = useState(endDate);

  const hasDateRange = localStartDate || localEndDate;

  const formatDateLabel = (start: string, end: string) => {
    if (!start && !end) return '';
    if (start && end) {
      const startFormatted = new Date(start).toLocaleDateString('pt-BR');
      const endFormatted = new Date(end).toLocaleDateString('pt-BR');
      return `${startFormatted} - ${endFormatted}`;
    }
    if (start) {
      return `A partir de ${new Date(start).toLocaleDateString('pt-BR')}`;
    }
    if (end) {
      return `Até ${new Date(end).toLocaleDateString('pt-BR')}`;
    }
    return '';
  };

  const handleStartDateChange = (date: string) => {
    setLocalStartDate(date);
    onDateRangeChange(date, localEndDate);
  };

  const handleEndDateChange = (date: string) => {
    setLocalEndDate(date);
    onDateRangeChange(localStartDate, date);
  };

  const handleClear = () => {
    setLocalStartDate('');
    setLocalEndDate('');
    onDateRangeChange('', '');
    onClear?.();
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <label className="text-sm font-medium text-foreground">
          {label}
        </label>
      </div>
      
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={localStartDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
            placeholder="Data início"
            className="w-40"
          />
          <span className="text-muted-foreground text-sm">até</span>
          <Input
            type="date"
            value={localEndDate}
            onChange={(e) => handleEndDateChange(e.target.value)}
            placeholder="Data fim"
            className="w-40"
          />
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

      {hasDateRange && (
        <Badge variant="secondary" className="text-xs w-fit">
          {formatDateLabel(localStartDate, localEndDate)}
        </Badge>
      )}
    </div>
  );
}

export default DateRangeFilter;