import { getCurrentUser } from '@/lib/auth'
import { getVisibleAtendimentosForRole } from '@/lib/rbac'
import { getAllowedActions } from '@/lib/rbac'
import { prisma } from '@/lib/prisma'
import { QueueCard } from '@/ui/components/QueueCard'
import { Button } from '@/ui/components/Button'
import { Heading } from '@/ui/components/Heading'
import { Card } from '@/ui/components/Card'
import { assign, sendToCalc, sendToClosing, sendToFinance, closeClientDeclined, closeRejected } from './actions/atendimentos'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function HomePage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/signin')
  }

  const { statuses, description } = getVisibleAtendimentosForRole(user.role)

  const atendimentos = await prisma.atendimento.findMany({
    where: {
      status: {
        in: statuses,
      },
      ...(user.role === 'atendente'
        ? {
            OR: [
              { status: 'DISPONIVEL' },
              { assigneeId: user.id },
            ],
          }
        : {}),
    },
    include: {
      assignee: true,
      lockOwner: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // Buscar estatísticas rápidas
  const [
    totalAtendimentos,
    atendimentosHoje,
    totalClientes,
    totalContratos
  ] = await Promise.all([
    prisma.atendimento.count(),
    prisma.atendimento.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    }),
    prisma.cliente.count(),
    prisma.contrato.count({
      where: {
        status: 'EFETIVADO'
      }
    })
  ])

  return (
    <div className="px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Heading level={1} className="mb-2">
            Esteira Global
          </Heading>
          <p className="text-gray-600">{description}</p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Ver Dashboard Completo
          </Button>
        </Link>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v8a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Atendimentos Total</p>
                <p className="text-2xl font-bold text-gray-900">{totalAtendimentos}</p>
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Hoje</p>
                <p className="text-2xl font-bold text-gray-900">{atendimentosHoje}</p>
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Clientes</p>
                <p className="text-2xl font-bold text-gray-900">{totalClientes}</p>
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Contratos Efetivados</p>
                <p className="text-2xl font-bold text-gray-900">{totalContratos}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {atendimentos.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg">
            Nenhum atendimento encontrado
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {atendimentos.map((atendimento) => {
            const allowedActions = getAllowedActions(atendimento.status, user.role)

            return (
              <QueueCard
                key={atendimento.id}
                atendimento={atendimento}
                actions={
                  <div className="flex flex-wrap gap-2">
                    {allowedActions.map((permission) => {
                      if (!permission.allowed) return null

                      switch (permission.action) {
                        case 'assign':
                          return (
                            <form key="assign" action={assign.bind(null, atendimento.id)}>
                              <Button type="submit" size="sm" variant="primary">
                                Assumir
                              </Button>
                            </form>
                          )

                        case 'sendToCalc':
                          return (
                            <form key="sendToCalc" action={sendToCalc.bind(null, atendimento.id)}>
                              <Button type="submit" size="sm" variant="secondary">
                                Enviar p/ Cálculo
                              </Button>
                            </form>
                          )

                        case 'sendToClosing':
                          return (
                            <form key="sendToClosing" action={sendToClosing.bind(null, atendimento.id)}>
                              <Button type="submit" size="sm" variant="secondary">
                                Enviar p/ Fechamento
                              </Button>
                            </form>
                          )

                        case 'sendToFinance':
                          return (
                            <form key="sendToFinance" action={sendToFinance.bind(null, atendimento.id)}>
                              <Button type="submit" size="sm" variant="secondary">
                                Enviar p/ Financeiro
                              </Button>
                            </form>
                          )

                        case 'closeClientDeclined':
                          return (
                            <form key="closeClientDeclined" action={closeClientDeclined.bind(null, atendimento.id)}>
                              <Button type="submit" size="sm" variant="warning">
                                Cliente Desistiu
                              </Button>
                            </form>
                          )

                        case 'closeRejected':
                          return (
                            <form key="closeRejected" action={closeRejected.bind(null, atendimento.id)}>
                              <Button type="submit" size="sm" variant="error">
                                Encerrar Reprovado
                              </Button>
                            </form>
                          )

                        default:
                          return null
                      }
                    })}
                  </div>
                }
              />
            )
          })}
        </div>
      )}
    </div>
  )
}