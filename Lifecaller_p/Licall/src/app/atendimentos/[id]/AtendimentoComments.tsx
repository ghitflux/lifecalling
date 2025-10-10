'use client'

import React, { useState, useEffect } from 'react'
import { CommentBox, CommentWithUser } from '@/ui/components/CommentBox'
import { Card } from '@/ui/components/Card'
import { Button } from '@/ui/components/Button'
import { getComentarios, createComentario, updateComentario, deleteComentario } from '../../actions/comentarios'
import { User, TipoComentario } from '@prisma/client'

interface AtendimentoCommentsProps {
  atendimentoId: string
  currentUser: User
}

export default function AtendimentoComments({ atendimentoId, currentUser }: AtendimentoCommentsProps) {
  const [comments, setComments] = useState<CommentWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<string>('')

  const loadComments = async () => {
    setLoading(true)
    try {
      const data = await getComentarios(atendimentoId, {
        tipo: filterType || undefined,
        includeReplies: true
      })
      setComments(data)
    } catch (error) {
      console.error('Erro ao carregar comentários:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadComments()
  }, [atendimentoId, filterType])

  const handleAddComment = async (content: string, type: TipoComentario, parentId?: string) => {
    const formData = new FormData()
    formData.append('atendimentoId', atendimentoId)
    formData.append('tipo', type)
    formData.append('conteudo', content)
    if (parentId) {
      formData.append('parentId', parentId)
    }

    await createComentario(formData)
    await loadComments()
  }

  const handleEditComment = async (id: string, content: string) => {
    const formData = new FormData()
    formData.append('conteudo', content)

    await updateComentario(id, formData)
    await loadComments()
  }

  const handleDeleteComment = async (id: string) => {
    await deleteComentario(id)
    await loadComments()
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'INTERNO': 'Interno',
      'CLIENTE': 'Cliente',
      'OBSERVACAO': 'Observação'
    }
    return labels[type] || type
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'INTERNO': 'blue',
      'CLIENTE': 'green',
      'OBSERVACAO': 'yellow'
    }
    return colors[type] || 'gray'
  }

  if (loading) {
    return (
      <Card>
        <div className="animate-pulse p-6">
          <div className="h-6 bg-gray-300 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Comentários</h3>
            <p className="text-sm text-gray-500">
              Histórico de comunicação e observações sobre este atendimento
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Filtrar:</span>
            <div className="flex space-x-1">
              <button
                onClick={() => setFilterType('')}
                className={`px-3 py-1 text-xs rounded-full ${
                  filterType === ''
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Todos
              </button>
              {['INTERNO', 'CLIENTE', 'OBSERVACAO'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1 text-xs rounded-full ${
                    filterType === type
                      ? `bg-${getTypeColor(type)}-600 text-white`
                      : `bg-${getTypeColor(type)}-100 text-${getTypeColor(type)}-700 hover:bg-${getTypeColor(type)}-200`
                  }`}
                >
                  {getTypeLabel(type)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {comments.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-gray-500 mb-4">
              {filterType ? `Nenhum comentário ${getTypeLabel(filterType).toLowerCase()} encontrado` : 'Nenhum comentário ainda'}
            </p>
            <p className="text-sm text-gray-400">
              Seja o primeiro a adicionar um comentário sobre este atendimento
            </p>
          </div>
        ) : (
          <CommentBox
            comments={comments}
            currentUser={currentUser}
            onAddComment={handleAddComment}
            onEditComment={handleEditComment}
            onDeleteComment={handleDeleteComment}
            allowReplies={true}
            allowTypes={true}
          />
        )}

        {/* Estatísticas */}
        {comments.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{comments.length}</div>
                <div className="text-sm text-gray-500">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {comments.filter(c => c.tipo === 'INTERNO').length}
                </div>
                <div className="text-sm text-gray-500">Internos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {comments.filter(c => c.tipo === 'CLIENTE').length}
                </div>
                <div className="text-sm text-gray-500">Cliente</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {comments.filter(c => c.tipo === 'OBSERVACAO').length}
                </div>
                <div className="text-sm text-gray-500">Observações</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}