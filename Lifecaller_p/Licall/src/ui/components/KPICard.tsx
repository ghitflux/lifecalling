import React from 'react'
import { KPIData } from '@/types'
import { Card } from './Card'

export interface KPICardProps {
  kpi: KPIData
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showTrend?: boolean
  showProgress?: boolean
  clickable?: boolean
  onClick?: () => void
}

export function KPICard({
  kpi,
  className = '',
  size = 'md',
  showTrend = true,
  showProgress = true,
  clickable = false,
  onClick,
}: KPICardProps) {
  const formatValue = (value: number, unidade?: string) => {
    if (unidade === '%') {
      return `${value.toFixed(1)}%`
    }
    if (unidade === 'currency') {
      return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    }
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`
    }
    return value.toLocaleString('pt-BR')
  }

  const getProgressPercentage = () => {
    if (!kpi.meta) return 0
    return Math.min((kpi.valor / kpi.meta) * 100, 100)
  }

  const getTrendIcon = () => {
    if (!kpi.tendencia || !showTrend) return null

    const iconClass = "w-4 h-4"

    switch (kpi.tendencia) {
      case 'up':
        return (
          <svg className={`${iconClass} text-green-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        )
      case 'down':
        return (
          <svg className={`${iconClass} text-red-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
          </svg>
        )
      case 'stable':
        return (
          <svg className={`${iconClass} text-gray-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
          </svg>
        )
      default:
        return null
    }
  }

  const getCategoryColor = (categoria: string) => {
    const colors = {
      'vendas': 'text-blue-600',
      'financeiro': 'text-green-600',
      'operacional': 'text-purple-600',
      'qualidade': 'text-orange-600',
      'performance': 'text-indigo-600',
    }

    return colors[categoria.toLowerCase() as keyof typeof colors] || 'text-gray-600'
  }

  const getCategoryIcon = (categoria: string) => {
    const iconClass = "w-5 h-5"

    switch (categoria.toLowerCase()) {
      case 'vendas':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        )
      case 'financeiro':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        )
      case 'operacional':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )
      case 'qualidade':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'performance':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )
      default:
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        )
    }
  }

  const sizeClasses = {
    sm: {
      card: 'p-4',
      title: 'text-sm',
      value: 'text-xl',
      period: 'text-xs',
    },
    md: {
      card: 'p-6',
      title: 'text-base',
      value: 'text-3xl',
      period: 'text-sm',
    },
    lg: {
      card: 'p-8',
      title: 'text-lg',
      value: 'text-4xl',
      period: 'text-base',
    },
  }

  const currentSize = sizeClasses[size]

  return (
    <Card
      className={`
        ${currentSize.card} transition-all duration-200
        ${clickable ? 'hover:shadow-lg cursor-pointer transform hover:-translate-y-1' : ''}
        ${className}
      `}
      onClick={clickable ? onClick : undefined}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center space-x-2 mb-2">
            <div className={getCategoryColor(kpi.categoria)}>
              {getCategoryIcon(kpi.categoria)}
            </div>
            <span className={`font-medium text-gray-900 ${currentSize.title}`}>
              {kpi.nome}
            </span>
          </div>

          {/* Value */}
          <div className="flex items-baseline space-x-2">
            <span className={`font-bold text-gray-900 ${currentSize.value}`}>
              {formatValue(kpi.valor, kpi.unidade)}
            </span>
            {getTrendIcon()}
          </div>

          {/* Period */}
          <p className={`text-gray-500 mt-1 ${currentSize.period}`}>
            {kpi.periodo}
          </p>
        </div>

        {/* Percentage if available */}
        {kpi.percentual && (
          <div className="text-right">
            <span className={`
              font-semibold text-sm px-2 py-1 rounded-full
              ${kpi.percentual >= 0
                ? 'text-green-700 bg-green-100'
                : 'text-red-700 bg-red-100'
              }
            `}>
              {kpi.percentual > 0 ? '+' : ''}{kpi.percentual.toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {showProgress && kpi.meta && (
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Meta: {formatValue(kpi.meta, kpi.unidade)}</span>
            <span>{getProgressPercentage().toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                getProgressPercentage() >= 100
                  ? 'bg-green-500'
                  : getProgressPercentage() >= 80
                    ? 'bg-yellow-500'
                    : 'bg-primary-500'
              }`}
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>
      )}
    </Card>
  )
}

// Componente para grid de KPIs
export interface KPIGridProps {
  kpis: KPIData[]
  className?: string
  cardSize?: 'sm' | 'md' | 'lg'
  columns?: 1 | 2 | 3 | 4
  showTrends?: boolean
  showProgress?: boolean
  onKPIClick?: (kpi: KPIData) => void
}

export function KPIGrid({
  kpis,
  className = '',
  cardSize = 'md',
  columns = 3,
  showTrends = true,
  showProgress = true,
  onKPIClick,
}: KPIGridProps) {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }

  if (kpis.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p>Nenhum KPI disponível</p>
      </div>
    )
  }

  return (
    <div className={`grid ${gridClasses[columns]} gap-6 ${className}`}>
      {kpis.map((kpi) => (
        <KPICard
          key={kpi.id}
          kpi={kpi}
          size={cardSize}
          showTrend={showTrends}
          showProgress={showProgress}
          clickable={!!onKPIClick}
          onClick={onKPIClick ? () => onKPIClick(kpi) : undefined}
        />
      ))}
    </div>
  )
}