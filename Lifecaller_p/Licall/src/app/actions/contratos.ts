'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

// Schema de validação para Contrato
const ContratoSchema = z.object({
  atendimentoId: z.string().cuid(),
  valorAprovado: z.string().transform((val) => parseFloat(val)),
  parcelaMensal: z.string().transform((val) => parseFloat(val)),
  prazoMeses: z.string().transform((val) => parseInt(val)),
  taxaJuros: z.string().transform((val) => parseFloat(val)),
  coeficiente: z.string().transform((val) => parseFloat(val)),
  observacoes: z.string().optional(),
})

// Schema para upload de anexo
const AnexoSchema = z.object({
  contratoId: z.string().cuid(),
  description: z.string().optional(),
})

// Listar contratos com filtros
export async function getContratos(params?: {
  page?: number
  limit?: number
  status?: string
  search?: string
  orderBy?: 'createdAt' | 'valorAprovado' | 'dataEfetivacao'
  orderDir?: 'asc' | 'desc'
}) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const {
    page = 1,
    limit = 10,
    status,
    search,
    orderBy = 'createdAt',
    orderDir = 'desc'
  } = params || {}

  const where: any = {}

  if (status) {
    where.status = status
  }

  if (search) {
    where.OR = [
      {
        atendimento: {
          cliente: {
            nome: { contains: search, mode: 'insensitive' as const }
          }
        }
      },
      {
        atendimento: {
          cliente: {
            cpf: { contains: search }
          }
        }
      },
      {
        observacoes: { contains: search, mode: 'insensitive' as const }
      }
    ]
  }

  const [contratos, total] = await Promise.all([
    prisma.contrato.findMany({
      where,
      orderBy: { [orderBy]: orderDir },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        atendimento: {
          include: {
            cliente: {
              select: {
                id: true,
                nome: true,
                cpf: true,
                telefone: true
              }
            }
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true
          }
        },
        updatedBy: {
          select: {
            id: true,
            name: true
          }
        },
        anexos: {
          select: {
            id: true,
            filename: true,
            originalName: true,
            description: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            anexos: true
          }
        }
      }
    }),
    prisma.contrato.count({ where })
  ])

  return {
    contratos,
    pagination: {
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      limit
    }
  }
}

