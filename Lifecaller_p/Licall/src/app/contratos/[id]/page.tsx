'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card } from '@/ui/components/Card'
import { Button } from '@/ui/components/Button'
import { StatusBadge } from '@/ui/components/StatusBadge'
import { FileUpload } from '@/ui/components/upload/FileUpload'
import { getContrato, updateContratoStatus, uploadContratoAnexo, deleteContratoAnexo } from '../../actions/contratos'
import Link from 'next/link'

interface ContratoDetalhes {
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
      email?: string
    }
    assignee?: {
      id: string
      name: string
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
  anexos: Array<{
    id: string
    filename: string
    originalName: string
    mimeType: string
    size: number
    url?: string
    description?: string
    createdAt: string
  }>
}

export default function ContratoDetalhesPage() {
  const params = useParams()
  const router = useRouter()
  const [contrato, setContrato] = useState<ContratoDetalhes | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploadLoading, setUploadLoading] = useState(false)
  const contratoId = params.id as string

  const loadContrato = async () => {
    setLoading(true)
    try {
      const data = await getContrato(contratoId)
      setContrato(data)
    } catch (error) {
      console.error('Erro ao carregar contrato:', error)
      router.push('/contratos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadContrato()
  }, [contratoId])

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

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      await updateContratoStatus(contratoId, newStatus)
      await loadContrato()
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      alert('Erro ao atualizar status do contrato')
    }
  }

  const handleFileUpload = async (file: File, description?: string) => {
    setUploadLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('contratoId', contratoId)
      if (description) {
        formData.append('description', description)
      }

      await uploadContratoAnexo(formData)
      await loadContrato()
    } catch (error) {
      console.error('Erro ao fazer upload:', error)
      throw error
    } finally {
      setUploadLoading(false)
    }
  }

  const handleDeleteAnexo = async (anexoId: string) => {
    if (!confirm('Tem certeza que deseja excluir este anexo?')) return

    try {
      await deleteContratoAnexo(anexoId)
      await loadContrato()
    } catch (error) {
      console.error('Erro ao excluir anexo:', error)
      alert('Erro ao excluir anexo')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return (
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    } else if (mimeType === 'application/pdf') {
      return (
        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      )
    } else {
      return (
        <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2 mb-8"></div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-96 bg-gray-300 rounded-lg"></div>
                <div className="h-64 bg-gray-300 rounded-lg"></div>
              </div>
              <div className="space-y-6">
                <div className="h-48 bg-gray-300 rounded-lg"></div>
                <div className="h-32 bg-gray-300 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!contrato) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Contrato não encontrado</h2>
          <Link href="/contratos">
            <Button variant="primary">Voltar para Contratos</Button>
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
                <Link href="/contratos" className="text-primary-600 hover:text-primary-800">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </Link>
                <span className="text-gray-400">/</span>
                <Link href="/contratos" className="text-primary-600 hover:text-primary-800">
                  Contratos
                </Link>
                <span className="text-gray-400">/</span>
                <span className="text-gray-900 font-medium">{contrato.id.slice(-8)}</span>
              </div>
              <div className="flex items-center space-x-4">
                <h1 className="text-3xl font-bold text-gray-900">
                  Contrato #{contrato.id.slice(-8)}
                </h1>
                <StatusBadge
                  status={getStatusLabel(contrato.status)}
                  variant={getStatusColor(contrato.status)}
                />
              </div>
              <p className="mt-2 text-gray-600">
                Contrato criado em {new Date(contrato.createdAt).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })} por {contrato.createdBy.name}
              </p>
            </div>
            <div className="flex space-x-3">
              {contrato.status === 'AGUARDANDO_COMPROVANTES' && (
                <Button
                  variant="outline"
                  onClick={() => handleStatusUpdate('COMPROVANTES_ANEXADOS')}
                >
                  Marcar como Anexado
                </Button>
              )}
              {contrato.status === 'COMPROVANTES_ANEXADOS' && (
                <Button
                  variant="primary"
                  onClick={() => handleStatusUpdate('EFETIVADO')}
                >
                  Efetivar Contrato
                </Button>
              )}
              <Button variant="outline">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Baixar PDF
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Informações Principais */}
          <div className="lg:col-span-2 space-y-6">
            {/* Dados do Contrato */}
            <Card>
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Informações do Contrato</h3>
                <p className="text-sm text-gray-500">Detalhes financeiros e condições</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valor Aprovado
                    </label>
                    <div className="text-2xl font-bold text-green-600">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(contrato.valorAprovado)}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Parcela Mensal
                    </label>
                    <div className="text-xl font-bold text-gray-900">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(contrato.parcelaMensal)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {contrato.prazoMeses}x parcelas
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Taxa de Juros
                    </label>
                    <div className="text-lg font-medium text-gray-900">
                      {contrato.taxaJuros.toFixed(2)}% a.m.
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Coeficiente
                    </label>
                    <div className="text-lg font-medium text-gray-900">
                      {contrato.coeficiente.toFixed(2)}
                    </div>
                  </div>

                  {contrato.dataEfetivacao && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Data de Efetivação
                      </label>
                      <div className="text-lg font-medium text-green-600">
                        {new Date(contrato.dataEfetivacao).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  )}

                  {contrato.observacoes && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Observações
                      </label>
                      <div className="text-gray-900 p-3 bg-gray-50 rounded-lg">
                        {contrato.observacoes}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Upload de Anexos */}
            <Card>
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Anexos do Contrato</h3>
                <p className="text-sm text-gray-500">
                  Faça upload dos comprovantes e documentos necessários
                </p>
              </div>
              <div className="p-6">
                {contrato.status !== 'CANCELADO' && contrato.status !== 'EFETIVADO' && (
                  <div className="mb-6">
                    <FileUpload
                      onUpload={handleFileUpload}
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      maxSize={10 * 1024 * 1024} // 10MB
                      loading={uploadLoading}
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6"
                    />
                  </div>
                )}

                {/* Lista de Anexos */}
                {contrato.anexos.length > 0 ? (
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">
                      Arquivos Anexados ({contrato.anexos.length})
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                      {contrato.anexos.map((anexo) => (
                        <div
                          key={anexo.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                        >
                          <div className="flex items-center space-x-3">
                            {getFileIcon(anexo.mimeType)}
                            <div>
                              <p className="font-medium text-gray-900">{anexo.originalName}</p>
                              <div className="flex items-center space-x-2 text-sm text-gray-500">
                                <span>{formatFileSize(anexo.size)}</span>
                                <span>•</span>
                                <span>
                                  {new Date(anexo.createdAt).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                              {anexo.description && (
                                <p className="text-sm text-gray-600 mt-1">{anexo.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(anexo.url || '#', '_blank')}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </Button>
                            {contrato.status !== 'EFETIVADO' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteAnexo(anexo.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    <p className="text-gray-500">Nenhum anexo adicionado ainda</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Informações do Cliente */}
            <Card>
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Cliente</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <Link
                      href={`/clientes/${contrato.atendimento.cliente.id}`}
                      className="text-lg font-medium text-primary-600 hover:text-primary-800"
                    >
                      {contrato.atendimento.cliente.nome}
                    </Link>
                    <div className="text-sm text-gray-500 font-mono">
                      {contrato.atendimento.cliente.cpf}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefone
                    </label>
                    <div className="text-gray-900">
                      {contrato.atendimento.cliente.telefone}
                    </div>
                  </div>

                  {contrato.atendimento.cliente.email && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        E-mail
                      </label>
                      <div className="text-gray-900">
                        {contrato.atendimento.cliente.email}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    <Link
                      href={`/atendimentos/${contrato.atendimento.id}`}
                      className="text-sm text-primary-600 hover:text-primary-800"
                    >
                      Ver atendimento relacionado →
                    </Link>
                  </div>
                </div>
              </div>
            </Card>

            {/* Histórico */}
            <Card>
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Histórico</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Contrato criado
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(contrato.createdAt).toLocaleDateString('pt-BR')} por {contrato.createdBy.name}
                      </p>
                    </div>
                  </div>

                  {contrato.updatedBy && (
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Última atualização
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(contrato.updatedAt).toLocaleDateString('pt-BR')} por {contrato.updatedBy.name}
                        </p>
                      </div>
                    </div>
                  )}

                  {contrato.dataEfetivacao && (
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Contrato efetivado
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(contrato.dataEfetivacao).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Ações */}
            <Card>
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Ações</h3>
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
                    Enviar por E-mail
                  </Button>

                  {contrato.status !== 'CANCELADO' && contrato.status !== 'EFETIVADO' && (
                    <Button
                      variant="outline"
                      className="w-full justify-start text-red-600 hover:text-red-800"
                      onClick={() => handleStatusUpdate('CANCELADO')}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Cancelar Contrato
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}