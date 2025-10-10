'use client'

import React, { useEffect, useRef } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import {
  Chart as ReactChart,
  Bar,
  Line,
  Pie,
  Doughnut,
} from 'react-chartjs-2'
import { ChartData, ChartType } from '@/types'
import { ChartFactory, ChartDataHelper } from '@/lib/patterns/factory/chart-factory'

// Registrar componentes necessários do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export interface ChartComponentProps {
  type: ChartType
  data: ChartData
  title?: string
  height?: number
  className?: string
  options?: any
}

export function ChartComponent({
  type,
  data,
  title,
  height = 300,
  className = '',
  options = {}
}: ChartComponentProps) {
  const chartRef = useRef<any>(null)

  // Usar o Factory Pattern para obter configurações padrão
  const factory = ChartFactory.createChart(type, data)
  const defaultConfig = factory.getConfig()

  // Combinar opções padrão com opções customizadas
  const chartOptions = {
    ...defaultConfig.options,
    ...options,
    plugins: {
      ...defaultConfig.options?.plugins,
      ...options.plugins,
      title: {
        display: !!title,
        text: title,
        ...defaultConfig.options?.plugins?.title,
        ...options.plugins?.title,
      },
    },
  }

  const chartData = {
    ...data,
    datasets: data.datasets.map((dataset, index) => ({
      ...dataset,
      backgroundColor: dataset.backgroundColor || getDefaultColors(type, index, data.datasets.length),
      borderColor: dataset.borderColor || getDefaultBorderColors(type, index, data.datasets.length),
    }))
  }

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy?.()
      }
    }
  }, [])

  const renderChart = () => {
    const commonProps = {
      ref: chartRef,
      data: chartData,
      options: chartOptions,
      height,
    }

    switch (type) {
      case 'bar':
        return <Bar {...commonProps} />
      case 'line':
        return <Line {...commonProps} />
      case 'pie':
        return <Pie {...commonProps} />
      case 'doughnut':
        return <Doughnut {...commonProps} />
      case 'area':
        // Area chart é um line chart com fill
        return (
          <Line
            {...commonProps}
            data={{
              ...chartData,
              datasets: chartData.datasets.map(dataset => ({
                ...dataset,
                fill: true,
                backgroundColor: Array.isArray(dataset.backgroundColor)
                  ? dataset.backgroundColor[0] + '20'
                  : (dataset.backgroundColor as string) + '20',
              }))
            }}
          />
        )
      default:
        return (
          <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
            <p className="text-gray-500">Tipo de gráfico não suportado: {type}</p>
          </div>
        )
    }
  }

  return (
    <div className={`chart-container ${className}`}>
      {renderChart()}
    </div>
  )
}

// Função auxiliar para cores padrão
function getDefaultColors(type: ChartType, index: number, total: number): string | string[] {
  const colors = [
    'rgba(59, 130, 246, 0.8)',   // blue
    'rgba(16, 185, 129, 0.8)',   // green
    'rgba(245, 158, 11, 0.8)',   // amber
    'rgba(239, 68, 68, 0.8)',    // red
    'rgba(139, 92, 246, 0.8)',   // violet
    'rgba(236, 72, 153, 0.8)',   // pink
    'rgba(20, 184, 166, 0.8)',   // teal
    'rgba(251, 146, 60, 0.8)',   // orange
  ]

  if (type === 'pie' || type === 'doughnut') {
    // Para gráficos de pizza, retornar array de cores
    return colors.slice(0, Math.max(total, 8))
  }

  return colors[index % colors.length]
}

function getDefaultBorderColors(type: ChartType, index: number, total: number): string | string[] {
  const borderColors = [
    'rgba(59, 130, 246, 1)',     // blue
    'rgba(16, 185, 129, 1)',     // green
    'rgba(245, 158, 11, 1)',     // amber
    'rgba(239, 68, 68, 1)',      // red
    'rgba(139, 92, 246, 1)',     // violet
    'rgba(236, 72, 153, 1)',     // pink
    'rgba(20, 184, 166, 1)',     // teal
    'rgba(251, 146, 60, 1)',     // orange
  ]

  if (type === 'pie' || type === 'doughnut') {
    return borderColors.slice(0, Math.max(total, 8))
  }

  return borderColors[index % borderColors.length]
}

// Componentes específicos para facilitar o uso
export interface LineChartProps extends Omit<ChartComponentProps, 'type'> {
  showTrend?: boolean
}

export function LineChart({ showTrend = false, ...props }: LineChartProps) {
  return (
    <ChartComponent
      type="line"
      {...props}
      options={{
        tension: 0.4,
        ...props.options,
      }}
    />
  )
}

export interface BarChartProps extends Omit<ChartComponentProps, 'type'> {
  horizontal?: boolean
}

export function BarChart({ horizontal = false, ...props }: BarChartProps) {
  return (
    <ChartComponent
      type="bar"
      {...props}
      options={{
        indexAxis: horizontal ? 'y' : 'x',
        ...props.options,
      }}
    />
  )
}

export interface PieChartProps extends Omit<ChartComponentProps, 'type'> {}

export function PieChart(props: PieChartProps) {
  return <ChartComponent type="pie" {...props} />
}

export interface DoughnutChartProps extends Omit<ChartComponentProps, 'type'> {
  centerText?: string
}

export function DoughnutChart({ centerText, ...props }: DoughnutChartProps) {
  return (
    <ChartComponent
      type="doughnut"
      {...props}
      options={{
        ...props.options,
        plugins: {
          ...props.options?.plugins,
          // Plugin customizado para texto no centro pode ser adicionado aqui
        },
      }}
    />
  )
}

export interface AreaChartProps extends Omit<ChartComponentProps, 'type'> {}

export function AreaChart(props: AreaChartProps) {
  return <ChartComponent type="area" {...props} />
}

// Hook para usar o Factory Pattern com dados dinâmicos
export function useChartFactory() {
  const createKPIChart = (kpis: Array<{ nome: string; valor: number; meta?: number }>, type: ChartType = 'bar') => {
    const data = ChartDataHelper.prepareKPIData(kpis)
    return { type, data }
  }

  const createTimeSeriesChart = (data: Array<{ date: string; value: number }>, type: ChartType = 'line') => {
    const chartData = ChartDataHelper.prepareTimeSeriesData(data)
    return { type, data: chartData }
  }

  const createDistributionChart = (data: Array<{ label: string; value: number; color?: string }>, type: ChartType = 'pie') => {
    const chartData = ChartDataHelper.prepareDistributionData(data)
    return { type, data: chartData }
  }

  return {
    createKPIChart,
    createTimeSeriesChart,
    createDistributionChart,
    ChartFactory,
    ChartDataHelper,
  }
}