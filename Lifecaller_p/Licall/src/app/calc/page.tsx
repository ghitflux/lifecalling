import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { QueueCard } from '@/ui/components/QueueCard'
import { Button } from '@/ui/components/Button'
import { Heading } from '@/ui/components/Heading'
import { calcApprove, calcReject } from '../actions/atendimentos'
import { redirect } from 'next/navigation'

export default async function CalcPage() {
  const user = await getCurrentUser()

  if (!user || !['calculista', 'superadmin'].includes(user.role)) {
    redirect('/')
  }

  const atendimentos = await prisma.atendimento.findMany({
    where: {
      status: 'PENDENTE_CALCULO',
    },
    include: {
      assignee: true,
      lockOwner: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  return (
    <div className="px-4 py-6">
      <Heading level={1} className="mb-2">
        Fila de Cálculo
      </Heading>
      <p className="text-gray-600 mb-6">Atendimentos pendentes de cálculo</p>

      {atendimentos.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg">
            Nenhum atendimento pendente de cálculo
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          {atendimentos.map((atendimento) => (
            <QueueCard
              key={atendimento.id}
              atendimento={atendimento}
              actions={
                <div className="space-y-4">
                  {/* Approve Form */}
                  <form action={calcApprove.bind(null, atendimento.id)} className="space-y-3">
                    <h4 className="font-medium text-green-700">Aprovar Simulação</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700">
                          Valor Liberado (R$)
                        </label>
                        <input
                          name="valor_liberado"
                          type="number"
                          step="0.01"
                          min="0"
                          className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-green-500 focus:border-green-500"
                          placeholder="10000.00"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700">
                          Parcela Total (R$)
                        </label>
                        <input
                          name="parcela_total"
                          type="number"
                          step="0.01"
                          min="0"
                          className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-green-500 focus:border-green-500"
                          placeholder="450.00"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700">
                          Coeficiente
                        </label>
                        <input
                          name="coeficiente"
                          type="number"
                          step="0.001"
                          min="0"
                          className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-green-500 focus:border-green-500"
                          placeholder="2.15"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">
                        Observações
                      </label>
                      <textarea
                        name="observacoes"
                        rows={2}
                        className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-green-500 focus:border-green-500"
                        placeholder="Observações opcionais..."
                      />
                    </div>
                    <Button type="submit" size="sm" variant="success">
                      Aprovar
                    </Button>
                  </form>

                  <div className="border-t pt-3">
                    {/* Reject Form */}
                    <form action={calcReject.bind(null, atendimento.id)} className="space-y-3">
                      <h4 className="font-medium text-red-700">Reprovar Simulação</h4>
                      <div>
                        <label className="block text-xs font-medium text-gray-700">
                          Motivo da Reprovação *
                        </label>
                        <textarea
                          name="motivo"
                          rows={2}
                          required
                          className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-red-500 focus:border-red-500"
                          placeholder="Descreva o motivo da reprovação..."
                        />
                      </div>
                      <Button type="submit" size="sm" variant="error">
                        Reprovar
                      </Button>
                    </form>
                  </div>
                </div>
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}