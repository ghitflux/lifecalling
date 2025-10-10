'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'

// Schema de validação para Comentário
const ComentarioSchema = z.object({
  atendimentoId: z.string().cuid(),
  tipo: z.enum(['INTERNO', 'CLIENTE', 'OBSERVACAO']),
  conteudo: z.string().min(1, 'Conteúdo não pode estar vazio'),
  parentId: z.string().cuid().optional(),
})

// Listar comentários de um atendimento
export async function getComentarios(atendimentoId: string, params?: {
  tipo?: string
  includeReplies?: boolean
}) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const { tipo, includeReplies = true } = params || {}

  const where: any = { atendimentoId }

  // Filtrar por tipo se especificado
  if (tipo) {
    where.tipo = tipo
  }

  // Buscar apenas comentários principais (sem parentId) se includeReplies for true
  if (includeReplies) {
    where.parentId = null
  }

  const comentarios = await prisma.comentario.findMany({
    where,
    orderBy: { createdAt: 'asc' },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          role: true
        }
      },
      parent: includeReplies ? {
        select: {
          id: true,
          conteudo: true,
          user: {
            select: {
              name: true
            }
          }
        }
      } : undefined,
      replies: includeReplies ? {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true
            }
          },
          replies: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  role: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      } : undefined
    }
  })

  return comentarios
}

// Buscar comentário por ID
export async function getComentario(id: string) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const comentario = await prisma.comentario.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          role: true
        }
      },
      atendimento: {
        select: {
          id: true,
          status: true
        }
      },
      parent: {
        select: {
          id: true,
          conteudo: true,
          user: {
            select: {
              name: true
            }
          }
        }
      },
      replies: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      }
    }
  })

  if (!comentario) {
    throw new Error('Comentário não encontrado')
  }

  return comentario
}

// Criar comentário
export async function createComentario(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const rawData = {
    atendimentoId: formData.get('atendimentoId') as string,
    tipo: formData.get('tipo') as string,
    conteudo: formData.get('conteudo') as string,
    parentId: formData.get('parentId') as string || undefined,
  }

  const validatedData = ComentarioSchema.parse(rawData)

  // Verificar se atendimento existe
  const atendimento = await prisma.atendimento.findUnique({
    where: { id: validatedData.atendimentoId }
  })

  if (!atendimento) {
    throw new Error('Atendimento não encontrado')
  }

  // Verificar se parent existe (para replies)
  if (validatedData.parentId) {
    const parent = await prisma.comentario.findUnique({
      where: { id: validatedData.parentId }
    })

    if (!parent) {
      throw new Error('Comentário pai não encontrado')
    }

    // Verificar se não está tentando criar reply de reply de reply (máximo 3 níveis)
    const parentWithGrandparent = await prisma.comentario.findUnique({
      where: { id: validatedData.parentId },
      include: { parent: true }
    })

    if (parentWithGrandparent?.parent?.parentId) {
      throw new Error('Máximo de 3 níveis de replies permitido')
    }
  }

  // Verificar permissão baseada no tipo de comentário
  if (validatedData.tipo === 'CLIENTE' && user.role !== 'atendente' && user.role !== 'superadmin') {
    throw new Error('Forbidden: Apenas atendentes podem criar comentários de cliente')
  }

  const comentario = await prisma.comentario.create({
    data: {
      ...validatedData,
      userId: user.id
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          role: true
        }
      },
      parent: {
        select: {
          id: true,
          conteudo: true,
          user: {
            select: {
              name: true
            }
          }
        }
      }
    }
  })

  revalidatePath('/atendimentos')
  revalidatePath(`/atendimentos/${validatedData.atendimentoId}`)
  return comentario
}

// Atualizar comentário
export async function updateComentario(id: string, formData: FormData) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const comentario = await prisma.comentario.findUnique({
    where: { id }
  })

  if (!comentario) {
    throw new Error('Comentário não encontrado')
  }

  // Verificar se o usuário é o autor ou superadmin
  if (comentario.userId !== user.id && user.role !== 'superadmin') {
    throw new Error('Forbidden: Você só pode editar seus próprios comentários')
  }

  const conteudo = formData.get('conteudo') as string
  if (!conteudo || conteudo.trim().length === 0) {
    throw new Error('Conteúdo não pode estar vazio')
  }

  const updated = await prisma.comentario.update({
    where: { id },
    data: {
      conteudo: conteudo.trim()
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          role: true
        }
      },
      parent: {
        select: {
          id: true,
          conteudo: true,
          user: {
            select: {
              name: true
            }
          }
        }
      }
    }
  })

  revalidatePath('/atendimentos')
  revalidatePath(`/atendimentos/${comentario.atendimentoId}`)
  return updated
}

// Excluir comentário
export async function deleteComentario(id: string) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const comentario = await prisma.comentario.findUnique({
    where: { id },
    include: {
      replies: true
    }
  })

  if (!comentario) {
    throw new Error('Comentário não encontrado')
  }

  // Verificar se o usuário é o autor ou superadmin
  if (comentario.userId !== user.id && user.role !== 'superadmin') {
    throw new Error('Forbidden: Você só pode excluir seus próprios comentários')
  }

  // Verificar se tem replies - se tiver, não pode excluir
  if (comentario.replies.length > 0) {
    throw new Error('Não é possível excluir comentário que possui respostas')
  }

  await prisma.comentario.delete({
    where: { id }
  })

  revalidatePath('/atendimentos')
  revalidatePath(`/atendimentos/${comentario.atendimentoId}`)
}

// Obter estatísticas de comentários por atendimento
export async function getComentariosStats(atendimentoId: string) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const [
    total,
    internos,
    clientes,
    observacoes,
    comReplies
  ] = await Promise.all([
    prisma.comentario.count({ where: { atendimentoId } }),
    prisma.comentario.count({ where: { atendimentoId, tipo: 'INTERNO' } }),
    prisma.comentario.count({ where: { atendimentoId, tipo: 'CLIENTE' } }),
    prisma.comentario.count({ where: { atendimentoId, tipo: 'OBSERVACAO' } }),
    prisma.comentario.count({ where: { atendimentoId, parentId: { not: null } } })
  ])

  return {
    total,
    internos,
    clientes,
    observacoes,
    comReplies,
    principais: total - comReplies
  }
}

// Marcar comentários como lidos (para futuras implementações de notificações)
export async function markComentariosAsRead(atendimentoId: string) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  // Por enquanto apenas um placeholder - pode ser expandido para sistema de notificações
  return { success: true, atendimentoId, userId: user.id }
}

// Buscar comentários por conteúdo (search)
export async function searchComentarios(params: {
  search: string
  atendimentoId?: string
  tipo?: string
  limit?: number
}) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const { search, atendimentoId, tipo, limit = 50 } = params

  const where: any = {
    conteudo: {
      contains: search,
      mode: 'insensitive' as const
    }
  }

  if (atendimentoId) {
    where.atendimentoId = atendimentoId
  }

  if (tipo) {
    where.tipo = tipo
  }

  const comentarios = await prisma.comentario.findMany({
    where,
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          role: true
        }
      },
      atendimento: {
        select: {
          id: true,
          status: true,
          cliente: {
            select: {
              nome: true,
              cpf: true
            }
          }
        }
      }
    }
  })

  return comentarios
}