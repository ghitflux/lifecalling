import React from 'react'
import { Atendimento, User } from '@prisma/client'
import { Card } from './Card'
import { StatusBadge } from './StatusBadge'
import { Button } from './Button'

export interface QueueCardProps {
  atendimento: Atendimento & {
    assignee?: User | null
    lockOwner?: User | null
  }
  actions?: React.ReactNode
  className?: string
}

export function QueueCard({ atendimento, actions, className }: QueueCardProps) {
  const formatDate = (date: Date | string) => {
    const d = new Date(date)
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const calcResult = atendimento.calcResult as any

  return (
    <Card className={`${className}`} hoverable>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Atendimento #{atendimento.id.slice(-8)}
            </h3>
            <p className="text-sm text-gray-500">
              Criado em {formatDate(atendimento.createdAt)}
            </p>
          </div>
          <StatusBadge status={atendimento.status} />
        </div>

        {/* Assignee Info */}
        {atendimento.assignee && (
          <div className="flex items-center text-sm text-gray-600">
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            Responsável: {atendimento.assignee.name}
          </div>
        )}

        {/* Lock Info */}
        {atendimento.lockActive && atendimento.lockOwner && (
          <div className="flex items-center text-sm text-orange-600 bg-orange-50 p-2 rounded-md">
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            Bloqueado por: {atendimento.lockOwner.name}
            {atendimento.lockStartedAt && (
              <span className="ml-2 text-xs">
                desde {formatDate(atendimento.lockStartedAt)}
              </span>
            )}
          </div>
        )}

        {/* Calc Result */}
        {calcResult && (
          <div className="bg-gray-50 p-3 rounded-md">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Resultado do Cálculo
            </h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div>Status: {calcResult.aprovado ? 'Aprovado' : 'Reprovado'}</div>
              {calcResult.valor_liberado && (
                <div>
                  Valor Liberado: R$ {calcResult.valor_liberado.toLocaleString('pt-BR')}
                </div>
              )}
              {calcResult.parcela_total && (
                <div>
                  Parcela Total: R$ {calcResult.parcela_total.toLocaleString('pt-BR')}
                </div>
              )}
              {calcResult.coeficiente && (
                <div>Coeficiente: {calcResult.coeficiente}</div>
              )}
              {calcResult.observacoes && (
                <div>Observações: {calcResult.observacoes}</div>
              )}
              {calcResult.motivo && (
                <div className="text-red-600">Motivo: {calcResult.motivo}</div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        {actions && <div className="flex gap-2 pt-2 border-t">{actions}</div>}
      </div>
    </Card>
  )
}