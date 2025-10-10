import type { Meta, StoryObj } from '@storybook/react'
import { Table } from '../components/tables/Table'
import { TableColumn } from '@/types'

const meta: Meta<typeof Table> = {
  title: 'Components/Table',
  component: Table,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    loading: { control: 'boolean' },
    striped: { control: 'boolean' },
    hoverable: { control: 'boolean' },
    emptyMessage: { control: 'text' },
    onSort: { action: 'sorted' },
    onPageChange: { action: 'page changed' },
    onRowClick: { action: 'row clicked' },
  },
}

export default meta
type Story = StoryObj<typeof Table>

// Mock data
const users = [
  { id: '1', name: 'João Silva', email: 'joao@example.com', role: 'Atendente', status: 'Ativo', created: '2024-01-15' },
  { id: '2', name: 'Maria Santos', email: 'maria@example.com', role: 'Calculista', status: 'Ativo', created: '2024-02-20' },
  { id: '3', name: 'Pedro Costa', email: 'pedro@example.com', role: 'Gerente', status: 'Inativo', created: '2024-03-10' },
  { id: '4', name: 'Ana Oliveira', email: 'ana@example.com', role: 'Financeiro', status: 'Ativo', created: '2024-04-05' },
]

const columns: TableColumn<typeof users[0]>[] = [
  {
    key: 'name',
    header: 'Nome',
    sortable: true,
  },
  {
    key: 'email',
    header: 'E-mail',
    sortable: true,
  },
  {
    key: 'role',
    header: 'Função',
    sortable: false,
  },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    render: (value) => (
      <span className={`px-2 py-1 rounded-full text-xs ${
        value === 'Ativo'
          ? 'bg-green-100 text-green-800'
          : 'bg-red-100 text-red-800'
      }`}>
        {value}
      </span>
    ),
  },
  {
    key: 'created',
    header: 'Criado em',
    sortable: true,
    render: (value) => new Date(value).toLocaleDateString('pt-BR'),
  },
]

export const Default: Story = {
  args: {
    data: users,
    columns,
  },
}

export const Loading: Story = {
  args: {
    data: [],
    columns,
    loading: true,
  },
}

export const Empty: Story = {
  args: {
    data: [],
    columns,
    emptyMessage: 'Nenhum usuário encontrado',
  },
}

export const WithPagination: Story = {
  args: {
    data: users,
    columns,
    pagination: {
      page: 1,
      limit: 10,
      total: 45,
      pages: 5,
    },
  },
}

export const NonStriped: Story = {
  args: {
    data: users,
    columns,
    striped: false,
  },
}

export const NonHoverable: Story = {
  args: {
    data: users,
    columns,
    hoverable: false,
  },
}