import type { Meta, StoryObj } from '@storybook/react'
import { KPICard, KPIGrid } from '../components/KPICard'
import { KPIData } from '@/types'

const meta: Meta<typeof KPICard> = {
  title: 'Components/KPICard',
  component: KPICard,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    size: { control: { type: 'select', options: ['sm', 'md', 'lg'] } },
    showTrend: { control: 'boolean' },
    showProgress: { control: 'boolean' },
    clickable: { control: 'boolean' },
    onClick: { action: 'clicked' },
  },
}

export default meta
type Story = StoryObj<typeof KPICard>

// Mock KPI data
const vendasKPI: KPIData = {
  id: '1',
  nome: 'Vendas Mensais',
  valor: 125000,
  meta: 150000,
  unidade: 'currency',
  categoria: 'vendas',
  periodo: 'Dezembro 2024',
  percentual: 15.5,
  tendencia: 'up',
}

const atendimentosKPI: KPIData = {
  id: '2',
  nome: 'Atendimentos Concluídos',
  valor: 342,
  meta: 400,
  unidade: '',
  categoria: 'operacional',
  periodo: 'Últimos 30 dias',
  percentual: -2.3,
  tendencia: 'down',
}

const conversaoKPI: KPIData = {
  id: '3',
  nome: 'Taxa de Conversão',
  valor: 68.5,
  meta: 70,
  unidade: '%',
  categoria: 'qualidade',
  periodo: 'Este mês',
  percentual: 0,
  tendencia: 'stable',
}

const performanceKPI: KPIData = {
  id: '4',
  nome: 'Performance do Sistema',
  valor: 99.9,
  unidade: '%',
  categoria: 'performance',
  periodo: 'Uptime - 24h',
  tendencia: 'up',
}

const financeiroKPI: KPIData = {
  id: '5',
  nome: 'Contratos Ativos',
  valor: 1250000,
  meta: 1000000,
  unidade: 'currency',
  categoria: 'financeiro',
  periodo: 'Total Atual',
  percentual: 25,
  tendencia: 'up',
}

const kpiList: KPIData[] = [
  vendasKPI,
  atendimentosKPI,
  conversaoKPI,
  performanceKPI,
  financeiroKPI,
]

export const VendasCard: Story = {
  args: {
    kpi: vendasKPI,
    showTrend: true,
    showProgress: true,
  },
}

export const AtendimentosCard: Story = {
  args: {
    kpi: atendimentosKPI,
    showTrend: true,
    showProgress: true,
  },
}

export const ConversaoCard: Story = {
  args: {
    kpi: conversaoKPI,
    showTrend: true,
    showProgress: true,
  },
}

export const WithoutProgress: Story = {
  args: {
    kpi: performanceKPI,
    showTrend: true,
    showProgress: false,
  },
}

export const WithoutTrend: Story = {
  args: {
    kpi: vendasKPI,
    showTrend: false,
    showProgress: true,
  },
}

export const SmallSize: Story = {
  args: {
    kpi: vendasKPI,
    size: 'sm',
  },
}

export const LargeSize: Story = {
  args: {
    kpi: vendasKPI,
    size: 'lg',
  },
}

export const Clickable: Story = {
  args: {
    kpi: vendasKPI,
    clickable: true,
  },
}

export const FinanceiroCard: Story = {
  args: {
    kpi: financeiroKPI,
    showTrend: true,
    showProgress: true,
  },
}

// KPI Grid Stories
const GridMeta: Meta<typeof KPIGrid> = {
  title: 'Components/KPIGrid',
  component: KPIGrid,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    cardSize: { control: { type: 'select', options: ['sm', 'md', 'lg'] } },
    columns: { control: { type: 'select', options: [1, 2, 3, 4] } },
    showTrends: { control: 'boolean' },
    showProgress: { control: 'boolean' },
    onKPIClick: { action: 'KPI clicked' },
  },
}

type GridStory = StoryObj<typeof KPIGrid>

export const KPIDashboard: GridStory = {
  render: (args) => <KPIGrid {...args} />,
  args: {
    kpis: kpiList,
    columns: 3,
    cardSize: 'md',
    showTrends: true,
    showProgress: true,
  },
}

export const CompactGrid: GridStory = {
  render: (args) => <KPIGrid {...args} />,
  args: {
    kpis: kpiList,
    columns: 4,
    cardSize: 'sm',
    showTrends: true,
    showProgress: false,
  },
}

export const LargeGrid: GridStory = {
  render: (args) => <KPIGrid {...args} />,
  args: {
    kpis: kpiList.slice(0, 3),
    columns: 3,
    cardSize: 'lg',
    showTrends: true,
    showProgress: true,
  },
}

export const TwoColumns: GridStory = {
  render: (args) => <KPIGrid {...args} />,
  args: {
    kpis: kpiList.slice(0, 4),
    columns: 2,
    cardSize: 'md',
    showTrends: true,
    showProgress: true,
  },
}

export const SingleColumn: GridStory = {
  render: (args) => <KPIGrid {...args} />,
  args: {
    kpis: kpiList.slice(0, 3),
    columns: 1,
    cardSize: 'lg',
    showTrends: true,
    showProgress: true,
  },
}

export const EmptyGrid: GridStory = {
  render: (args) => <KPIGrid {...args} />,
  args: {
    kpis: [],
    columns: 3,
    cardSize: 'md',
    showTrends: true,
    showProgress: true,
  },
}