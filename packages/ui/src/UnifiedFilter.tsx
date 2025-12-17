"use client";

import React, { useMemo } from 'react';
import { Calendar, Filter } from 'lucide-react';
import { SimpleSelect } from './Select';
import { Button } from './Button';
import { Badge } from './Badge';

export interface UnifiedFilterProps {
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  showClearButton?: boolean;
  onClear?: () => void;
  className?: string;
  label?: string;
}

export function UnifiedFilter({
  selectedMonth,
  onMonthChange,
  showClearButton = true,
  onClear,
  className = "",
  label = "Filtrar por mês:"
}: UnifiedFilterProps) {
  // Gerar meses disponíveis (12 meses do ano atual)
  const availableMonths = useMemo(() => {
    const months = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    for (let month = 0; month < 12; month++) {
      const date = new Date(currentYear, month, 1);
      const value = `${currentYear}-${String(month + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      months.push({ 
        value, 
        label: label.charAt(0).toUpperCase() + label.slice(1) 
      });
    }
    
    return months;
  }, []);

  const selectedMonthLabel = useMemo(() => {
    const month = availableMonths.find(m => m.value === selectedMonth);
    return month?.label || 'Selecione o mês';
  }, [selectedMonth, availableMonths]);

  const handleClear = () => {
    const currentDate = new Date();
    const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    onMonthChange(currentMonth);
    onClear?.();
  };

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <label className="text-sm font-medium text-foreground">
          {label}
        </label>
      </div>
      
      <div className="flex items-center gap-2">
        <SimpleSelect 
          value={selectedMonth} 
          onValueChange={onMonthChange}
          placeholder="Selecione o mês"
          className="w-48"
        >
          {availableMonths.map((month) => (
            <option key={month.value} value={month.value}>
              {month.label}
            </option>
          ))}
        </SimpleSelect>

        {showClearButton && selectedMonth && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            className="h-9"
          >
            <Filter className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      {selectedMonth && (
        <Badge variant="secondary" className="text-xs">
          {selectedMonthLabel}
        </Badge>
      )}
    </div>
  );
}

export default UnifiedFilter;