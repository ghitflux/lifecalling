import React from "react";
import { cn } from "./lib/utils";
import { Calendar, Trophy, Edit, Trash2, Award, TrendingUp } from "lucide-react";
import { Button } from "./Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./Card";

export interface CampaignCardProps {
  campaign: {
    id: number;
    nome: string;
    descricao?: string;
    data_inicio: string;
    data_fim: string;
    status: "ativa" | "proxima" | "encerrada";
    premiacoes?: Array<{ posicao: string; premio: string }>;
    top_5_ranking?: Array<{
      posicao: number;
      usuario?: { id: number; nome: string };
      pontuacao: number;
    }>;
    vencedores?: string[];
  };
  onEdit?: (campaign: any) => void;
  onDelete?: (campaign: any) => void;
  canManage?: boolean;
  className?: string;
}

const STATUS_CONFIGS = {
  ativa: {
    bg: "bg-green-500/10",
    text: "text-green-600",
    border: "border-green-500",
    label: "Ativa"
  },
  proxima: {
    bg: "bg-blue-500/10",
    text: "text-blue-600",
    border: "border-blue-500",
    label: "Próxima"
  },
  encerrada: {
    bg: "bg-gray-500/10",
    text: "text-gray-600",
    border: "border-gray-500",
    label: "Encerrada"
  }
} as const;

export function CampaignCard({
  campaign,
  onEdit,
  onDelete,
  canManage = false,
  className
}: CampaignCardProps) {
  const statusConfig = STATUS_CONFIGS[campaign.status];

  const formatDateRange = () => {
    try {
      const inicio = new Date(campaign.data_inicio).toLocaleDateString("pt-BR");
      const fim = new Date(campaign.data_fim).toLocaleDateString("pt-BR");
      return `${inicio} - ${fim}`;
    } catch {
      return "-";
    }
  };

  return (
    <Card className={cn("hover:shadow-lg transition-shadow", className)}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <CardTitle className="text-xl">{campaign.nome}</CardTitle>
              <span
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-semibold",
                  statusConfig.bg,
                  statusConfig.text
                )}
              >
                {statusConfig.label}
              </span>
            </div>
            
            {campaign.descricao && (
              <CardDescription>{campaign.descricao}</CardDescription>
            )}

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{formatDateRange()}</span>
            </div>
          </div>

          {/* Actions */}
          {canManage && (
            <div className="flex items-center gap-2">
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(campaign)}
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Editar
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(campaign)}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Top 5 Ranking (apenas para campanhas ativas) */}
        {campaign.status === "ativa" && campaign.top_5_ranking && campaign.top_5_ranking.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-600" />
              <h4 className="font-semibold text-sm">Ranking Atual (Top 5)</h4>
            </div>
            
            <div className="space-y-2">
              {campaign.top_5_ranking.map((ranking) => (
                <div
                  key={ranking.usuario?.id || ranking.posicao}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">
                        #{ranking.posicao}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-sm">
                        {ranking.usuario?.nome || "Desconhecido"}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <TrendingUp className="h-3 w-3" />
                        <span>{ranking.pontuacao?.toFixed(2) || 0} pontos</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vencedores (apenas para campanhas encerradas) */}
        {campaign.status === "encerrada" && campaign.vencedores && campaign.vencedores.length > 0 && (
          <div className="space-y-4 mt-4">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-yellow-600" />
              <h4 className="font-semibold text-sm">Vencedores</h4>
            </div>
            
            <div className="flex gap-3 flex-wrap">
              {campaign.vencedores.map((vencedor, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 border"
                >
                  <span className="font-bold text-sm text-primary">#{idx + 1}</span>
                  <span className="font-medium text-sm">{vencedor}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Premiações */}
        {campaign.premiacoes && Array.isArray(campaign.premiacoes) && campaign.premiacoes.length > 0 && (
          <div className="space-y-4 mt-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-600" />
              <h4 className="font-semibold text-sm">Premiações</h4>
            </div>
            
            <div className="space-y-2">
              {campaign.premiacoes.map((premiacao, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors border"
                >
                  <div className="flex-shrink-0 px-3 py-1 rounded-md bg-amber-500/10 border border-amber-500/20">
                    <span className="text-sm font-bold text-amber-600">
                      {premiacao.posicao}
                    </span>
                  </div>
                  <div className="flex-1 pt-0.5">
                    <div className="text-sm font-semibold leading-relaxed">
                      {premiacao.premio}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

