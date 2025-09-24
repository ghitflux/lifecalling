import { AtendimentoStatus } from '@prisma/client'

export const STATUS_LABELS: Record<AtendimentoStatus, string> = {
  DISPONIVEL: 'Disponível',
  ATRIBUIDO: 'Atribuído',
  PENDENTE_CALCULO: 'Pendente Cálculo',
  SIMULACAO_APROVADA: 'Simulação Aprovada',
  SIMULACAO_REPROVADA: 'Simulação Reprovada',
  EM_FECHAMENTO: 'Em Fechamento',
  CONTRATO_CONFIRMADO: 'Contrato Confirmado',
  ENVIADO_FINANCEIRO: 'Enviado Financeiro',
  CONTRATO_ATIVADO: 'Contrato Ativado',
  ENCERRADO_REPROVADO: 'Encerrado - Reprovado',
  ENCERRADO_NAO_APROVADO: 'Encerrado - Não Aprovado',
  ENCERRADO_ATIVADO: 'Encerrado - Ativado',
}

export const STATUS_COLORS: Record<AtendimentoStatus, string> = {
  DISPONIVEL: 'bg-blue-100 text-blue-800 border-blue-200',
  ATRIBUIDO: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  PENDENTE_CALCULO: 'bg-orange-100 text-orange-800 border-orange-200',
  SIMULACAO_APROVADA: 'bg-green-100 text-green-800 border-green-200',
  SIMULACAO_REPROVADA: 'bg-red-100 text-red-800 border-red-200',
  EM_FECHAMENTO: 'bg-purple-100 text-purple-800 border-purple-200',
  CONTRATO_CONFIRMADO: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  ENVIADO_FINANCEIRO: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  CONTRATO_ATIVADO: 'bg-teal-100 text-teal-800 border-teal-200',
  ENCERRADO_REPROVADO: 'bg-gray-100 text-gray-800 border-gray-200',
  ENCERRADO_NAO_APROVADO: 'bg-gray-100 text-gray-800 border-gray-200',
  ENCERRADO_ATIVADO: 'bg-green-100 text-green-800 border-green-200',
}

export const FINAL_STATUSES: AtendimentoStatus[] = [
  'ENCERRADO_REPROVADO',
  'ENCERRADO_NAO_APROVADO',
  'ENCERRADO_ATIVADO',
]

export function isFinalStatus(status: AtendimentoStatus): boolean {
  return FINAL_STATUSES.includes(status)
}

export function shouldReleaseLock(status: AtendimentoStatus): boolean {
  return status === 'CONTRATO_ATIVADO' || isFinalStatus(status)
}

export type StateTransition = {
  from: AtendimentoStatus
  to: AtendimentoStatus
  action: string
  requiresRole?: string[]
}

export const VALID_TRANSITIONS: StateTransition[] = [
  { from: 'DISPONIVEL', to: 'ATRIBUIDO', action: 'assign', requiresRole: ['atendente'] },
  { from: 'ATRIBUIDO', to: 'PENDENTE_CALCULO', action: 'sendToCalc', requiresRole: ['atendente'] },
  { from: 'PENDENTE_CALCULO', to: 'SIMULACAO_APROVADA', action: 'calcApprove', requiresRole: ['calculista'] },
  { from: 'PENDENTE_CALCULO', to: 'SIMULACAO_REPROVADA', action: 'calcReject', requiresRole: ['calculista'] },
  { from: 'SIMULACAO_APROVADA', to: 'EM_FECHAMENTO', action: 'sendToClosing', requiresRole: ['atendente'] },
  { from: 'EM_FECHAMENTO', to: 'CONTRATO_CONFIRMADO', action: 'closingApprove', requiresRole: ['gerente_fechamento'] },
  { from: 'CONTRATO_CONFIRMADO', to: 'ENVIADO_FINANCEIRO', action: 'sendToFinance', requiresRole: ['atendente'] },
  { from: 'ENVIADO_FINANCEIRO', to: 'CONTRATO_ATIVADO', action: 'financeConfirm', requiresRole: ['financeiro'] },
  { from: 'SIMULACAO_REPROVADA', to: 'ENCERRADO_REPROVADO', action: 'closeRejected', requiresRole: ['atendente'] },
  { from: 'SIMULACAO_APROVADA', to: 'ENCERRADO_NAO_APROVADO', action: 'closeClientDeclined', requiresRole: ['atendente'] },
  { from: 'CONTRATO_ATIVADO', to: 'ENCERRADO_ATIVADO', action: 'archive', requiresRole: ['atendente', 'superadmin'] },
]

export function isValidTransition(from: AtendimentoStatus, to: AtendimentoStatus, action: string): boolean {
  return VALID_TRANSITIONS.some(t => t.from === from && t.to === to && t.action === action)
}

export function getAvailableActions(status: AtendimentoStatus): StateTransition[] {
  return VALID_TRANSITIONS.filter(t => t.from === status)
}