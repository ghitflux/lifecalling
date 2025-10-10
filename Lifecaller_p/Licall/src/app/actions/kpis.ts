'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'

// Schema de validação para KPI
const KPISchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  descricao: z.string().optional(),
  valor: z.string().transform((val) => parseFloat(val)),
  periodo: z.string().min(1, 'Período é obrigatório'),
  data: z.string().transform((val) => new Date(val)),
  categoria: z.string().min(1, 'Categoria é obrigatória'),
  meta: z.string().optional().transform((val) => val ? parseFloat(val) : undefined),
  unidade: z.string().optional(),
  status: z.enum(['ATIVO', 'INATIVO', 'ARQUIVADO']).default('ATIVO'),
})

// Listar KPIs com filtros
export async function getKPIs(params?: {
  page?: number
  limit?: number
  categoria?: string
  periodo?: string
  status?: string
  search?: string
  orderBy?: 'nome' | 'valor' | 'data' | 'createdAt'
  orderDir?: 'asc' | 'desc'
  dateFrom?: string
  dateTo?: string
}) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const {
    page = 1,
    limit = 20,
    categoria,
    periodo,
    status = 'ATIVO',
    search,
    orderBy = 'data',
    orderDir = 'desc',
    dateFrom,
    dateTo
  } = params || {}

  const where: any = {}

  if (categoria) {
    where.categoria = categoria
  }

  if (periodo) {
    where.periodo = periodo
  }

  if (status) {
    where.status = status
  }

  if (search) {
    where.OR = [
      { nome: { contains: search, mode: 'insensitive' as const } },
      { descricao: { contains: search, mode: 'insensitive' as const } },
      { categoria: { contains: search, mode: 'insensitive' as const } },
    ]
  }

  if (dateFrom || dateTo) {
    where.data = {}
    if (dateFrom) {
      where.data.gte = new Date(dateFrom)
    }
    if (dateTo) {
      where.data.lte = new Date(dateTo)
    }
  }

  const [kpis, total] = await Promise.all([
    prisma.kPI.findMany({
      where,
      orderBy: { [orderBy]: orderDir },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.kPI.count({ where })
  ])

  return {
    kpis,
    pagination: {
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      limit
    }
  }
}

// Buscar KPI por ID
export async function getKPI(id: string) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const kpi = await prisma.kPI.findUnique({
    where: { id }
  })

  if (!kpi) {
    throw new Error('KPI não encontrado')
  }

  return kpi
}

// Criar KPI
export async function createKPI(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  // Verificar permissão
  if (user.role !== 'superadmin' && user.role !== 'gerente_fechamento') {
    throw new Error('Forbidden: Apenas superadmin e gerentes podem criar KPIs')
  }

  const rawData = {
    nome: formData.get('nome') as string,
    descricao: formData.get('descricao') as string || undefined,
    valor: formData.get('valor') as string,
    periodo: formData.get('periodo') as string,
    data: formData.get('data') as string,
    categoria: formData.get('categoria') as string,
    meta: formData.get('meta') as string || undefined,
    unidade: formData.get('unidade') as string || undefined,
    status: (formData.get('status') as string) || 'ATIVO',
  }

  const validatedData = KPISchema.parse(rawData)

  const kpi = await prisma.kPI.create({
    data: validatedData
  })

  revalidatePath('/kpis')
  revalidatePath('/dashboard')
  return kpi
}

// Atualizar KPI
export async function updateKPI(id: string, formData: FormData) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  // Verificar permissão
  if (user.role !== 'superadmin' && user.role !== 'gerente_fechamento') {
    throw new Error('Forbidden: Apenas superadmin e gerentes podem editar KPIs')
  }

  const kpi = await prisma.kPI.findUnique({
    where: { id }
  })

  if (!kpi) {
    throw new Error('KPI não encontrado')
  }

  const rawData = {
    nome: formData.get('nome') as string,
    descricao: formData.get('descricao') as string || undefined,
    valor: formData.get('valor') as string,
    periodo: formData.get('periodo') as string,
    data: formData.get('data') as string,
    categoria: formData.get('categoria') as string,
    meta: formData.get('meta') as string || undefined,
    unidade: formData.get('unidade') as string || undefined,
    status: (formData.get('status') as string) || 'ATIVO',
  }

  const validatedData = KPISchema.parse(rawData)

  const updated = await prisma.kPI.update({
    where: { id },
    data: validatedData
  })

  revalidatePath('/kpis')
  revalidatePath(`/kpis/${id}`)
  revalidatePath('/dashboard')
  return updated
}

// Excluir KPI
export async function deleteKPI(id: string) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  // Verificar permissão
  if (user.role !== 'superadmin') {
    throw new Error('Forbidden: Apenas superadmin pode excluir KPIs')
  }

  const kpi = await prisma.kPI.findUnique({
    where: { id }
  })

  if (!kpi) {
    throw new Error('KPI não encontrado')
  }

  await prisma.kPI.delete({
    where: { id }
  })

  revalidatePath('/kpis')
  revalidatePath('/dashboard')
}

