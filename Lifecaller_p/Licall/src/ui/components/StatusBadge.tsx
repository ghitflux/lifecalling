import React from 'react'
import { AtendimentoStatus } from '@prisma/client'
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/state'

export interface StatusBadgeProps {
  status: AtendimentoStatus
  className?: string
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const baseClasses = [
    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
    'border',
  ]

  const statusClass = STATUS_COLORS[status]

  const classes = [...baseClasses, statusClass, className].join(' ')

  return <span className={classes}>{STATUS_LABELS[status]}</span>
}