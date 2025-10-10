import type { Meta, StoryObj } from '@storybook/react'
import {
  ChartComponent,
  LineChart,
  BarChart,
  PieChart,
  DoughnutChart,
  AreaChart,
  useChartFactory
} from '../components/charts/Chart'
import { ChartData } from '@/types'

const meta: Meta<typeof ChartComponent> = {
  title: 'Components/Charts',
  component: ChartComponent,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof ChartComponent>

// Dados de exemplo
const sampleBarData: ChartData = {
  labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
  datasets: [
    {
      label: 'Vendas 2024',
      data: [12, 19, 3, 5, 2, 3],
    },
    {
      label: 'Vendas 2023',
      data: [10, 15, 8, 7, 6, 4],
    },
  ],
}

const sampleLineData: ChartData = {
  labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
  datasets: [
    {
      label: 'Receita',
      data: [65, 59, 80, 81, 56, 55],
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
    },
  ],
}

const samplePieData: ChartData = {
  labels: ['Aprovados', 'Pendentes', 'Rejeitados'],
  datasets: [
    {
      label: 'Status dos Contratos',
      data: [300, 50, 100],
    },
  ],
}

const kpiData = [
  { nome: 'Vendas', valor: 85, meta: 100 },
  { nome: 'Leads', valor: 120, meta: 100 },
  { nome: 'Conversão', valor: 75, meta: 80 },
  { nome: 'Satisfação', valor: 90, meta: 85 },
]

const timeSeriesData = [
  { date: '2024-01-01', value: 100 },
  { date: '2024-01-02', value: 120 },
  { date: '2024-01-03', value: 115 },
  { date: '2024-01-04', value: 140 },
  { date: '2024-01-05', value: 135 },
  { date: '2024-01-06', value: 160 },
]

// Stories dos componentes básicos
export const BarChartStory: Story = {
  name: 'Bar Chart',
  args: {
    type: 'bar',
    data: sampleBarData,
    title: 'Vendas Mensais',
    height: 300,
  },
}

export const LineChartStory: Story = {
  name: 'Line Chart',
  args: {
    type: 'line',
    data: sampleLineData,
    title: 'Evolução da Receita',
    height: 300,
  },
}

export const PieChartStory: Story = {
  name: 'Pie Chart',
  args: {
    type: 'pie',
    data: samplePieData,
    title: 'Distribuição de Status',
    height: 300,
  },
}

export const DoughnutChartStory: Story = {
  name: 'Doughnut Chart',
  args: {
    type: 'doughnut',
    data: samplePieData,
    title: 'Status em Rosca',
    height: 300,
  },
}

export const AreaChartStory: Story = {
  name: 'Area Chart',
  args: {
    type: 'area',
    data: sampleLineData,
    title: 'Área de Receita',
    height: 300,
  },
}

// Stories usando o Factory Pattern
export const KPIChart = () => {
  const { createKPIChart } = useChartFactory()
  const { type, data } = createKPIChart(kpiData, 'bar')

  return (
    <div style={{ width: '500px', height: '300px' }}>
      <ChartComponent
        type={type}
        data={data}
        title="KPIs vs Metas"
        height={300}
      />
    </div>
  )
}

export const TimeSeriesChart = () => {
  const { createTimeSeriesChart } = useChartFactory()
  const { type, data } = createTimeSeriesChart(timeSeriesData, 'line')

  return (
    <div style={{ width: '500px', height: '300px' }}>
      <ChartComponent
        type={type}
        data={data}
        title="Série Temporal"
        height={300}
      />
    </div>
  )
}

export const DistributionChart = () => {
  const { createDistributionChart } = useChartFactory()
  const distributionData = [
    { label: 'Desktop', value: 60, color: 'rgba(59, 130, 246, 0.8)' },
    { label: 'Mobile', value: 35, color: 'rgba(16, 185, 129, 0.8)' },
    { label: 'Tablet', value: 5, color: 'rgba(245, 158, 11, 0.8)' },
  ]
  const { type, data } = createDistributionChart(distributionData, 'doughnut')

  return (
    <div style={{ width: '400px', height: '300px' }}>
      <ChartComponent
        type={type}
        data={data}
        title="Distribuição por Dispositivo"
        height={300}
      />
    </div>
  )
}

// Stories dos componentes especializados
export const HorizontalBarChart = () => (
  <div style={{ width: '500px', height: '300px' }}>
    <BarChart
      data={sampleBarData}
      title="Vendas Horizontais"
      horizontal={true}
      height={300}
    />
  </div>
)

export const SmoothLineChart = () => (
  <div style={{ width: '500px', height: '300px' }}>
    <LineChart
      data={sampleLineData}
      title="Linha Suavizada"
      height={300}
      options={{
        elements: {
          line: {
            tension: 0.4
          }
        }
      }}
    />
  </div>
)

// Dashboard Grid Example
export const DashboardGrid = () => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '20px',
    width: '1000px',
    height: '600px'
  }}>
    <div>
      <BarChart
        data={sampleBarData}
        title="Vendas Mensais"
        height={250}
      />
    </div>
    <div>
      <LineChart
        data={sampleLineData}
        title="Receita Temporal"
        height={250}
      />
    </div>
    <div>
      <PieChart
        data={samplePieData}
        title="Status Distribuição"
        height={250}
      />
    </div>
    <div>
      <AreaChart
        data={sampleLineData}
        title="Área de Crescimento"
        height={250}
      />
    </div>
  </div>
)

// Interactive Example
export const InteractiveChart = () => {
  const [chartType, setChartType] = React.useState<'bar' | 'line' | 'area'>('bar')

  return (
    <div style={{ width: '600px' }}>
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => setChartType('bar')}
          style={{
            marginRight: '10px',
            padding: '8px 16px',
            backgroundColor: chartType === 'bar' ? '#3B82F6' : '#E5E7EB',
            color: chartType === 'bar' ? 'white' : 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Bar Chart
        </button>
        <button
          onClick={() => setChartType('line')}
          style={{
            marginRight: '10px',
            padding: '8px 16px',
            backgroundColor: chartType === 'line' ? '#3B82F6' : '#E5E7EB',
            color: chartType === 'line' ? 'white' : 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Line Chart
        </button>
        <button
          onClick={() => setChartType('area')}
          style={{
            padding: '8px 16px',
            backgroundColor: chartType === 'area' ? '#3B82F6' : '#E5E7EB',
            color: chartType === 'area' ? 'white' : 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Area Chart
        </button>
      </div>
      <ChartComponent
        type={chartType}
        data={sampleLineData}
        title={`Gráfico ${chartType.charAt(0).toUpperCase() + chartType.slice(1)}`}
        height={300}
      />
    </div>
  )
}

// Adicionar React import para Interactive Example
import React from 'react'