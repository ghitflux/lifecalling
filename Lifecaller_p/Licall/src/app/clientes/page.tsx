'use client'

import React, { useState, useEffect } from 'react'
import { TableColumn, PaginationInfo } from '@/types'
import { Table } from '@/ui/components/tables/Table'
import { Button } from '@/ui/components/Button'
import { Card } from '@/ui/components/Card'
import { getClientes } from '../actions/clientes'
import Link from 'next/link'

interface Cliente {
  id: string
  nome: string
  cpf: string
  telefone: string
  email?: string
  renda?: number
  profissao?: string
  createdAt: string
  clienteBancos: Array<{
    principal: boolean
    banco: {
      nome: string
      codigo: string
    }
  }>
  _count: {
    atendimentos: number
  }
}

interface ClienteListResponse {
  clientes: Cliente[]
  pagination: PaginationInfo
}

export default function ClientesPage() {
  const [data, setData] = useState<ClienteListResponse>({
    clientes: [],
    pagination: { page: 1, limit: 10, total: 0, pages: 0 }
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const columns: TableColumn<Cliente>[] = [
    {
      key: 'nome',
      header: 'Nome',
      sortable: true,
      render: (value, row) => (
        <div>
          <Link
            href={`/clientes/${row.id}`}
            className="text-primary-600 hover:text-primary-800 font-medium"
          >
            {value}
          </Link>
          <div className="text-sm text-gray-500">{row.cpf}</div>
        </div>
      ),
    },
    {
      key: 'telefone',
      header: 'Telefone',
      render: (value) => (
        <span className="text-gray-900">{value}</span>
      ),
    },
    {
      key: 'email',
      header: 'E-mail',
      render: (value) => (
        <span className="text-gray-600">{value || '-'}</span>
      ),
    },
    {
      key: 'renda',
      header: 'Renda',
      render: (value) => (
        <span className="text-gray-900">
          {value ? new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(value) : '-'}
        </span>
      ),
    },
    {
      key: 'profissao',
      header: 'Profissão',
      render: (value) => (
        <span className="text-gray-600">{value || '-'}</span>
      ),
    },
    {
      key: 'clienteBancos',
      header: 'Banco Principal',
      render: (value) => {
        const bancoPrincipal = value.find((cb: any) => cb.principal)
        return bancoPrincipal ? (
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {bancoPrincipal.banco.codigo}
            </span>
            <span className="text-sm text-gray-600">{bancoPrincipal.banco.nome}</span>
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        )
      },
    },
    {
      key: '_count',
      header: 'Atendimentos',
      render: (value) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {value.atendimentos}
        </span>
      ),
    },
  ]

  const loadClientes = async (page: number, search?: string) => {
    setLoading(true)
    try {
      const response = await getClientes({
        page,
        limit: 10,
        search: search || undefined,
        orderBy: 'nome',
        orderDir: 'asc'
      })
      setData(response)
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClientes(currentPage, searchTerm)
  }, [currentPage])

  const handleSearch = () => {
    setCurrentPage(1)
    loadClientes(1, searchTerm)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
              <p className="mt-2 text-gray-600">
                Gerencie os clientes do sistema Licall
              </p>
            </div>
            <Link href="/clientes/novo">
              <Button variant="primary" size="md">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Novo Cliente
              </Button>
            </Link>
          </div>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <div className="p-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar cliente
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="search"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Nome, CPF ou e-mail..."
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
              <div className="flex space-x-2">
                <Button variant="outline" onClick={handleSearch}>
                  Buscar
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSearchTerm('')
                    setCurrentPage(1)
                    loadClientes(1)
                  }}
                >
                  Limpar
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Estatísticas */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total de Clientes</p>
                    <p className="text-2xl font-bold text-gray-900">{data.pagination.total}</p>
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
                    <p className="text-sm font-medium text-gray-500">Com Conta Principal</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {data.clientes.filter(c => c.clienteBancos.some(cb => cb.principal)).length}
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Renda Média</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {(() => {
                        const clientesComRenda = data.clientes.filter(c => c.renda)
                        if (clientesComRenda.length === 0) return 'R$ 0'
                        const media = clientesComRenda.reduce((acc, c) => acc + (c.renda || 0), 0) / clientesComRenda.length
                        return new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                          maximumFractionDigits: 0
                        }).format(media)
                      })()}
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v8a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Atendimentos</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {data.clientes.reduce((acc, c) => acc + c._count.atendimentos, 0)}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Tabela */}
        <Card>
          <Table
            data={data.clientes}
            columns={columns}
            pagination={data.pagination}
            onPageChange={handlePageChange}
            loading={loading}
            emptyMessage="Nenhum cliente encontrado"
            className="rounded-lg"
          />
        </Card>
      </div>
    </div>
  )
}