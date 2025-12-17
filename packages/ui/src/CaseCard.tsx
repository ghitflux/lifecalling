"use client";

import React from "react";
import { StatusBadge, type Status } from "./StatusBadge";
import { Button } from "./Button";
import { Card, CardContent } from "./Card";

export interface CaseCardProps {
  item: {
    id: number;
    status: string;
    assigned_to?: string;
    client: {
      name: string;
      cpf: string;
      matricula: string;
    };
  };
  onAssign?: (id: number) => void;
  href: string;
}

export function CaseCard({ item, onAssign, href }: CaseCardProps) {
  const isAssigned = !!item.assigned_to;

  return (
    <Card className={`p-4 space-y-3 ${isAssigned ? 'bg-muted/30 border-muted' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="font-semibold text-foreground">{item.client.name}</div>
        <StatusBadge status={item.status as Status} />
      </div>
      <div className="text-sm text-muted-foreground space-y-1">
        <div>CPF: {item.client.cpf}</div>
        <div>Matrícula: {item.client.matricula}</div>
        {item.assigned_to && (
          <div className="text-orange-600 font-medium">
            Atribuído a: {item.assigned_to}
          </div>
        )}
      </div>
      <div className="flex gap-3">
        <a href={href} className="flex-1">
          <Button variant="outline" className="w-full">
            Ver Detalhes
          </Button>
        </a>
        {onAssign && !isAssigned && (
          <Button onClick={() => onAssign(item.id)}>
            Pegar
          </Button>
        )}
        {isAssigned && (
          <Button variant="secondary" disabled>
            Atribuído
          </Button>
        )}
      </div>
    </Card>
  );
}