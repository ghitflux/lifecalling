'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { isValidTransition, shouldReleaseLock } from '@/lib/state'
import { canUserPerformAction } from '@/lib/rbac'
import { CalcApproveSchema, CalcRejectSchema } from '@/lib/validators'

async function createAuditLog(
  atendimentoId: string,
  event: string,
  payload?: any,
  actorId?: string
) {
  await prisma.auditLog.create({
    data: {
      atendimentoId,
      event,
      payload: payload || {},
      actorId,
    },
  })
}

export async function assign(atendimentoId: string) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const atendimento = await prisma.atendimento.findUnique({
    where: { id: atendimentoId },
  })

  if (!atendimento) {
    throw new Error('Atendimento não encontrado')
  }

  if (atendimento.status !== 'DISPONIVEL') {
    throw new Error('Atendimento não está disponível')
  }

  if (!canUserPerformAction(atendimento.status, user.role, 'assign')) {
    throw new Error('Forbidden: Você não tem permissão para esta ação')
  }

  const updated = await prisma.atendimento.update({
    where: { id: atendimentoId },
    data: {
      status: 'ATRIBUIDO',
      assigneeId: user.id,
      lockActive: true,
      lockOwnerId: user.id,
      lockStartedAt: new Date(),
    },
  })

  await createAuditLog(atendimentoId, 'ASSIGNED', { assigneeId: user.id }, user.id)

  revalidatePath('/')
  return updated
}

export async function sendToCalc(atendimentoId: string) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const atendimento = await prisma.atendimento.findUnique({
    where: { id: atendimentoId },
  })

  if (!atendimento) {
    throw new Error('Atendimento não encontrado')
  }

  if (!isValidTransition(atendimento.status, 'PENDENTE_CALCULO', 'sendToCalc')) {
    throw new Error('Transição inválida')
  }

  if (!canUserPerformAction(atendimento.status, user.role, 'sendToCalc')) {
    throw new Error('Forbidden: Você não tem permissão para esta ação')
  }

  const updated = await prisma.atendimento.update({
    where: { id: atendimentoId },
    data: {
      status: 'PENDENTE_CALCULO',
    },
  })

  await createAuditLog(atendimentoId, 'SENT_TO_CALC', {}, user.id)

  revalidatePath('/')
  revalidatePath('/calc')
  return updated
}

export async function calcApprove(atendimentoId: string, formData: FormData) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const atendimento = await prisma.atendimento.findUnique({
    where: { id: atendimentoId },
  })

  if (!atendimento) {
    throw new Error('Atendimento não encontrado')
  }

  if (!canUserPerformAction(atendimento.status, user.role, 'calcApprove')) {
    throw new Error('Forbidden: Você não tem permissão para esta ação')
  }

  const rawData = {
    aprovado: true,
    valor_liberado: formData.get('valor_liberado') ? Number(formData.get('valor_liberado')) : undefined,
    parcela_total: formData.get('parcela_total') ? Number(formData.get('parcela_total')) : undefined,
    coeficiente: formData.get('coeficiente') ? Number(formData.get('coeficiente')) : undefined,
    observacoes: formData.get('observacoes') as string || undefined,
  }

  const validatedData = CalcApproveSchema.parse(rawData)

  const updated = await prisma.atendimento.update({
    where: { id: atendimentoId },
    data: {
      status: 'SIMULACAO_APROVADA',
      calcResult: validatedData,
    },
  })

  await createAuditLog(atendimentoId, 'CALC_APPROVED', validatedData, user.id)

  revalidatePath('/calc')
  return updated
}

export async function calcReject(atendimentoId: string, formData: FormData) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const atendimento = await prisma.atendimento.findUnique({
    where: { id: atendimentoId },
  })

  if (!atendimento) {
    throw new Error('Atendimento não encontrado')
  }

  if (!canUserPerformAction(atendimento.status, user.role, 'calcReject')) {
    throw new Error('Forbidden: Você não tem permissão para esta ação')
  }

  const rawData = {
    motivo: formData.get('motivo') as string,
  }

  const validatedData = CalcRejectSchema.parse(rawData)

  const calcResult = {
    aprovado: false,
    motivo: validatedData.motivo,
  }

  const updated = await prisma.atendimento.update({
    where: { id: atendimentoId },
    data: {
      status: 'SIMULACAO_REPROVADA',
      calcResult,
    },
  })

  await createAuditLog(atendimentoId, 'CALC_REJECTED', calcResult, user.id)

  revalidatePath('/calc')
  return updated
}

export async function sendToClosing(atendimentoId: string) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const atendimento = await prisma.atendimento.findUnique({
    where: { id: atendimentoId },
  })

  if (!atendimento) {
    throw new Error('Atendimento não encontrado')
  }

  if (!canUserPerformAction(atendimento.status, user.role, 'sendToClosing')) {
    throw new Error('Forbidden: Você não tem permissão para esta ação')
  }

  const updated = await prisma.atendimento.update({
    where: { id: atendimentoId },
    data: {
      status: 'EM_FECHAMENTO',
    },
  })

  await createAuditLog(atendimentoId, 'SENT_TO_CLOSING', {}, user.id)

  revalidatePath('/')
  revalidatePath('/closing')
  return updated
}