// Buscar contrato por ID
export async function getContrato(id: string) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const contrato = await prisma.contrato.findUnique({
    where: { id },
    include: {
      atendimento: {
        include: {
          cliente: true,
          assignee: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      createdBy: {
        select: {
          id: true,
          name: true
        }
      },
      updatedBy: {
        select: {
          id: true,
          name: true
        }
      },
      anexos: {
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  if (!contrato) {
    throw new Error('Contrato não encontrado')
  }

  return contrato
}

// Criar contrato a partir de atendimento aprovado
export async function createContrato(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const rawData = {
    atendimentoId: formData.get('atendimentoId') as string,
    valorAprovado: formData.get('valorAprovado') as string,
    parcelaMensal: formData.get('parcelaMensal') as string,
    prazoMeses: formData.get('prazoMeses') as string,
    taxaJuros: formData.get('taxaJuros') as string,
    coeficiente: formData.get('coeficiente') as string,
    observacoes: formData.get('observacoes') as string || undefined,
  }

  const validatedData = ContratoSchema.parse(rawData)

  // Verificar se atendimento existe e está no status correto
  const atendimento = await prisma.atendimento.findUnique({
    where: { id: validatedData.atendimentoId }
  })

  if (!atendimento) {
    throw new Error('Atendimento não encontrado')
  }

  if (atendimento.status !== 'SIMULACAO_APROVADA') {
    throw new Error('Atendimento deve estar com simulação aprovada')
  }

  // Verificar se já existe contrato para este atendimento
  const existingContrato = await prisma.contrato.findUnique({
    where: { atendimentoId: validatedData.atendimentoId }
  })

  if (existingContrato) {
    throw new Error('Já existe contrato para este atendimento')
  }

  const contrato = await prisma.contrato.create({
    data: {
      ...validatedData,
      createdById: user.id
    },
    include: {
      atendimento: {
        include: {
          cliente: true
        }
      }
    }
  })

  // Atualizar status do atendimento
  await prisma.atendimento.update({
    where: { id: validatedData.atendimentoId },
    data: { status: 'EM_FECHAMENTO' }
  })

  revalidatePath('/contratos')
  revalidatePath('/atendimentos')
  return contrato
}

// Atualizar contrato
export async function updateContrato(id: string, formData: FormData) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const contrato = await prisma.contrato.findUnique({
    where: { id }
  })

  if (!contrato) {
    throw new Error('Contrato não encontrado')
  }

  // Apenas criador ou superadmin podem editar
  if (contrato.createdById !== user.id && user.role !== 'superadmin') {
    throw new Error('Forbidden: Você não tem permissão para editar este contrato')
  }

  const rawData = {
    valorAprovado: formData.get('valorAprovado') as string,
    parcelaMensal: formData.get('parcelaMensal') as string,
    prazoMeses: formData.get('prazoMeses') as string,
    taxaJuros: formData.get('taxaJuros') as string,
    coeficiente: formData.get('coeficiente') as string,
    observacoes: formData.get('observacoes') as string || undefined,
  }

  const validatedData = {
    valorAprovado: parseFloat(rawData.valorAprovado),
    parcelaMensal: parseFloat(rawData.parcelaMensal),
    prazoMeses: parseInt(rawData.prazoMeses),
    taxaJuros: parseFloat(rawData.taxaJuros),
    coeficiente: parseFloat(rawData.coeficiente),
    observacoes: rawData.observacoes,
    updatedById: user.id
  }

  const updated = await prisma.contrato.update({
    where: { id },
    data: validatedData,
    include: {
      atendimento: {
        include: {
          cliente: true
        }
      }
    }
  })

  revalidatePath('/contratos')
  revalidatePath(`/contratos/${id}`)
  return updated
}

// Atualizar status do contrato
export async function updateContratoStatus(id: string, status: string) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const contrato = await prisma.contrato.findUnique({
    where: { id }
  })

  if (!contrato) {
    throw new Error('Contrato não encontrado')
  }

  // Verificar permissão baseada no status
  const allowedStatuses = ['AGUARDANDO_COMPROVANTES', 'COMPROVANTES_ANEXADOS', 'EFETIVADO', 'CANCELADO']
  if (!allowedStatuses.includes(status)) {
    throw new Error('Status inválido')
  }

  const updateData: any = {
    status,
    updatedById: user.id
  }

  // Se status for EFETIVADO, definir data de efetivação
  if (status === 'EFETIVADO') {
    updateData.dataEfetivacao = new Date()
  }

  const updated = await prisma.contrato.update({
    where: { id },
    data: updateData
  })

  revalidatePath('/contratos')
  revalidatePath(`/contratos/${id}`)
  return updated
}

// Upload de anexo
export async function uploadContratoAnexo(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const contratoId = formData.get('contratoId') as string
  const description = formData.get('description') as string
  const file = formData.get('file') as File

  if (!file) {
    throw new Error('Nenhum arquivo foi enviado')
  }

  // Validar contrato
  const contrato = await prisma.contrato.findUnique({
    where: { id: contratoId }
  })

  if (!contrato) {
    throw new Error('Contrato não encontrado')
  }

  // Criar diretório de uploads se não existir
  const uploadDir = join(process.cwd(), 'uploads', 'contratos', contratoId)
  await mkdir(uploadDir, { recursive: true })

  // Gerar nome único para o arquivo
  const fileExtension = file.name.split('.').pop()
  const filename = `${uuidv4()}.${fileExtension}`
  const filepath = join(uploadDir, filename)

  // Salvar arquivo
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  await writeFile(filepath, buffer)

  // Salvar informações no banco
  const anexo = await prisma.contratoAnexo.create({
    data: {
      contratoId,
      filename,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      path: filepath,
      url: `/uploads/contratos/${contratoId}/${filename}`,
      description: description || undefined
    }
  })

  // Atualizar status do contrato se necessário
  if (contrato.status === 'AGUARDANDO_COMPROVANTES') {
    await prisma.contrato.update({
      where: { id: contratoId },
      data: {
        status: 'COMPROVANTES_ANEXADOS',
        updatedById: user.id
      }
    })
  }

  revalidatePath('/contratos')
  revalidatePath(`/contratos/${contratoId}`)
  return anexo
}

// Excluir anexo
export async function deleteContratoAnexo(id: string) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const anexo = await prisma.contratoAnexo.findUnique({
    where: { id },
    include: {
      contrato: true
    }
  })

  if (!anexo) {
    throw new Error('Anexo não encontrado')
  }

  // Verificar permissão
  if (anexo.contrato.createdById !== user.id && user.role !== 'superadmin') {
    throw new Error('Forbidden: Você não tem permissão para excluir este anexo')
  }

  await prisma.contratoAnexo.delete({
    where: { id }
  })

  revalidatePath('/contratos')
  revalidatePath(`/contratos/${anexo.contratoId}`)
}

// Obter estatísticas de contratos
export async function getContratosStats() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const [
    total,
    aguardandoComprovantes,
    comprovantesAnexados,
    efetivados,
    cancelados,
    valorTotalEfetivado
  ] = await Promise.all([
    prisma.contrato.count(),
    prisma.contrato.count({ where: { status: 'AGUARDANDO_COMPROVANTES' } }),
    prisma.contrato.count({ where: { status: 'COMPROVANTES_ANEXADOS' } }),
    prisma.contrato.count({ where: { status: 'EFETIVADO' } }),
    prisma.contrato.count({ where: { status: 'CANCELADO' } }),
    prisma.contrato.aggregate({
      where: { status: 'EFETIVADO' },
      _sum: { valorAprovado: true }
    })
  ])

  return {
    total,
    aguardandoComprovantes,
    comprovantesAnexados,
    efetivados,
    cancelados,
    valorTotalEfetivado: valorTotalEfetivado._sum.valorAprovado || 0
  }
}