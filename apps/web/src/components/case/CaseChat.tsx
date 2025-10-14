"use client";

/**
 * Componente de Chat Unificado para Casos
 * Usa Hero UI / Next UI para consistência com o design system.
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getComments, addComment, type Channel, type Comment } from '@/lib/comments';
import { useAuth } from '@/lib/auth';

interface CaseChatProps {
  caseId: number;
  defaultChannel: Channel;
}

export default function CaseChat({ caseId, defaultChannel }: CaseChatProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Query para buscar comentários
  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', caseId],
    queryFn: () => getComments(caseId),
    refetchInterval: 10000, // Atualizar a cada 10s
  });

  // Mutation para enviar comentário
  const sendCommentMutation = useMutation({
    mutationFn: (content: string) => addComment(caseId, defaultChannel, content),
    onSuccess: () => {
      // Invalidar queries para atualizar lista
      queryClient.invalidateQueries({ queryKey: ['comments'] }); // Invalida todos os comentários globalmente
      queryClient.invalidateQueries({ queryKey: ['caseEvents', caseId] });
      setMessage('');
      setIsSending(false);
      toast.success('Comentário enviado com sucesso!');
    },
    onError: (error: any) => {
      setIsSending(false);
      const errorMessage = error.response?.data?.detail || 'Erro ao enviar comentário';
      toast.error(errorMessage);
    },
  });


  const handleSend = () => {
    if (!message.trim()) {
      toast.error('Digite uma mensagem antes de enviar');
      return;
    }

    setIsSending(true);
    sendCommentMutation.mutate(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Badge de canal com cor específica
  const getChannelBadge = (channel: Channel) => {
    const colors: Record<Channel, string> = {
      ATENDIMENTO: 'bg-blue-100 text-blue-800',
      SIMULACAO: 'bg-purple-100 text-purple-800',
      FECHAMENTO: 'bg-green-100 text-green-800',
      CLIENTE: 'bg-orange-100 text-orange-800',
    };

    return (
      <Badge className={colors[channel]} variant="outline">
        {channel}
      </Badge>
    );
  };

  // Formatar data/hora
  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) +
           ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className="w-full h-full flex flex-col p-6">
      <div className="flex flex-row items-center gap-3 border-b pb-3 mb-4">
        <MessageCircle className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Chat</h3>
        {getChannelBadge(defaultChannel)}
      </div>

      <div className="flex-1 flex flex-col gap-4">
        {/* Lista de Mensagens - Scrollable */}
        <div className="flex-1 overflow-y-auto space-y-3 max-h-[500px] pr-2">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>Nenhum comentário ainda</p>
              <p className="text-sm">Seja o primeiro a comentar!</p>
            </div>
          ) : (
            comments.map((comment: Comment) => {
              const isCurrentUser = user?.id === comment.author_id;

              return (
                <div
                  key={comment.id}
                  className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  <Avatar className="h-8 w-8">
                    <div className="flex items-center justify-center h-full w-full bg-primary text-white text-xs font-semibold">
                      {comment.author_name.charAt(0).toUpperCase()}
                    </div>
                  </Avatar>

                  {/* Mensagem */}
                  <div className={`flex-1 max-w-[80%] ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                    <div className={`rounded-lg p-3 ${
                      comment.role === 'admin'
                        ? 'bg-red-600/90 backdrop-blur-sm border border-red-500/50 text-white'
                        : comment.role === 'supervisor'
                        ? 'bg-purple-600/90 backdrop-blur-sm border border-purple-500/50 text-white'
                        : comment.role === 'financeiro'
                        ? 'bg-green-600/90 backdrop-blur-sm border border-green-500/50 text-white'
                        : comment.role === 'calculista'
                        ? 'bg-blue-600/90 backdrop-blur-sm border border-blue-500/50 text-white'
                        : comment.role === 'atendente'
                        ? 'bg-orange-600/90 backdrop-blur-sm border border-orange-500/50 text-white'
                        : comment.role === 'fechamento'
                        ? 'bg-cyan-600/90 backdrop-blur-sm border border-cyan-500/50 text-white'
                        : 'bg-slate-700/90 backdrop-blur-sm border border-slate-600/50 text-white'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold">
                          {comment.author_name}
                        </span>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            comment.role === 'admin' 
                              ? 'bg-red-100 text-red-800 border-red-300' 
                              : comment.role === 'supervisor'
                              ? 'bg-purple-100 text-purple-800 border-purple-300'
                              : comment.role === 'financeiro'
                              ? 'bg-green-100 text-green-800 border-green-300'
                              : comment.role === 'calculista'
                              ? 'bg-blue-100 text-blue-800 border-blue-300'
                              : comment.role === 'atendente'
                              ? 'bg-orange-100 text-orange-800 border-orange-300'
                              : comment.role === 'fechamento'
                              ? 'bg-cyan-100 text-cyan-800 border-cyan-300'
                              : 'bg-gray-100 text-gray-800 border-gray-300'
                          }`}
                        >
                          {comment.role}
                        </Badge>
                      </div>
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {comment.content}
                      </p>
                      <span className="text-xs opacity-70 mt-2 block">
                        {formatDateTime(comment.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          
        </div>

        {/* Campo de Envio */}
        <div className="flex gap-2 items-end border-t pt-4">
          <Textarea
            placeholder="Digite sua mensagem... (Shift+Enter para nova linha)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isSending}
            className="flex-1 min-h-[60px] max-h-[120px] resize-none"
          />
          <Button
            onClick={handleSend}
            disabled={isSending || !message.trim()}
            size="icon"
            className="h-10 w-10"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