export async function closingApprove(atendimentoId: string) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const atendimento = await prisma.atendimento.findUnique({
    where: { id: atendimentoId },
  })

  if (!atendimento) {
    throw new Error('Atendimento não encontrado')
  }

  if (!canUserPerformAction(atendimento.status, user.role, 'closingApprove')) {
    throw new Error('Forbidden: Você não tem permissão para esta ação')
  }

  const updated = await prisma.atendimento.update({
    where: { id: atendimentoId },
    data: {
      status: 'CONTRATO_CONFIRMADO',
      closingApprovedAt: new Date(),
    },
  })

  await createAuditLog(atendimentoId, 'CLOSING_APPROVED', {}, user.id)

  revalidatePath('/closing')
  return updated
}

export async function sendToFinance(atendimentoId: string) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const atendimento = await prisma.atendimento.findUnique({
    where: { id: atendimentoId },
  })

  if (!atendimento) {
    throw new Error('Atendimento não encontrado')
  }

  if (!canUserPerformAction(atendimento.status, user.role, 'sendToFinance')) {
    throw new Error('Forbidden: Você não tem permissão para esta ação')
  }

  const updated = await prisma.atendimento.update({
    where: { id: atendimentoId },
    data: {
      status: 'ENVIADO_FINANCEIRO',
    },
  })

  await createAuditLog(atendimentoId, 'SENT_TO_FINANCE', {}, user.id)

  revalidatePath('/')
  revalidatePath('/finance')
  return updated
}

export async function financeConfirm(atendimentoId: string) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const atendimento = await prisma.atendimento.findUnique({
    where: { id: atendimentoId },
  })

  if (!atendimento) {
    throw new Error('Atendimento não encontrado')
  }

  if (!canUserPerformAction(atendimento.status, user.role, 'financeConfirm')) {
    throw new Error('Forbidden: Você não tem permissão para esta ação')
  }

  const updated = await prisma.atendimento.update({
    where: { id: atendimentoId },
    data: {
      status: 'CONTRATO_ATIVADO',
      financeActivationAt: new Date(),
      lockActive: false,
      lockOwnerId: null,
      lockStartedAt: null,
    },
  })

  await createAuditLog(atendimentoId, 'FINANCE_CONFIRMED', {}, user.id)

  revalidatePath('/finance')
  return updated
}

export async function closeClientDeclined(atendimentoId: string) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const atendimento = await prisma.atendimento.findUnique({
    where: { id: atendimentoId },
  })

  if (!atendimento) {
    throw new Error('Atendimento não encontrado')
  }

  if (!canUserPerformAction(atendimento.status, user.role, 'closeClientDeclined')) {
    throw new Error('Forbidden: Você não tem permissão para esta ação')
  }

  const updated = await prisma.atendimento.update({
    where: { id: atendimentoId },
    data: {
      status: 'ENCERRADO_NAO_APROVADO',
      lockActive: false,
      lockOwnerId: null,
      lockStartedAt: null,
    },
  })

  await createAuditLog(atendimentoId, 'CLOSED_CLIENT_DECLINED', {}, user.id)

  revalidatePath('/')
  return updated
}

export async function closeRejected(atendimentoId: string) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const atendimento = await prisma.atendimento.findUnique({
    where: { id: atendimentoId },
  })

  if (!atendimento) {
    throw new Error('Atendimento não encontrado')
  }

  if (!canUserPerformAction(atendimento.status, user.role, 'closeRejected')) {
    throw new Error('Forbidden: Você não tem permissão para esta ação')
  }

  const updated = await prisma.atendimento.update({
    where: { id: atendimentoId },
    data: {
      status: 'ENCERRADO_REPROVADO',
      lockActive: false,
      lockOwnerId: null,
      lockStartedAt: null,
    },
  })

  await createAuditLog(atendimentoId, 'CLOSED_REJECTED', {}, user.id)

  revalidatePath('/')
  return updated
}

export async function archive(atendimentoId: string) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const atendimento = await prisma.atendimento.findUnique({
    where: { id: atendimentoId },
  })

  if (!atendimento) {
    throw new Error('Atendimento não encontrado')
  }

  if (!canUserPerformAction(atendimento.status, user.role, 'archive')) {
    throw new Error('Forbidden: Você não tem permissão para esta ação')
  }

  const updated = await prisma.atendimento.update({
    where: { id: atendimentoId },
    data: {
      status: 'ENCERRADO_ATIVADO',
      lockActive: false,
      lockOwnerId: null,
      lockStartedAt: null,
    },
  })

  await createAuditLog(atendimentoId, 'ARCHIVED', {}, user.id)

  revalidatePath('/')
  return updated
}