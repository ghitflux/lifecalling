import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { QueueCard } from '@/ui/components/QueueCard'
import { Button } from '@/ui/components/Button'
import { Heading } from '@/ui/components/Heading'
import { closingApprove } from '../actions/atendimentos'
import { redirect } from 'next/navigation'

export default async function ClosingPage() {
  const user = await getCurrentUser()

  if (!user || !['gerente_fechamento', 'superadmin'].includes(user.role)) {
    redirect('/')
  }

  const atendimentos = await prisma.atendimento.findMany({
    where: {
      status: 'EM_FECHAMENTO',
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
        Fila de Fechamento
      </Heading>
      <p className="text-gray-600 mb-6">Atendimentos aguardando aprovação de fechamento</p>

      {atendimentos.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg">
            Nenhum atendimento em fechamento
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
                  <form action={closingApprove.bind(null, atendimento.id)}>
                    <Button type="submit" size="sm" variant="success">
                      Aprovar Fechamento
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