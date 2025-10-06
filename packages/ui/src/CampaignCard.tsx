import React from "react";
import { cn } from "./lib/utils";
import { Calendar, Trophy, Edit, Trash2, Award } from "lucide-react";
import { Button } from "./Button";

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
    border: "border-green-500/30",
    text: "text-green-600",
    label: "🟢 Ativa",
    gradient: "from-green-500/20 to-emerald-600/10"
  },
  proxima: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    text: "text-blue-600",
    label: "🔵 Próxima",
    gradient: "from-blue-500/20 to-sky-600/10"
  },
  encerrada: {
    bg: "bg-gray-500/10",
    border: "border-gray-500/30",
    text: "text-gray-600",
    label: "⚫ Encerrada",
    gradient: "from-gray-500/20 to-slate-600/10"
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
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border-2 transition-all duration-300",
        "bg-gradient-to-br backdrop-blur-sm",
        statusConfig.gradient,
        statusConfig.border,
        "hover:shadow-lg",
        className
      )}
    >
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="text-xl font-bold">{campaign.nome}</h3>
              <span
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium",
                  statusConfig.bg,
                  statusConfig.text
                )}
              >
                {statusConfig.label}
              </span>
            </div>
            {campaign.descricao && (
              <p className="text-muted-foreground text-sm">{campaign.descricao}</p>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{formatDateRange()}</span>
            </div>
          </div>

          {/* Actions (apenas para admin) */}
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
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(campaign)}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Top 5 Ranking (apenas para campanhas ativas) */}
        {campaign.status === "ativa" && campaign.top_5_ranking && campaign.top_5_ranking.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-600" />
              <h4 className="font-semibold text-sm">Ranking Atual (Top 5)</h4>
            </div>
            <div className="space-y-2">
              {campaign.top_5_ranking.map((ranking, idx) => {
                const medals = ["🥇", "🥈", "🥉"];
                const medal = idx < 3 ? medals[idx] : `${idx + 1}º`;
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-3 bg-card/50 backdrop-blur-sm p-3 rounded-lg border border-border/30"
                  >
                    <div className="flex-shrink-0 w-8 text-center font-bold text-sm">
                      {medal}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {ranking.usuario?.nome || "Desconhecido"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {ranking.pontuacao?.toFixed(2) || 0} pontos
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-muted-foreground">
                        {ranking.posicao}º
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Vencedores (apenas para campanhas encerradas) */}
        {campaign.status === "encerrada" && campaign.vencedores && campaign.vencedores.length > 0 && (
          <div className="bg-muted/30 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-yellow-600" />
              <h4 className="font-semibold text-sm">Vencedores</h4>
            </div>
            <div className="flex gap-2 flex-wrap">
              {campaign.vencedores.map((vencedor, idx) => {
                const medals = ["🥇", "🥈", "🥉"];
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-2 bg-background px-3 py-2 rounded-md border"
                  >
                    <span className="text-lg">{medals[idx]}</span>
                    <span className="font-medium text-sm">{vencedor}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Premiações */}
        {campaign.premiacoes && Array.isArray(campaign.premiacoes) && campaign.premiacoes.length > 0 && (
          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-600" />
              <h4 className="font-semibold text-sm">Premiações</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {campaign.premiacoes.map((premiacao, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 bg-muted/30 p-3 rounded-lg border border-border/20"
                >
                  <div className="flex-shrink-0 font-bold text-sm text-muted-foreground">
                    {premiacao.posicao}
                  </div>
                  <div className="flex-1 text-sm font-medium">{premiacao.premio}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
