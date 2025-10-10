import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card } from '@/ui/components/Card'
import { StatusBadge } from '@/ui/components/StatusBadge'
import { Heading } from '@/ui/components/Heading'
import { redirect, notFound } from 'next/navigation'
import AtendimentoComments from './AtendimentoComments'

interface PageProps {
  params: {
    id: string
  }
}

export default async function AtendimentoDetailPage({ params }: PageProps) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/signin')
  }

  const atendimento = await prisma.atendimento.findUnique({
    where: { id: params.id },
    include: {
      assignee: true,
      lockOwner: true,
      cliente: true,
      auditLogs: {
        include: {
          actor: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  })

  if (!atendimento) {
    notFound()
  }

  const formatDate = (date: Date | string) => {
    const d = new Date(date)
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const calcResult = atendimento.calcResult as any

  return (
    <div className="px-4 py-6">
      <div className="mb-6">
        <Heading level={1} className="mb-2">
          Atendimento #{atendimento.id.slice(-8)}
        </Heading>
        <div className="flex items-center gap-4">
          <StatusBadge status={atendimento.status} />
          <span className="text-gray-600">
            Criado em {formatDate(atendimento.createdAt)}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Informações Gerais */}
        <Card>
          <Heading level={3} className="mb-4">
            Informações Gerais
          </Heading>
          <div className="space-y-3 text-sm">
            <div>
              <span className="font-medium text-gray-900">ID:</span>
              <span className="ml-2 text-gray-600">{atendimento.id}</span>
            </div>
            <div>
              <span className="font-medium text-gray-900">Status:</span>
              <span className="ml-2">
                <StatusBadge status={atendimento.status} />
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-900">Criado em:</span>
              <span className="ml-2 text-gray-600">{formatDate(atendimento.createdAt)}</span>
            </div>
            <div>
              <span className="font-medium text-gray-900">Última atualização:</span>
              <span className="ml-2 text-gray-600">{formatDate(atendimento.updatedAt)}</span>
            </div>
            {atendimento.assignee && (
              <div>
                <span className="font-medium text-gray-900">Responsável:</span>
                <span className="ml-2 text-gray-600">{atendimento.assignee.name}</span>
              </div>
            )}
            {atendimento.lockActive && atendimento.lockOwner && (
              <div className="p-3 bg-orange-50 rounded-lg">
                <div className="text-orange-800">
                  <span className="font-medium">🔒 Bloqueado por:</span>
                  <span className="ml-2">{atendimento.lockOwner.name}</span>
                  {atendimento.lockStartedAt && (
                    <div className="text-xs mt-1">
                      desde {formatDate(atendimento.lockStartedAt)}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Resultado do Cálculo */}
        {calcResult && (
          <Card>
            <Heading level={3} className="mb-4">
              Resultado do Cálculo
            </Heading>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium text-gray-900">Status:</span>
                <span className={`ml-2 font-medium ${calcResult.aprovado ? 'text-green-600' : 'text-red-600'}`}>
                  {calcResult.aprovado ? 'Aprovado' : 'Reprovado'}
                </span>
              </div>
              {calcResult.valor_liberado && (
                <div>
                  <span className="font-medium text-gray-900">Valor Liberado:</span>
                  <span className="ml-2 text-gray-600">
                    R$ {calcResult.valor_liberado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              {calcResult.parcela_total && (
                <div>
                  <span className="font-medium text-gray-900">Parcela Total:</span>
                  <span className="ml-2 text-gray-600">
                    R$ {calcResult.parcela_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              {calcResult.coeficiente && (
                <div>
                  <span className="font-medium text-gray-900">Coeficiente:</span>
                  <span className="ml-2 text-gray-600">{calcResult.coeficiente}</span>
                </div>
              )}
              {calcResult.observacoes && (
                <div>
                  <span className="font-medium text-gray-900">Observações:</span>
                  <div className="ml-0 mt-1 text-gray-600 bg-gray-50 p-2 rounded">
                    {calcResult.observacoes}
                  </div>
                </div>
              )}
              {calcResult.motivo && (
                <div>
                  <span className="font-medium text-gray-900">Motivo:</span>
                  <div className="ml-0 mt-1 text-red-600 bg-red-50 p-2 rounded">
                    {calcResult.motivo}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Informações do Cliente */}
        {atendimento.cliente && (
          <Card>
            <Heading level={3} className="mb-4">
              Cliente
            </Heading>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium text-gray-900">Nome:</span>
                <span className="ml-2 text-gray-600">{atendimento.cliente.nome}</span>
              </div>
              <div>
                <span className="font-medium text-gray-900">CPF:</span>
                <span className="ml-2 text-gray-600 font-mono">{atendimento.cliente.cpf}</span>
              </div>
              <div>
                <span className="font-medium text-gray-900">Telefone:</span>
                <span className="ml-2 text-gray-600">{atendimento.cliente.telefone}</span>
              </div>
              {atendimento.cliente.email && (
                <div>
                  <span className="font-medium text-gray-900">E-mail:</span>
                  <span className="ml-2 text-gray-600">{atendimento.cliente.email}</span>
                </div>
              )}
              {atendimento.cliente.renda && (
                <div>
                  <span className="font-medium text-gray-900">Renda:</span>
                  <span className="ml-2 text-gray-600">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(Number(atendimento.cliente.renda))}
                  </span>
                </div>
              )}
              {atendimento.cliente.profissao && (
                <div>
                  <span className="font-medium text-gray-900">Profissão:</span>
                  <span className="ml-2 text-gray-600">{atendimento.cliente.profissao}</span>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Histórico de Auditoria */}
      <Card className="mt-6">
        <Heading level={3} className="mb-4">
          Histórico de Ações
        </Heading>
        {atendimento.auditLogs.length === 0 ? (
          <p className="text-gray-500 text-sm">Nenhuma ação registrada</p>
        ) : (
          <div className="space-y-3">
            {atendimento.auditLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{log.event}</span>
                    <span className="text-xs text-gray-500">
                      {formatDate(log.createdAt)}
                    </span>
                  </div>
                  {log.actor && (
                    <div className="text-sm text-gray-600 mt-1">
                      por {log.actor.name}
                    </div>
                  )}
                  {log.payload && Object.keys(log.payload).length > 0 && (
                    <div className="text-xs text-gray-500 mt-2">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(log.payload, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Sistema de Comentários */}
      <div className="mt-6">
        <AtendimentoComments atendimentoId={atendimento.id} currentUser={user} />
      </div>
    </div>
  )
}