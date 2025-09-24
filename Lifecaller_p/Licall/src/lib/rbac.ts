import { Role, AtendimentoStatus } from '@prisma/client'
import { getAvailableActions } from './state'

export type ActionPermission = {
  action: string
  allowed: boolean
  reason?: string
}

export function getAllowedActions(status: AtendimentoStatus, userRole: Role): ActionPermission[] {
  const availableActions = getAvailableActions(status)

  return availableActions.map(transition => {
    const allowed = userRole === 'superadmin' ||
                   (transition.requiresRole?.includes(userRole) ?? false)

    return {
      action: transition.action,
      allowed,
      reason: allowed ? undefined : `Requer role: ${transition.requiresRole?.join(', ')}`
    }
  })
}

export function canUserPerformAction(status: AtendimentoStatus, userRole: Role, action: string): boolean {
  const permissions = getAllowedActions(status, userRole)
  return permissions.find(p => p.action === action)?.allowed ?? false
}

export function getVisibleAtendimentosForRole(role: Role): {
  statuses: AtendimentoStatus[]
  description: string
} {
  switch (role) {
    case 'atendente':
      return {
        statuses: ['DISPONIVEL', 'ATRIBUIDO', 'SIMULACAO_APROVADA', 'SIMULACAO_REPROVADA', 'CONTRATO_CONFIRMADO'],
        description: 'Atendimentos disponíveis e atribuídos a você'
      }

    case 'calculista':
      return {
        statuses: ['PENDENTE_CALCULO'],
        description: 'Atendimentos pendentes de cálculo'
      }

    case 'gerente_fechamento':
      return {
        statuses: ['EM_FECHAMENTO'],
        description: 'Atendimentos em fechamento'
      }

    case 'financeiro':
      return {
        statuses: ['ENVIADO_FINANCEIRO'],
        description: 'Atendimentos enviados para financeiro'
      }

    case 'superadmin':
      return {
        statuses: [
          'DISPONIVEL',
          'ATRIBUIDO',
          'PENDENTE_CALCULO',
          'SIMULACAO_APROVADA',
          'SIMULACAO_REPROVADA',
          'EM_FECHAMENTO',
          'CONTRATO_CONFIRMADO',
          'ENVIADO_FINANCEIRO',
          'CONTRATO_ATIVADO',
          'ENCERRADO_REPROVADO',
          'ENCERRADO_NAO_APROVADO',
          'ENCERRADO_ATIVADO',
        ],
        description: 'Todos os atendimentos (superadmin)'
      }

    default:
      return {
        statuses: [],
        description: 'Nenhum acesso'
      }
  }
}

export function canAccessRoute(route: string, userRole: Role): boolean {
  switch (route) {
    case '/':
      return ['atendente', 'superadmin'].includes(userRole)

    case '/calc':
      return ['calculista', 'superadmin'].includes(userRole)

    case '/closing':
      return ['gerente_fechamento', 'superadmin'].includes(userRole)

    case '/finance':
      return ['financeiro', 'superadmin'].includes(userRole)

    default:
      return true
  }
}

export const ROLE_LABELS: Record<Role, string> = {
  atendente: 'Atendente',
  calculista: 'Calculista',
  gerente_fechamento: 'Gerente de Fechamento',
  financeiro: 'Financeiro',
  superadmin: 'Super Admin',
}