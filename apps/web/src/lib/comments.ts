/**
 * Cliente de API para sistema unificado de comentários.
 * Substitui observações dispersas com canais específicos.
 */
import { api } from './api';

export type Channel = 'ATENDIMENTO' | 'SIMULACAO' | 'FECHAMENTO' | 'CLIENTE';

export interface Comment {
  id: string;
  case_id: number;
  author_id: number | null;
  author_name: string;
  role: string;
  channel: Channel;
  content: string;
  parent_id: string | null;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
}

export interface CommentCreate {
  case_id: number;
  channel: Channel;
  content: string;
  parent_id?: string;
}

/**
 * Adiciona um novo comentário a um caso.
 */
export async function addComment(
  caseId: number,
  channel: Channel,
  content: string,
  parentId?: string
): Promise<Comment> {
  const response = await api.post('/comments', {
    case_id: caseId,
    channel,
    content,
    parent_id: parentId
  });
  return response.data;
}

/**
 * Lista comentários de um caso.
 * @param caseId ID do caso
 * @param channel Filtrar por canal específico (opcional)
 */
export async function getComments(
  caseId: number,
  channel?: Channel
): Promise<Comment[]> {
  const params = channel ? { channel } : {};
  const response = await api.get(`/comments/case/${caseId}`, { params });
  return response.data;
}