// Arquivar/Desarquivar KPI
export async function toggleKPIStatus(id: string, status: 'ATIVO' | 'INATIVO' | 'ARQUIVADO') {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  if (user.role !== 'superadmin' && user.role !== 'gerente_fechamento') {
    throw new Error('Forbidden: Apenas superadmin e gerentes podem alterar status de KPIs')
  }

  const kpi = await prisma.kPI.findUnique({
    where: { id }
  })

  if (!kpi) {
    throw new Error('KPI não encontrado')
  }

  const updated = await prisma.kPI.update({
    where: { id },
    data: { status }
  })

  revalidatePath('/kpis')
  revalidatePath('/dashboard')
  return updated
}

// Obter KPIs para dashboard
export async function getKPIsForDashboard(params?: {
  categoria?: string
  periodo?: string
  limit?: number
  dateFrom?: string
  dateTo?: string
}) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const {
    categoria,
    periodo,
    limit = 10,
    dateFrom,
    dateTo
  } = params || {}

  const where: any = {
    status: 'ATIVO'
  }

  if (categoria) {
    where.categoria = categoria
  }

  if (periodo) {
    where.periodo = periodo
  }

  // Filtro de data padrão: últimos 30 dias se não especificado
  const defaultDateFrom = new Date()
  defaultDateFrom.setDate(defaultDateFrom.getDate() - 30)

  where.data = {
    gte: dateFrom ? new Date(dateFrom) : defaultDateFrom,
    lte: dateTo ? new Date(dateTo) : new Date()
  }

  const kpis = await prisma.kPI.findMany({
    where,
    orderBy: { data: 'desc' },
    take: limit
  })

  return kpis
}

// Obter categorias disponíveis
export async function getKPICategories() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const categories = await prisma.kPI.findMany({
    select: {
      categoria: true
    },
    distinct: ['categoria'],
    where: {
      status: 'ATIVO'
    },
    orderBy: {
      categoria: 'asc'
    }
  })

  return categories.map(c => c.categoria)
}

// Obter períodos disponíveis
export async function getKPIPeriods() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const periods = await prisma.kPI.findMany({
    select: {
      periodo: true
    },
    distinct: ['periodo'],
    where: {
      status: 'ATIVO'
    },
    orderBy: {
      periodo: 'asc'
    }
  })

  return periods.map(p => p.periodo)
}

// Obter estatísticas de KPIs
export async function getKPIStats(params?: {
  categoria?: string
  periodo?: string
  dateFrom?: string
  dateTo?: string
}) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const {
    categoria,
    periodo,
    dateFrom,
    dateTo
  } = params || {}

  const where: any = {
    status: 'ATIVO'
  }

  if (categoria) {
    where.categoria = categoria
  }

  if (periodo) {
    where.periodo = periodo
  }

  if (dateFrom || dateTo) {
    where.data = {}
    if (dateFrom) {
      where.data.gte = new Date(dateFrom)
    }
    if (dateTo) {
      where.data.lte = new Date(dateTo)
    }
  }

  const [
    total,
    comMeta,
    metasAlcancadas,
    valorTotalKPIs,
    valorMedioKPI
  ] = await Promise.all([
    prisma.kPI.count({ where }),
    prisma.kPI.count({
      where: {
        ...where,
        meta: { not: null }
      }
    }),
    prisma.kPI.count({
      where: {
        ...where,
        AND: [
          { meta: { not: null } },
          // Comparar valor com meta usando SQL raw
          { valor: { gte: 0 } } // Placeholder - seria implementado com Prisma raw query para comparação valor >= meta
        ]
      }
    }),
    prisma.kPI.aggregate({
      where,
      _sum: { valor: true }
    }),
    prisma.kPI.aggregate({
      where,
      _avg: { valor: true }
    })
  ])

  return {
    total,
    comMeta,
    metasAlcancadas,
    valorTotal: valorTotalKPIs._sum.valor || 0,
    valorMedio: valorMedioKPI._avg.valor || 0,
    percentualMetasAlcancadas: comMeta > 0 ? (metasAlcancadas / comMeta) * 100 : 0
  }
}

// Criar múltiplos KPIs em lote
export async function createKPIsBatch(kpis: Array<{
  nome: string
  descricao?: string
  valor: number
  periodo: string
  data: string
  categoria: string
  meta?: number
  unidade?: string
}>) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  if (user.role !== 'superadmin') {
    throw new Error('Forbidden: Apenas superadmin pode criar KPIs em lote')
  }

  const validatedKPIs = kpis.map(kpi => ({
    ...kpi,
    data: new Date(kpi.data),
    status: 'ATIVO' as const
  }))

  const created = await prisma.kPI.createMany({
    data: validatedKPIs
  })

  revalidatePath('/kpis')
  revalidatePath('/dashboard')
  return created
}