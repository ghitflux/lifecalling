'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'

// Schema de validação para Cliente
const ClienteSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF deve estar no formato XXX.XXX.XXX-XX'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  telefone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  cep: z.string().optional(),
  renda: z.string().optional().transform((val) => val ? parseFloat(val) : undefined),
  profissao: z.string().optional(),
})

// Listar clientes com paginação e filtros
export async function getClientes(params?: {
  page?: number
  limit?: number
  search?: string
  orderBy?: 'nome' | 'createdAt'
  orderDir?: 'asc' | 'desc'
}) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const {
    page = 1,
    limit = 10,
    search,
    orderBy = 'createdAt',
    orderDir = 'desc'
  } = params || {}

  const where = search ? {
    OR: [
      { nome: { contains: search, mode: 'insensitive' as const } },
      { cpf: { contains: search } },
      { email: { contains: search, mode: 'insensitive' as const } },
    ]
  } : {}

  const [clientes, total] = await Promise.all([
    prisma.cliente.findMany({
      where,
      orderBy: { [orderBy]: orderDir },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        clienteBancos: {
          include: {
            banco: true
          }
        },
        atendimentos: {
          select: {
            id: true,
            status: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 3
        },
        _count: {
          select: {
            atendimentos: true
          }
        }
      }
    }),
    prisma.cliente.count({ where })
  ])

  return {
    clientes,
    pagination: {
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      limit
    }
  }
}

// Buscar cliente por ID
export async function getCliente(id: string) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const cliente = await prisma.cliente.findUnique({
    where: { id },
    include: {
      clienteBancos: {
        include: {
          banco: true
        }
      },
      atendimentos: {
        orderBy: { createdAt: 'desc' },
        include: {
          assignee: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }
    }
  })

  if (!cliente) {
    throw new Error('Cliente não encontrado')
  }

  return cliente
}

// Criar cliente
export async function createCliente(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const rawData = {
    nome: formData.get('nome') as string,
    cpf: formData.get('cpf') as string,
    email: formData.get('email') as string || undefined,
    telefone: formData.get('telefone') as string,
    endereco: formData.get('endereco') as string || undefined,
    cidade: formData.get('cidade') as string || undefined,
    estado: formData.get('estado') as string || undefined,
    cep: formData.get('cep') as string || undefined,
    renda: formData.get('renda') as string || undefined,
    profissao: formData.get('profissao') as string || undefined,
  }

  const validatedData = ClienteSchema.parse(rawData)

  // Verificar se CPF já existe
  const existingCliente = await prisma.cliente.findUnique({
    where: { cpf: validatedData.cpf }
  })

  if (existingCliente) {
    throw new Error('CPF já cadastrado')
  }

  const cliente = await prisma.cliente.create({
    data: validatedData
  })

  revalidatePath('/clientes')
  return cliente
}

// Atualizar cliente
export async function updateCliente(id: string, formData: FormData) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const rawData = {
    nome: formData.get('nome') as string,
    cpf: formData.get('cpf') as string,
    email: formData.get('email') as string || undefined,
    telefone: formData.get('telefone') as string,
    endereco: formData.get('endereco') as string || undefined,
    cidade: formData.get('cidade') as string || undefined,
    estado: formData.get('estado') as string || undefined,
    cep: formData.get('cep') as string || undefined,
    renda: formData.get('renda') as string || undefined,
    profissao: formData.get('profissao') as string || undefined,
  }

  const validatedData = ClienteSchema.parse(rawData)

  // Verificar se cliente existe
  const existingCliente = await prisma.cliente.findUnique({
    where: { id }
  })

  if (!existingCliente) {
    throw new Error('Cliente não encontrado')
  }

  // Verificar se CPF já existe em outro cliente
  if (validatedData.cpf !== existingCliente.cpf) {
    const duplicateCpf = await prisma.cliente.findUnique({
      where: { cpf: validatedData.cpf }
    })

    if (duplicateCpf) {
      throw new Error('CPF já cadastrado')
    }
  }

  const cliente = await prisma.cliente.update({
    where: { id },
    data: validatedData
  })

  revalidatePath('/clientes')
  revalidatePath(`/clientes/${id}`)
  return cliente
}

// Atualizar campo específico (para edição inline)
export async function updateClienteField(id: string, field: string, value: string) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  // Campos permitidos para edição inline
  const allowedFields = ['telefone', 'email', 'endereco', 'profissao']
  if (!allowedFields.includes(field)) {
    throw new Error('Campo não permitido para edição')
  }

  const cliente = await prisma.cliente.findUnique({
    where: { id }
  })

  if (!cliente) {
    throw new Error('Cliente não encontrado')
  }

  // Validação específica por campo
  let validatedValue: string | number | null = value

  if (field === 'email' && value) {
    const emailSchema = z.string().email()
    emailSchema.parse(value)
  }

  if (field === 'telefone') {
    const phoneSchema = z.string().min(10)
    phoneSchema.parse(value)
  }

  const updated = await prisma.cliente.update({
    where: { id },
    data: {
      [field]: validatedValue || null
    }
  })

  revalidatePath('/clientes')
  revalidatePath(`/clientes/${id}`)
  return updated
}

// Excluir cliente
export async function deleteCliente(id: string) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  // Verificar se cliente tem atendimentos
  const atendimentosCount = await prisma.atendimento.count({
    where: { clienteId: id }
  })

  if (atendimentosCount > 0) {
    throw new Error('Não é possível excluir cliente com atendimentos')
  }

  await prisma.cliente.delete({
    where: { id }
  })

  revalidatePath('/clientes')
}