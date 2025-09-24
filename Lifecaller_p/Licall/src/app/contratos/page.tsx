'use client'

import React, { useState, useEffect } from 'react'
import { TableColumn, PaginationInfo } from '@/types'
import { Table } from '@/ui/components/tables/Table'
import { Button } from '@/ui/components/Button'
import { Card } from '@/ui/components/Card'
import { StatusBadge } from '@/ui/components/StatusBadge'
import { getContratos, getContratosStats } from '../actions/contratos'
import Link from 'next/link'

interface Contrato {
  id: string
  valorAprovado: number
  parcelaMensal: number
  prazoMeses: number
  taxaJuros: number
  coeficiente: number
  status: string
  dataEfetivacao?: string
  observacoes?: string
  createdAt: string
  updatedAt: string
  atendimento: {
    id: string
    status: string
    cliente: {
      id: string
      nome: string
      cpf: string
      telefone: string
    }
  }
  createdBy: {
    id: string
    name: string
  }
  updatedBy?: {
    id: string
    name: string
  }
  _count: {
    anexos: number
  }
}

interface ContratosResponse {
  contratos: Contrato[]
  pagination: PaginationInfo
}

interface ContratosStats {
  total: number
  aguardandoComprovantes: number
  comprovantesAnexados: number
  efetivados: number
  cancelados: number
  valorTotalEfetivado: number
}

export default function ContratosPage() {
  const [data, setData] = useState<ContratosResponse>({
    contratos: [],
    pagination: { page: 1, limit: 10, total: 0, pages: 0 }
  })
  const [stats, setStats] = useState<ContratosStats>({
    total: 0,
    aguardandoComprovantes: 0,
    comprovantesAnexados: 0,
    efetivados: 0,
    cancelados: 0,
    valorTotalEfetivado: 0
  })
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const getStatusColor = (status: string) => {
    const statusMap: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
      'AGUARDANDO_COMPROVANTES': 'warning',
      'COMPROVANTES_ANEXADOS': 'info',
      'EFETIVADO': 'success',
      'CANCELADO': 'error'
    }
    return statusMap[status] || 'info'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'AGUARDANDO_COMPROVANTES': 'Aguardando Comprovantes',
      'COMPROVANTES_ANEXADOS': 'Comprovantes Anexados',
      'EFETIVADO': 'Efetivado',
      'CANCELADO': 'Cancelado'
    }
    return labels[status] || status
  }

  const columns: TableColumn<Contrato>[] = [
    {
      key: 'id',
      header: 'ID',
      render: (value, row) => (
        <div>
          <Link
            href={`/contratos/${value}`}
            className="text-primary-600 hover:text-primary-800 font-mono text-sm"
          >
            {value.slice(-8)}
          </Link>
        </div>
      ),
    },
    {
      key: 'atendimento',
      header: 'Cliente',
      render: (value) => (
        <div>
          <Link
            href={`/clientes/${value.cliente.id}`}
            className="text-primary-600 hover:text-primary-800 font-medium"
          >
            {value.cliente.nome}
          </Link>
          <div className="text-sm text-gray-500">{value.cliente.cpf}</div>
        </div>
      ),
    },
    {
      key: 'valorAprovado',
      header: 'Valor Aprovado',
      sortable: true,
      render: (value) => (
        <span className="font-medium text-gray-900">
          {new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(value)}
        </span>
      ),
    },
    {
      key: 'parcelaMensal',
      header: 'Parcela',
      render: (value, row) => (
        <div>
          <span className="text-gray-900">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(value)}
          </span>
          <div className="text-sm text-gray-500">{row.prazoMeses}x</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => (
        <StatusBadge
          status={getStatusLabel(value)}
          variant={getStatusColor(value)}
        />
      ),
    },
    {
      key: '_count',
      header: 'Anexos',
      render: (value) => (
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {value.anexos}
          </span>
          {value.anexos > 0 && (
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
        </div>
      ),
    },
    {
      key: 'dataEfetivacao',
      header: 'Data Efetivação',
      render: (value) => (
        <span className="text-gray-600">
          {value ? new Date(value).toLocaleDateString('pt-BR') : '-'}
        </span>
      ),
    },
    {
      key: 'createdBy',
      header: 'Criado por',
      render: (value) => (
        <span className="text-gray-600 text-sm">{value.name}</span>
      ),
    },
  ]

  const loadContratos = async (page: number, search?: string, status?: string) => {
    setLoading(true)
    try {
      const response = await getContratos({
        page,
        limit: 10,
        search: search || undefined,
        status: status || undefined,
        orderBy: 'createdAt',
        orderDir: 'desc'
      })
      setData(response)
    } catch (error) {
      console.error('Erro ao carregar contratos:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    setStatsLoading(true)
    try {
      const response = await getContratosStats()
      setStats(response)
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    } finally {
      setStatsLoading(false)
    }
  }

  useEffect(() => {
    loadContratos(currentPage, searchTerm, statusFilter)
  }, [currentPage])

  useEffect(() => {
    loadStats()
  }, [])

  const handleSearch = () => {
    setCurrentPage(1)
    loadContratos(1, searchTerm, statusFilter)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status)
    setCurrentPage(1)
    loadContratos(1, searchTerm, status)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Contratos</h1>
              <p className="mt-2 text-gray-600">
                Gerencie os contratos e anexos do sistema Licall
              </p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Exportar
              </Button>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statsLoading ? '-' : stats.total}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Aguardando</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statsLoading ? '-' : stats.aguardandoComprovantes}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Anexados</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statsLoading ? '-' : stats.comprovantesAnexados}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Efetivados</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statsLoading ? '-' : stats.efetivados}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Valor Total</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statsLoading ? '-' : new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                      maximumFractionDigits: 0
                    }).format(stats.valorTotalEfetivado)}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Filtros</h3>
              <Button
                variant="ghost"
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('')
                  setCurrentPage(1)
                  loadContratos(1)
                }}
              >
                Limpar Filtros
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Busca */}
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="search"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Cliente ou ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Filtro de Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleStatusFilter('')}
                    className={`px-3 py-1 text-sm rounded-full border ${
                      statusFilter === ''
                        ? 'bg-primary-100 text-primary-700 border-primary-200'
                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Todos
                  </button>
                  {[
                    { value: 'AGUARDANDO_COMPROVANTES', label: 'Aguardando', color: 'yellow' },
                    { value: 'COMPROVANTES_ANEXADOS', label: 'Anexados', color: 'purple' },
                    { value: 'EFETIVADO', label: 'Efetivados', color: 'green' },
                    { value: 'CANCELADO', label: 'Cancelados', color: 'red' }
                  ].map((status) => (
                    <button
                      key={status.value}
                      onClick={() => handleStatusFilter(status.value)}
                      className={`px-3 py-1 text-sm rounded-full border ${
                        statusFilter === status.value
                          ? `bg-${status.color}-100 text-${status.color}-700 border-${status.color}-200`
                          : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ações */}
              <div className="lg:col-span-2 flex items-end space-x-2">
                <Button variant="outline" onClick={handleSearch}>
                  Aplicar Filtros
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Tabela */}
        <Card>
          <Table
            data={data.contratos}
            columns={columns}
            pagination={data.pagination}
            onPageChange={handlePageChange}
            loading={loading}
            emptyMessage="Nenhum contrato encontrado"
            className="rounded-lg"
          />
        </Card>
      </div>
    </div>
  )
}