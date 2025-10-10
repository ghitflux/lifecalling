import { ChartData, ChartType } from '@/types'
import React from 'react'

// Abstract Product - Interface base para todos os charts
export interface ChartComponent {
  render(): React.ReactElement
  getConfig(): ChartConfig
  updateData(data: ChartData): void
}

export interface ChartConfig {
  type: ChartType
  options: {
    responsive?: boolean
    maintainAspectRatio?: boolean
    plugins?: {
      legend?: {
        display?: boolean
        position?: 'top' | 'bottom' | 'left' | 'right'
      }
      title?: {
        display?: boolean
        text?: string
      }
    }
    scales?: {
      y?: {
        beginAtZero?: boolean
        grid?: {
          display?: boolean
        }
      }
      x?: {
        grid?: {
          display?: boolean
        }
      }
    }
  }
}

// Concrete Products - Implementações específicas de cada tipo de chart
export class LineChartComponent implements ChartComponent {
  constructor(private data: ChartData, private config?: Partial<ChartConfig>) {}

  render(): React.ReactElement {
    // Este seria o componente React real que renderiza o gráfico
    // Para demonstração, retornamos um elemento simples
    return React.createElement('div', {
      key: 'line-chart',
      className: 'chart-container line-chart'
    }, `Line Chart: ${this.data.labels.join(', ')}`)
  }

  getConfig(): ChartConfig {
    return {
      type: 'line',
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
          title: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              display: true,
            },
          },
          x: {
            grid: {
              display: false,
            },
          },
        },
        ...this.config?.options,
      },
    }
  }

  updateData(data: ChartData): void {
    this.data = data
  }
}

export class BarChartComponent implements ChartComponent {
  constructor(private data: ChartData, private config?: Partial<ChartConfig>) {}

  render(): React.ReactElement {
    return React.createElement('div', {
      key: 'bar-chart',
      className: 'chart-container bar-chart'
    }, `Bar Chart: ${this.data.labels.join(', ')}`)
  }

  getConfig(): ChartConfig {
    return {
      type: 'bar',
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
          title: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              display: true,
            },
          },
          x: {
            grid: {
              display: false,
            },
          },
        },
        ...this.config?.options,
      },
    }
  }

  updateData(data: ChartData): void {
    this.data = data
  }
}

export class PieChartComponent implements ChartComponent {
  constructor(private data: ChartData, private config?: Partial<ChartConfig>) {}

  render(): React.ReactElement {
    return React.createElement('div', {
      key: 'pie-chart',
      className: 'chart-container pie-chart'
    }, `Pie Chart: ${this.data.labels.join(', ')}`)
  }

  getConfig(): ChartConfig {
    return {
      type: 'pie',
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'right',
          },
          title: {
            display: false,
          },
        },
        ...this.config?.options,
      },
    }
  }

  updateData(data: ChartData): void {
    this.data = data
  }
}

export class DoughnutChartComponent implements ChartComponent {
  constructor(private data: ChartData, private config?: Partial<ChartConfig>) {}

  render(): React.ReactElement {
    return React.createElement('div', {
      key: 'doughnut-chart',
      className: 'chart-container doughnut-chart'
    }, `Doughnut Chart: ${this.data.labels.join(', ')}`)
  }

  getConfig(): ChartConfig {
    return {
      type: 'doughnut',
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
          },
          title: {
            display: false,
          },
        },
        ...this.config?.options,
      },
    }
  }

  updateData(data: ChartData): void {
    this.data = data
  }
}

export class AreaChartComponent implements ChartComponent {
  constructor(private data: ChartData, private config?: Partial<ChartConfig>) {}

  render(): React.ReactElement {
    return React.createElement('div', {
      key: 'area-chart',
      className: 'chart-container area-chart'
    }, `Area Chart: ${this.data.labels.join(', ')}`)
  }

  getConfig(): ChartConfig {
    return {
      type: 'area',
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
          title: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              display: true,
            },
          },
          x: {
            grid: {
              display: false,
            },
          },
        },
        ...this.config?.options,
      },
    }
  }

  updateData(data: ChartData): void {
    this.data = data
  }
}

// Factory Method Pattern - Factory para criar componentes de chart
export class ChartFactory {
  static createChart(
    type: ChartType,
    data: ChartData,
    config?: Partial<ChartConfig>
  ): ChartComponent {
    switch (type) {
      case 'line':
        return new LineChartComponent(data, config)
      case 'bar':
        return new BarChartComponent(data, config)
      case 'pie':
        return new PieChartComponent(data, config)
      case 'doughnut':
        return new DoughnutChartComponent(data, config)
      case 'area':
        return new AreaChartComponent(data, config)
      default:
        throw new Error(`Tipo de gráfico não suportado: ${type}`)
    }
  }

  static getSupportedTypes(): ChartType[] {
    return ['line', 'bar', 'pie', 'doughnut', 'area']
  }

  static getDefaultConfig(type: ChartType): ChartConfig {
    const chart = this.createChart(type, { labels: [], datasets: [] })
    return chart.getConfig()
  }

  static createDashboardChart(type: ChartType, data: ChartData): ChartComponent {
    const dashboardConfig: Partial<ChartConfig> = {
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
          },
          title: {
            display: true,
            text: 'Dashboard Chart',
          },
        },
      },
    }

    return this.createChart(type, data, dashboardConfig)
  }
}

// Utility functions para preparar dados para os charts
export class ChartDataHelper {
  static prepareKPIData(kpis: Array<{ nome: string; valor: number; meta?: number }>): ChartData {
    return {
      labels: kpis.map(kpi => kpi.nome),
      datasets: [
        {
          label: 'Valor Atual',
          data: kpis.map(kpi => kpi.valor),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2,
        },
        {
          label: 'Meta',
          data: kpis.map(kpi => kpi.meta || 0),
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 2,
        },
      ],
    }
  }

  static prepareTimeSeriesData(data: Array<{ date: string; value: number }>): ChartData {
    return {
      labels: data.map(item => new Date(item.date).toLocaleDateString('pt-BR')),
      datasets: [
        {
          label: 'Valores',
          data: data.map(item => item.value),
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          borderColor: 'rgba(99, 102, 241, 1)',
          borderWidth: 2,
        },
      ],
    }
  }

  static prepareDistributionData(data: Array<{ label: string; value: number; color?: string }>): ChartData {
    return {
      labels: data.map(item => item.label),
      datasets: [
        {
          label: 'Distribuição',
          data: data.map(item => item.value),
          backgroundColor: data.map((item, index) =>
            item.color || `hsl(${(index * 360) / data.length}, 70%, 60%)`
          ),
          borderWidth: 1,
        },
      ],
    }
  }
}