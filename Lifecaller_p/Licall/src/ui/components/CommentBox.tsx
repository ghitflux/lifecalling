import React, { useState } from 'react'
import { User, Comentario, TipoComentario } from '@prisma/client'
import { Button } from './Button'
import { Card } from './Card'

export interface CommentWithUser extends Comentario {
  user: User
  replies?: CommentWithUser[]
}

export interface CommentBoxProps {
  comments: CommentWithUser[]
  currentUser: User
  onAddComment: (content: string, type: TipoComentario, parentId?: string) => Promise<void>
  onEditComment?: (id: string, content: string) => Promise<void>
  onDeleteComment?: (id: string) => Promise<void>
  className?: string
  allowReplies?: boolean
  allowTypes?: boolean
}

export function CommentBox({
  comments,
  currentUser,
  onAddComment,
  onEditComment,
  onDeleteComment,
  className = '',
  allowReplies = true,
  allowTypes = true,
}: CommentBoxProps) {
  const [newComment, setNewComment] = useState('')
  const [commentType, setCommentType] = useState<TipoComentario>('INTERNO')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  const handleSubmitComment = async (parentId?: string) => {
    if (!newComment.trim()) return

    setIsSubmitting(true)
    try {
      await onAddComment(newComment.trim(), commentType, parentId)
      setNewComment('')
      setReplyingTo(null)
    } catch (error) {
      console.error('Error submitting comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditComment = async (id: string) => {
    if (!editContent.trim() || !onEditComment) return

    try {
      await onEditComment(id, editContent.trim())
      setEditingComment(null)
      setEditContent('')
    } catch (error) {
      console.error('Error editing comment:', error)
    }
  }

  const handleDeleteComment = async (id: string) => {
    if (!onDeleteComment) return

    if (window.confirm('Tem certeza que deseja excluir este comentário?')) {
      try {
        await onDeleteComment(id)
      } catch (error) {
        console.error('Error deleting comment:', error)
      }
    }
  }

  const formatDate = (date: Date | string) => {
    const d = new Date(date)
    const now = new Date()
    const diffInHours = (now.getTime() - d.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const getCommentTypeColor = (type: TipoComentario) => {
    switch (type) {
      case 'CLIENTE':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'OBSERVACAO':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getCommentTypeLabel = (type: TipoComentario) => {
    switch (type) {
      case 'CLIENTE':
        return 'Cliente'
      case 'OBSERVACAO':
        return 'Observação'
      default:
        return 'Interno'
    }
  }

  const renderCommentForm = (parentId?: string) => (
    <div className="space-y-3">
      {allowTypes && (
        <div className="flex space-x-2">
          {(['INTERNO', 'CLIENTE', 'OBSERVACAO'] as TipoComentario[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setCommentType(type)}
              className={`
                px-3 py-1 text-xs rounded-full border transition-colors
                ${commentType === type
                  ? getCommentTypeColor(type)
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }
              `}
            >
              {getCommentTypeLabel(type)}
            </button>
          ))}
        </div>
      )}

      <div className="flex space-x-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-600 text-sm font-medium">
              {currentUser.name.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
        <div className="flex-1">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={parentId ? 'Escrever uma resposta...' : 'Escrever um comentário...'}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            disabled={isSubmitting}
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-500">
              {newComment.length}/1000 caracteres
            </span>
            <div className="flex space-x-2">
              {parentId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setReplyingTo(null)
                    setNewComment('')
                  }}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => handleSubmitComment(parentId)}
                loading={isSubmitting}
                disabled={!newComment.trim() || newComment.length > 1000}
              >
                {parentId ? 'Responder' : 'Comentar'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderComment = (comment: CommentWithUser, level: number = 0) => (
    <div key={comment.id} className={level > 0 ? 'ml-8' : ''}>
      <div className="flex space-x-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-gray-600 text-sm font-medium">
              {comment.user.name.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
        <div className="flex-1">
          <div className="bg-gray-50 rounded-lg px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900">{comment.user.name}</span>
                <span className={`px-2 py-1 text-xs rounded-full border ${getCommentTypeColor(comment.tipo)}`}>
                  {getCommentTypeLabel(comment.tipo)}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDate(comment.createdAt)}
                </span>
              </div>

              {(comment.userId === currentUser.id || currentUser.role === 'superadmin') && (
                <div className="flex items-center space-x-1">
                  {onEditComment && (
                    <button
                      onClick={() => {
                        setEditingComment(comment.id)
                        setEditContent(comment.conteudo)
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  )}
                  {onDeleteComment && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </div>

            {editingComment === comment.id ? (
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                  rows={3}
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingComment(null)
                      setEditContent('')
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleEditComment(comment.id)}
                    disabled={!editContent.trim()}
                  >
                    Salvar
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-gray-800 text-sm whitespace-pre-wrap">
                  {comment.conteudo}
                </p>
                {allowReplies && level < 3 && (
                  <div className="mt-2">
                    <button
                      onClick={() => setReplyingTo(comment.id)}
                      className="text-primary-600 hover:text-primary-800 text-xs font-medium"
                    >
                      Responder
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Reply Form */}
          {replyingTo === comment.id && (
            <div className="mt-3">
              {renderCommentForm(comment.id)}
            </div>
          )}

          {/* Nested Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 space-y-3">
              {comment.replies.map((reply) => renderComment(reply, level + 1))}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <Card className={className} padding="lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Comentários ({comments.length})
          </h3>
        </div>

        {/* New Comment Form */}
        {renderCommentForm()}

        {/* Comments List */}
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p>Nenhum comentário ainda</p>
            <p className="text-sm mt-1">Seja o primeiro a comentar!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => renderComment(comment))}
          </div>
        )}
      </div>
    </Card>
  )
}