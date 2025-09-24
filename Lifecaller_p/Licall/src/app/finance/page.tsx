import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { QueueCard } from '@/ui/components/QueueCard'
import { Button } from '@/ui/components/Button'
import { Heading } from '@/ui/components/Heading'
import { financeConfirm } from '../actions/atendimentos'
import { redirect } from 'next/navigation'

export default async function FinancePage() {
  const user = await getCurrentUser()

  if (!user || !['financeiro', 'superadmin'].includes(user.role)) {
    redirect('/')
  }

  const atendimentos = await prisma.atendimento.findMany({
    where: {
      status: 'ENVIADO_FINANCEIRO',
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
        Fila Financeiro
      </Heading>
      <p className="text-gray-600 mb-6">Atendimentos aguardando confirmação financeira</p>

      {atendimentos.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg">
            Nenhum atendimento aguardando financeiro
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {atendimentos.map((atendimento) => (
            <QueueCard
              key={atendimento.id}
              atendimento={atendimento}
              actions={
                <div className="flex gap-2">
                  <form action={financeConfirm.bind(null, atendimento.id)}>
                    <Button type="submit" size="sm" variant="success">
                      Confirmar Ativação
                    </Button>
                  </form>
                </div>
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}