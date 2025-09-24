'use client'

import React, { useState, useEffect } from 'react'
import { KPICard } from '@/ui/components/KPICard'
import { Card } from '@/ui/components/Card'
import { Button } from '@/ui/components/Button'
import { KPIData, ChartData } from '@/types'
import { getKPIsForDashboard, getKPICategories, getKPIPeriods } from '../actions/kpis'
import { getContratosStats } from '../actions/contratos'
import { BarChart, LineChart, PieChart, DoughnutChart, useChartFactory } from '@/ui/components/charts/Chart'

interface DashboardStats {
  totalAtendimentos: number
  atendimentosHoje: number
  contratosEfetivados: number
  valorTotalContratos: number
  taxaConversao: number
  tempoMedioAtendimento: number
}

export default function DashboardPage() {
  const [kpis, setKpis] = useState<KPIData[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [periods, setPeriods] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState('')

  // Hook para criar gráficos usando Factory Pattern
  const { createKPIChart, createTimeSeriesChart, createDistributionChart } = useChartFactory()

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const [kpiData, categoriesData, periodsData] = await Promise.all([
        getKPIsForDashboard({
          categoria: selectedCategory || undefined,
          periodo: selectedPeriod || undefined,
          limit: 12
        }),
        getKPICategories(),
        getKPIPeriods()
      ])

      // Transformar dados do Prisma para KPIData
      const transformedKPIs: KPIData[] = kpiData.map(kpi => ({
        id: kpi.id,
        nome: kpi.nome,
        valor: Number(kpi.valor),
        meta: kpi.meta ? Number(kpi.meta) : undefined,
        unidade: kpi.unidade || undefined,
        categoria: kpi.categoria,
        periodo: kpi.periodo,
        percentual: kpi.meta ? (Number(kpi.valor) / Number(kpi.meta)) * 100 : undefined,
        tendencia: 'stable' // Placeholder - pode ser calculado baseado em dados históricos
      }))

      setKpis(transformedKPIs)
      setCategories(categoriesData)
      setPeriods(periodsData)
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [selectedCategory, selectedPeriod])

  const handleFilterChange = () => {
    loadDashboardData()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2 mb-8"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-gray-300 rounded-lg"></div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-48 bg-gray-300 rounded-lg"></div>
              ))}
            </div>
          </div>
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
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="mt-2 text-gray-600">
                Visão geral dos indicadores e métricas do sistema Licall
              </p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => window.print()}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Imprimir
              </Button>
              <Button variant="outline">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Exportar
              </Button>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <Card className="mb-8">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Filtros</h3>
              <Button
                variant="ghost"
                onClick={() => {
                  setSelectedCategory('')
                  setSelectedPeriod('')
                }}
              >
                Limpar Filtros
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Categoria */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCategory('')}
                    className={`px-3 py-1 text-sm rounded-full border ${
                      selectedCategory === ''
                        ? 'bg-primary-100 text-primary-700 border-primary-200'
                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Todas
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-3 py-1 text-sm rounded-full border ${
                        selectedCategory === category
                          ? 'bg-primary-100 text-primary-700 border-primary-200'
                          : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Período */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Período
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedPeriod('')}
                    className={`px-3 py-1 text-sm rounded-full border ${
                      selectedPeriod === ''
                        ? 'bg-primary-100 text-primary-700 border-primary-200'
                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Todos
                  </button>
                  {periods.map((period) => (
                    <button
                      key={period}
                      onClick={() => setSelectedPeriod(period)}
                      className={`px-3 py-1 text-sm rounded-full border ${
                        selectedPeriod === period
                          ? 'bg-primary-100 text-primary-700 border-primary-200'
                          : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-end">
                <Button variant="outline" onClick={handleFilterChange}>
                  Atualizar
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* KPIs Grid */}
        {kpis.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {kpis.map((kpi) => (
              <KPICard
                key={kpi.id}
                kpi={kpi}
                size="md"
                showTrend={true}
                showProgress={true}
              />
            ))}
          </div>
        ) : (
          <Card className="mb-8">
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum KPI encontrado</h3>
              <p className="text-gray-500 mb-4">
                {selectedCategory || selectedPeriod
                  ? 'Não há dados para os filtros selecionados'
                  : 'Não há KPIs cadastrados no sistema'
                }
              </p>
              <Button variant="primary">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Cadastrar Primeiro KPI
              </Button>
            </div>
          </Card>
        )}

        {/* Gráficos Interativos */}
        {kpis.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Gráfico de KPIs vs Metas */}
            <Card>
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Performance vs Metas</h3>
                <p className="text-sm text-gray-500">Comparação dos indicadores com suas metas</p>
              </div>
              <div className="p-6">
                {(() => {
                  const kpiChartData = kpis
                    .filter(kpi => kpi.meta)
                    .slice(0, 6)
                    .map(kpi => ({
                      nome: kpi.nome,
                      valor: kpi.valor,
                      meta: kpi.meta
                    }))

                  if (kpiChartData.length === 0) {
                    return (
                      <div className="flex items-center justify-center h-64 text-gray-500">
                        Nenhum KPI com meta definida
                      </div>
                    )
                  }

                  const { type, data } = createKPIChart(kpiChartData, 'bar')
                  return (
                    <BarChart
                      data={data}
                      height={300}
                      options={{
                        plugins: {
                          legend: {
                            display: true,
                            position: 'top'
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true
                          }
                        }
                      }}
                    />
                  )
                })()}
              </div>
            </Card>

            {/* Distribuição por Categoria */}
            <Card>
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Distribuição por Categoria</h3>
                <p className="text-sm text-gray-500">Valores totais por categoria de KPI</p>
              </div>
              <div className="p-6">
                {(() => {
                  const categoryDistribution = categories.map(category => {
                    const categoryKPIs = kpis.filter(kpi => kpi.categoria === category)
                    const totalValue = categoryKPIs.reduce((acc, kpi) => acc + kpi.valor, 0)
                    return {
                      label: category,
                      value: totalValue,
                    }
                  }).filter(item => item.value > 0)

                  if (categoryDistribution.length === 0) {
                    return (
                      <div className="flex items-center justify-center h-64 text-gray-500">
                        Sem dados para distribuição
                      </div>
                    )
                  }

                  const { type, data } = createDistributionChart(categoryDistribution, 'doughnut')
                  return (
                    <DoughnutChart
                      data={data}
                      height={300}
                      options={{
                        plugins: {
                          legend: {
                            display: true,
                            position: 'right'
                          }
                        }
                      }}
                    />
                  )
                })()}
              </div>
            </Card>

            {/* Tendência Temporal */}
            <Card>
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Tendência Temporal</h3>
                <p className="text-sm text-gray-500">Evolução dos KPIs ao longo do tempo</p>
              </div>
              <div className="p-6">
                {(() => {
                  // Simular dados temporais baseados nos KPIs atuais
                  const timeSeriesData = kpis.slice(0, 1).map(kpi => {
                    const days = 7
                    return Array.from({ length: days }, (_, i) => ({
                      date: new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000).toISOString(),
                      value: kpi.valor + (Math.random() - 0.5) * kpi.valor * 0.2
                    }))
                  }).flat()

                  if (timeSeriesData.length === 0) {
                    return (
                      <div className="flex items-center justify-center h-64 text-gray-500">
                        Sem dados temporais disponíveis
                      </div>
                    )
                  }

                  const { type, data } = createTimeSeriesChart(timeSeriesData, 'line')
                  return (
                    <LineChart
                      data={data}
                      height={300}
                      options={{
                        plugins: {
                          legend: {
                            display: false
                          }
                        },
                        scales: {
                          x: {
                            display: true
                          },
                          y: {
                            beginAtZero: false
                          }
                        }
                      }}
                    />
                  )
                })()}
              </div>
            </Card>

            {/* Performance Score */}
            <Card>
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Score de Performance</h3>
                <p className="text-sm text-gray-500">Distribuição dos níveis de performance</p>
              </div>
              <div className="p-6">
                {(() => {
                  const performanceLevels = [
                    { label: 'Excelente (≥100%)', value: 0 },
                    { label: 'Bom (80-99%)', value: 0 },
                    { label: 'Regular (60-79%)', value: 0 },
                    { label: 'Baixo (<60%)', value: 0 },
                  ]

                  kpis.forEach(kpi => {
                    if (kpi.meta) {
                      const performance = (kpi.valor / kpi.meta) * 100
                      if (performance >= 100) {
                        performanceLevels[0].value++
                      } else if (performance >= 80) {
                        performanceLevels[1].value++
                      } else if (performance >= 60) {
                        performanceLevels[2].value++
                      } else {
                        performanceLevels[3].value++
                      }
                    }
                  })

                  const filteredLevels = performanceLevels.filter(level => level.value > 0)

                  if (filteredLevels.length === 0) {
                    return (
                      <div className="flex items-center justify-center h-64 text-gray-500">
                        Sem dados de performance disponíveis
                      </div>
                    )
                  }

                  const { type, data } = createDistributionChart(filteredLevels.map(level => ({
                    ...level,
                    color: level.label.includes('Excelente') ? 'rgba(16, 185, 129, 0.8)' :
                           level.label.includes('Bom') ? 'rgba(245, 158, 11, 0.8)' :
                           level.label.includes('Regular') ? 'rgba(251, 146, 60, 0.8)' :
                           'rgba(239, 68, 68, 0.8)'
                  })), 'pie')

                  return (
                    <PieChart
                      data={data}
                      height={300}
                      options={{
                        plugins: {
                          legend: {
                            display: true,
                            position: 'bottom'
                          }
                        }
                      }}
                    />
                  )
                })()}
              </div>
            </Card>
          </div>
        )}

        {/* Resumo por Categoria */}
        {kpis.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Resumo de Performance */}
            <Card>
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Resumo de Performance</h3>
                <p className="text-sm text-gray-500">Indicadores principais do período</p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {categories.slice(0, 5).map((category) => {
                    const categoryKPIs = kpis.filter(k => k.categoria === category)
                    if (categoryKPIs.length === 0) return null

                    const avgValue = categoryKPIs.reduce((acc, k) => acc + k.valor, 0) / categoryKPIs.length
                    const avgTarget = categoryKPIs.reduce((acc, k) => acc + (k.meta || 0), 0) / categoryKPIs.length
                    const performance = avgTarget > 0 ? (avgValue / avgTarget) * 100 : 0

                    return (
                      <div key={category} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{category}</div>
                          <div className="text-sm text-gray-500">{categoryKPIs.length} indicadores</div>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${
                            performance >= 100 ? 'text-green-600' :
                            performance >= 80 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {performance.toFixed(1)}%
                          </div>
                          <div className="text-sm text-gray-500">da meta</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </Card>

            {/* Tendências */}
            <Card>
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Análise de Tendências</h3>
                <p className="text-sm text-gray-500">Indicadores com melhor e pior performance</p>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  {/* Melhores */}
                  <div>
                    <h4 className="text-sm font-medium text-green-700 mb-3">🔥 Destaques Positivos</h4>
                    <div className="space-y-2">
                      {kpis
                        .filter(kpi => kpi.meta && kpi.valor >= kpi.meta)
                        .slice(0, 3)
                        .map((kpi) => (
                          <div key={kpi.id} className="flex items-center justify-between text-sm">
                            <span className="text-gray-900">{kpi.nome}</span>
                            <span className="text-green-600 font-medium">
                              {((kpi.valor / (kpi.meta || 1)) * 100).toFixed(1)}%
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Piores */}
                  <div>
                    <h4 className="text-sm font-medium text-red-700 mb-3">⚠️ Pontos de Atenção</h4>
                    <div className="space-y-2">
                      {kpis
                        .filter(kpi => kpi.meta && kpi.valor < kpi.meta * 0.8)
                        .slice(0, 3)
                        .map((kpi) => (
                          <div key={kpi.id} className="flex items-center justify-between text-sm">
                            <span className="text-gray-900">{kpi.nome}</span>
                            <span className="text-red-600 font-medium">
                              {((kpi.valor / (kpi.meta || 1)) * 100).toFixed(1)}%
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}