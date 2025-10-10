'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'

// Schema de validação para Banco
const BancoSchema = z.object({
  codigo: z.string().min(3, 'Código deve ter pelo menos 3 caracteres'),
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  descricao: z.string().optional(),
  ativo: z.boolean().default(true),
})

// Schema para ClienteBanco
const ClienteBancoSchema = z.object({
  clienteId: z.string().cuid(),
  bancoId: z.string().cuid(),
  agencia: z.string().optional(),
  conta: z.string().optional(),
  principal: z.boolean().default(false),
})

// Listar bancos
export async function getBancos(params?: {
  ativo?: boolean
  search?: string
}) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const { ativo, search } = params || {}

  const where: any = {}

  if (ativo !== undefined) {
    where.ativo = ativo
  }

  if (search) {
    where.OR = [
      { nome: { contains: search, mode: 'insensitive' as const } },
      { codigo: { contains: search } },
    ]
  }

  const bancos = await prisma.banco.findMany({
    where,
    orderBy: { nome: 'asc' },
    include: {
      _count: {
        select: {
          clienteBancos: true
        }
      }
    }
  })

  return bancos
}

// Buscar banco por ID
export async function getBanco(id: string) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const banco = await prisma.banco.findUnique({
    where: { id },
    include: {
      clienteBancos: {
        include: {
          cliente: {
            select: {
              id: true,
              nome: true,
              cpf: true
            }
          }
        }
      },
      _count: {
        select: {
          clienteBancos: true
        }
      }
    }
  })

  if (!banco) {
    throw new Error('Banco não encontrado')
  }

  return banco
}

// Criar banco
export async function createBanco(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  // Verificar permissão (apenas superadmin pode criar bancos)
  if (user.role !== 'superadmin') {
    throw new Error('Forbidden: Apenas superadmin pode criar bancos')
  }

  const rawData = {
    codigo: formData.get('codigo') as string,
    nome: formData.get('nome') as string,
    descricao: formData.get('descricao') as string || undefined,
    ativo: formData.get('ativo') === 'true',
  }

  const validatedData = BancoSchema.parse(rawData)

  // Verificar se código já existe
  const existingBanco = await prisma.banco.findUnique({
    where: { codigo: validatedData.codigo }
  })

  if (existingBanco) {
    throw new Error('Código do banco já existe')
  }

  const banco = await prisma.banco.create({
    data: validatedData
  })

  revalidatePath('/bancos')
  return banco
}

// Atualizar banco
export async function updateBanco(id: string, formData: FormData) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  // Verificar permissão
  if (user.role !== 'superadmin') {
    throw new Error('Forbidden: Apenas superadmin pode editar bancos')
  }

  const rawData = {
    codigo: formData.get('codigo') as string,
    nome: formData.get('nome') as string,
    descricao: formData.get('descricao') as string || undefined,
    ativo: formData.get('ativo') === 'true',
  }

  const validatedData = BancoSchema.parse(rawData)

  const banco = await prisma.banco.findUnique({
    where: { id }
  })

  if (!banco) {
    throw new Error('Banco não encontrado')
  }

  // Verificar se código já existe em outro banco
  if (validatedData.codigo !== banco.codigo) {
    const duplicateCode = await prisma.banco.findUnique({
      where: { codigo: validatedData.codigo }
    })

    if (duplicateCode) {
      throw new Error('Código do banco já existe')
    }
  }

  const updated = await prisma.banco.update({
    where: { id },
    data: validatedData
  })

  revalidatePath('/bancos')
  revalidatePath(`/bancos/${id}`)
  return updated
}

// Ativar/Desativar banco
export async function toggleBancoStatus(id: string) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  if (user.role !== 'superadmin') {
    throw new Error('Forbidden: Apenas superadmin pode alterar status de bancos')
  }

  const banco = await prisma.banco.findUnique({
    where: { id }
  })

  if (!banco) {
    throw new Error('Banco não encontrado')
  }

  const updated = await prisma.banco.update({
    where: { id },
    data: {
      ativo: !banco.ativo
    }
  })

  revalidatePath('/bancos')
  return updated
}

// Associar cliente ao banco
export async function createClienteBanco(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const rawData = {
    clienteId: formData.get('clienteId') as string,
    bancoId: formData.get('bancoId') as string,
    agencia: formData.get('agencia') as string || undefined,
    conta: formData.get('conta') as string || undefined,
    principal: formData.get('principal') === 'true',
  }

  const validatedData = ClienteBancoSchema.parse(rawData)

  // Verificar se associação já existe
  const existing = await prisma.clienteBanco.findUnique({
    where: {
      clienteId_bancoId: {
        clienteId: validatedData.clienteId,
        bancoId: validatedData.bancoId
      }
    }
  })

  if (existing) {
    throw new Error('Cliente já possui conta neste banco')
  }

  // Se for principal, desmarcar outras como principal
  if (validatedData.principal) {
    await prisma.clienteBanco.updateMany({
      where: {
        clienteId: validatedData.clienteId,
        principal: true
      },
      data: {
        principal: false
      }
    })
  }

  const clienteBanco = await prisma.clienteBanco.create({
    data: validatedData,
    include: {
      cliente: {
        select: {
          id: true,
          nome: true
        }
      },
      banco: {
        select: {
          id: true,
          nome: true,
          codigo: true
        }
      }
    }
  })

  revalidatePath('/clientes')
  revalidatePath(`/clientes/${validatedData.clienteId}`)
  return clienteBanco
}

// Atualizar ClienteBanco
export async function updateClienteBanco(id: string, formData: FormData) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const clienteBanco = await prisma.clienteBanco.findUnique({
    where: { id }
  })

  if (!clienteBanco) {
    throw new Error('Relação cliente-banco não encontrada')
  }

  const rawData = {
    agencia: formData.get('agencia') as string || undefined,
    conta: formData.get('conta') as string || undefined,
    principal: formData.get('principal') === 'true',
  }

  // Se for principal, desmarcar outras como principal
  if (rawData.principal) {
    await prisma.clienteBanco.updateMany({
      where: {
        clienteId: clienteBanco.clienteId,
        principal: true,
        id: { not: id }
      },
      data: {
        principal: false
      }
    })
  }

  const updated = await prisma.clienteBanco.update({
    where: { id },
    data: rawData,
    include: {
      cliente: {
        select: {
          id: true,
          nome: true
        }
      },
      banco: {
        select: {
          id: true,
          nome: true,
          codigo: true
        }
      }
    }
  })

  revalidatePath('/clientes')
  revalidatePath(`/clientes/${clienteBanco.clienteId}`)
  return updated
}

// Remover associação cliente-banco
export async function deleteClienteBanco(id: string) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const clienteBanco = await prisma.clienteBanco.findUnique({
    where: { id }
  })

  if (!clienteBanco) {
    throw new Error('Relação cliente-banco não encontrada')
  }

  await prisma.clienteBanco.delete({
    where: { id }
  })

  revalidatePath('/clientes')
  revalidatePath(`/clientes/${clienteBanco.clienteId}`)
}