'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/ui/components/Card'
import { Button } from '@/ui/components/Button'
import { Form } from '@/ui/components/forms/Form'
import { FormFieldConfig } from '@/types'
import { FormValidator } from '@/lib/patterns/strategy/validation'
import { ValidationStrategyFactory } from '@/lib/patterns/strategy/validation'
import { createCliente } from '../../actions/clientes'
import Link from 'next/link'

export default function NovoClientePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Configurar validador
  const validator = new FormValidator()
    .addValidation('cpf', ValidationStrategyFactory.createCPFValidator())
    .addValidation('telefone', ValidationStrategyFactory.createPhoneValidator())
    .addValidation('email', ValidationStrategyFactory.createEmailValidator())

  const formFields: FormFieldConfig[] = [
    {
      name: 'nome',
      label: 'Nome Completo',
      type: 'text',
      required: true,
      placeholder: 'Digite o nome completo do cliente'
    },
    {
      name: 'cpf',
      label: 'CPF',
      type: 'text',
      required: true,
      placeholder: '000.000.000-00',
      validation: 'cpf'
    },
    {
      name: 'telefone',
      label: 'Telefone',
      type: 'tel',
      required: true,
      placeholder: '(11) 99999-9999',
      validation: 'phone'
    },
    {
      name: 'email',
      label: 'E-mail',
      type: 'email',
      placeholder: 'cliente@email.com',
      validation: 'email'
    },
    {
      name: 'endereco',
      label: 'Endereço',
      type: 'text',
      placeholder: 'Rua, número, complemento'
    },
    {
      name: 'cidade',
      label: 'Cidade',
      type: 'text',
      placeholder: 'Nome da cidade'
    },
    {
      name: 'estado',
      label: 'Estado',
      type: 'select',
      options: [
        { value: 'AC', label: 'Acre' },
        { value: 'AL', label: 'Alagoas' },
        { value: 'AP', label: 'Amapá' },
        { value: 'AM', label: 'Amazonas' },
        { value: 'BA', label: 'Bahia' },
        { value: 'CE', label: 'Ceará' },
        { value: 'DF', label: 'Distrito Federal' },
        { value: 'ES', label: 'Espírito Santo' },
        { value: 'GO', label: 'Goiás' },
        { value: 'MA', label: 'Maranhão' },
        { value: 'MT', label: 'Mato Grosso' },
        { value: 'MS', label: 'Mato Grosso do Sul' },
        { value: 'MG', label: 'Minas Gerais' },
        { value: 'PA', label: 'Pará' },
        { value: 'PB', label: 'Paraíba' },
        { value: 'PR', label: 'Paraná' },
        { value: 'PE', label: 'Pernambuco' },
        { value: 'PI', label: 'Piauí' },
        { value: 'RJ', label: 'Rio de Janeiro' },
        { value: 'RN', label: 'Rio Grande do Norte' },
        { value: 'RS', label: 'Rio Grande do Sul' },
        { value: 'RO', label: 'Rondônia' },
        { value: 'RR', label: 'Roraima' },
        { value: 'SC', label: 'Santa Catarina' },
        { value: 'SP', label: 'São Paulo' },
        { value: 'SE', label: 'Sergipe' },
        { value: 'TO', label: 'Tocantins' }
      ]
    },
    {
      name: 'cep',
      label: 'CEP',
      type: 'text',
      placeholder: '00000-000'
    },
    {
      name: 'renda',
      label: 'Renda Mensal',
      type: 'number',
      placeholder: '0,00',
      validation: 'currency'
    },
    {
      name: 'profissao',
      label: 'Profissão',
      type: 'text',
      placeholder: 'Profissão do cliente'
    }
  ]

  const handleSubmit = async (data: Record<string, any>) => {
    setLoading(true)
    try {
      // Converter dados para FormData
      const formData = new FormData()

      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          formData.append(key, String(value))
        }
      })

      const cliente = await createCliente(formData)
      router.push(`/clientes/${cliente.id}`)
    } catch (error: any) {
      console.error('Erro ao criar cliente:', error)
      alert(error.message || 'Erro ao criar cliente')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push('/clientes')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-2">
            <Link href="/clientes" className="text-primary-600 hover:text-primary-800">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <span className="text-gray-400">/</span>
            <Link href="/clientes" className="text-primary-600 hover:text-primary-800">
              Clientes
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-medium">Novo Cliente</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Cadastrar Novo Cliente</h1>
          <p className="mt-2 text-gray-600">
            Preencha as informações do cliente para cadastrá-lo no sistema
          </p>
        </div>

        {/* Formulário */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Form Principal */}
          <div className="lg:col-span-3">
            <Card>
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Informações do Cliente</h2>
                <p className="text-sm text-gray-500">
                  Preencha os dados básicos do cliente. Campos marcados com * são obrigatórios.
                </p>
              </div>
              <div className="p-6">
                <Form
                  fields={formFields}
                  validator={validator}
                  onSubmit={handleSubmit}
                  onCancel={handleCancel}
                  submitText="Cadastrar Cliente"
                  cancelText="Cancelar"
                  loading={loading}
                  columns={2}
                  layout="vertical"
                />
              </div>
            </Card>
          </div>

          {/* Sidebar com Informações */}
          <div className="space-y-6">
            {/* Dicas */}
            <Card>
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Dicas</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">CPF Obrigatório</h4>
                      <p className="text-sm text-gray-600">
                        O CPF é usado como identificador único do cliente
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Telefone Principal</h4>
                      <p className="text-sm text-gray-600">
                        Usado para contato e confirmações
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Informações Financeiras</h4>
                      <p className="text-sm text-gray-600">
                        Renda e profissão ajudam na análise de crédito
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Próximos Passos */}
            <Card>
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Próximos Passos</h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-primary-600">1</span>
                    </div>
                    <span className="text-sm text-gray-600">Cadastrar cliente</span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-400">2</span>
                    </div>
                    <span className="text-sm text-gray-400">Adicionar contas bancárias</span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-400">3</span>
                    </div>
                    <span className="text-sm text-gray-400">Iniciar primeiro atendimento</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Atalhos */}
            <Card>
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Atalhos</h3>
              </div>
              <div className="p-6">
                <div className="space-y-2">
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Importar de CSV
                  </Button>

                  <Link href="/clientes">
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Ver Todos os Clientes
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}