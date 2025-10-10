'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card } from '@/ui/components/Card'
import { Button } from '@/ui/components/Button'
import { StatusBadge } from '@/ui/components/StatusBadge'
import { EditableField } from '@/ui/components/forms/Form'
import { Table } from '@/ui/components/tables/Table'
import { getCliente, updateClienteField } from '../../actions/clientes'
import { TableColumn } from '@/types'
import Link from 'next/link'

interface ClienteDetalhes {
  id: string
  nome: string
  cpf: string
  email?: string
  telefone: string
  endereco?: string
  cidade?: string
  estado?: string
  cep?: string
  renda?: number
  profissao?: string
  createdAt: string
  updatedAt: string
  clienteBancos: Array<{
    id: string
    agencia?: string
    conta?: string
    principal: boolean
    banco: {
      id: string
      codigo: string
      nome: string
    }
  }>
  atendimentos: Array<{
    id: string
    status: string
    createdAt: string
    assignee?: {
      id: string
      name: string
    }
  }>
}

export default function ClienteDetalhesPage() {
  const params = useParams()
  const router = useRouter()
  const [cliente, setCliente] = useState<ClienteDetalhes | null>(null)
  const [loading, setLoading] = useState(true)
  const clienteId = params.id as string

  const loadCliente = async () => {
    setLoading(true)
    try {
      const data = await getCliente(clienteId)
      setCliente(data)
    } catch (error) {
      console.error('Erro ao carregar cliente:', error)
      router.push('/clientes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCliente()
  }, [clienteId])

  const handleFieldUpdate = async (field: string, value: string) => {
    try {
      await updateClienteField(clienteId, field, value)
      await loadCliente() // Recarregar dados
    } catch (error) {
      console.error(`Erro ao atualizar ${field}:`, error)
      throw error
    }
  }

  const getStatusColor = (status: string) => {
    const statusMap: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
      'DISPONIVEL': 'info',
      'ATRIBUIDO': 'warning',
      'PENDENTE_CALCULO': 'warning',
      'SIMULACAO_APROVADA': 'success',
      'SIMULACAO_REPROVADA': 'error',
      'EM_FECHAMENTO': 'warning',
      'CONTRATO_CONFIRMADO': 'success',
      'ENVIADO_FINANCEIRO': 'warning',
      'CONTRATO_ATIVADO': 'success',
      'ENCERRADO_REPROVADO': 'error',
      'ENCERRADO_NAO_APROVADO': 'error',
      'ENCERRADO_ATIVADO': 'success',
    }
    return statusMap[status] || 'info'
  }

  const atendimentosColumns: TableColumn[] = [
    {
      key: 'id',
      header: 'ID',
      render: (value) => (
        <Link
          href={`/atendimentos/${value}`}
          className="text-primary-600 hover:text-primary-800 font-mono text-sm"
        >
          {value.slice(-8)}
        </Link>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => (
        <StatusBadge
          status={value.replace('_', ' ')}
          variant={getStatusColor(value)}
        />
      ),
    },
    {
      key: 'assignee',
      header: 'Responsável',
      render: (value) => (
        <span className="text-gray-900">
          {value?.name || 'Não atribuído'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Criado em',
      render: (value) => (
        <span className="text-gray-600">
          {new Date(value).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
      ),
    },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2 mb-8"></div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="h-96 bg-gray-300 rounded-lg"></div>
              </div>
              <div>
                <div className="h-48 bg-gray-300 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!cliente) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Cliente não encontrado</h2>
          <Link href="/clientes">
            <Button variant="primary">Voltar para Clientes</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Link href="/clientes" className="text-primary-600 hover:text-primary-800">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </Link>
                <span className="text-gray-400">/</span>
                <span className="text-gray-600">Clientes</span>
                <span className="text-gray-400">/</span>
                <span className="text-gray-900 font-medium">{cliente.nome}</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">{cliente.nome}</h1>
              <p className="mt-2 text-gray-600">
                Cliente desde {new Date(cliente.createdAt).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
            <div className="flex space-x-3">
              <Link href={`/clientes/${cliente.id}/editar`}>
                <Button variant="outline">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Editar
                </Button>
              </Link>
              <Button variant="primary">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Novo Atendimento
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Informações Principais */}
          <div className="lg:col-span-2 space-y-6">
            {/* Dados Pessoais */}
            <Card>
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Dados Pessoais</h3>
                <p className="text-sm text-gray-500">Informações básicas do cliente</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CPF
                    </label>
                    <div className="text-gray-900 font-mono">{cliente.cpf}</div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefone
                    </label>
                    <EditableField
                      value={cliente.telefone}
                      onSave={(value) => handleFieldUpdate('telefone', value)}
                      type="tel"
                      validation="phone"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      E-mail
                    </label>
                    <EditableField
                      value={cliente.email || ''}
                      onSave={(value) => handleFieldUpdate('email', value)}
                      type="email"
                      validation="email"
                      placeholder="Adicionar e-mail..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profissão
                    </label>
                    <EditableField
                      value={cliente.profissao || ''}
                      onSave={(value) => handleFieldUpdate('profissao', value)}
                      placeholder="Adicionar profissão..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Endereço
                    </label>
                    <EditableField
                      value={cliente.endereco || ''}
                      onSave={(value) => handleFieldUpdate('endereco', value)}
                      placeholder="Adicionar endereço..."
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Histórico de Atendimentos */}
            <Card>
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Histórico de Atendimentos</h3>
                    <p className="text-sm text-gray-500">Todos os atendimentos deste cliente</p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {cliente.atendimentos.length} atendimentos
                  </span>
                </div>
              </div>
              <div className="p-6">
                {cliente.atendimentos.length > 0 ? (
                  <Table
                    data={cliente.atendimentos}
                    columns={atendimentosColumns}
                    emptyMessage="Nenhum atendimento encontrado"
                  />
                ) : (
                  <div className="text-center py-12">
                    <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v8a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-gray-500">Nenhum atendimento realizado ainda</p>
                    <Button variant="primary" className="mt-4">
                      Iniciar Primeiro Atendimento
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Informações Financeiras */}
            <Card>
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Informações Financeiras</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Renda Mensal
                    </label>
                    <div className="text-2xl font-bold text-gray-900">
                      {cliente.renda
                        ? new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(cliente.renda)
                        : 'Não informado'
                      }
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Contas Bancárias */}
            <Card>
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Contas Bancárias</h3>
              </div>
              <div className="p-6">
                {cliente.clienteBancos.length > 0 ? (
                  <div className="space-y-4">
                    {cliente.clienteBancos.map((clienteBanco) => (
                      <div
                        key={clienteBanco.id}
                        className={`p-4 rounded-lg border ${
                          clienteBanco.principal
                            ? 'border-primary-200 bg-primary-50'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {clienteBanco.banco.codigo}
                            </span>
                            {clienteBanco.principal && (
                              <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded">
                                Principal
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          {clienteBanco.banco.nome}
                        </div>
                        {clienteBanco.agencia && (
                          <div className="text-xs text-gray-600">
                            Ag: {clienteBanco.agencia}
                          </div>
                        )}
                        {clienteBanco.conta && (
                          <div className="text-xs text-gray-600">
                            CC: {clienteBanco.conta}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <p className="text-sm text-gray-500">Nenhuma conta cadastrada</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Ações Rápidas */}
            <Card>
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Ações Rápidas</h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Ligar para Cliente
                  </Button>

                  <Button variant="outline" className="w-full justify-start">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Enviar E-mail
                  </Button>

                  <Button variant="outline" className="w-full justify-start">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    Adicionar Conta Bancária
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}