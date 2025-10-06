import React from "react";
import { cn } from "./lib/utils";
import { Calendar, Trophy, Edit, Trash2, Award, Target, TrendingUp } from "lucide-react";
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
    border: "border-green-500/50",
    text: "text-green-600",
    icon: "🟢",
    label: "Ativa",
    gradient: "from-green-500/20 to-emerald-600/10",
    accentColor: "text-green-600"
  },
  proxima: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/50",
    text: "text-blue-600",
    icon: "🔵",
    label: "Próxima",
    gradient: "from-blue-500/20 to-sky-600/10",
    accentColor: "text-blue-600"
  },
  encerrada: {
    bg: "bg-gray-500/10",
    border: "border-gray-500/50",
    text: "text-gray-600",
    icon: "⚫",
    label: "Encerrada",
    gradient: "from-gray-500/20 to-slate-600/10",
    accentColor: "text-gray-600"
  }
} as const;

const MEDAL_CONFIGS = {
  1: { emoji: "🥇", gradient: "from-yellow-500 to-yellow-600", borderColor: "border-yellow-500/40", bgColor: "bg-yellow-500/10" },
  2: { emoji: "🥈", gradient: "from-gray-400 to-gray-500", borderColor: "border-gray-400/40", bgColor: "bg-gray-400/10" },
  3: { emoji: "🥉", gradient: "from-amber-600 to-amber-700", borderColor: "border-amber-600/40", bgColor: "bg-amber-600/10" }
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
        "relative overflow-hidden rounded-3xl border-2 transition-all duration-300 bg-card/50 backdrop-blur-xl",
        statusConfig.border,
        "hover:shadow-2xl hover:scale-[1.01]",
        "shadow-lg",
        className
      )}
    >
      {/* Decorative gradient overlay */}
      <div className={cn(
        "absolute inset-0 opacity-5 bg-gradient-to-br pointer-events-none",
        statusConfig.gradient
      )} />

      {/* Status Bar */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r",
        statusConfig.gradient
      )} />

      <div className="relative z-10 p-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm border-2 shadow-sm",
                statusConfig.bg,
                statusConfig.text,
                statusConfig.border
              )}>
                <span className="text-lg">{statusConfig.icon}</span>
                <span>{statusConfig.label}</span>
              </div>
            </div>
            
            <div>
              <h3 className="text-3xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                {campaign.nome}
              </h3>
              {campaign.descricao && (
                <p className="text-muted-foreground text-base leading-relaxed">{campaign.descricao}</p>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm font-medium bg-muted/50 rounded-xl px-4 py-2.5 w-fit border border-border/30">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{formatDateRange()}</span>
            </div>
          </div>

          {/* Actions (apenas para admin) */}
          {canManage && (
            <div className="flex flex-col gap-2">
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(campaign)}
                  className="flex items-center gap-2 hover:bg-primary/5 transition-all border-border/50"
                >
                  <Edit className="h-4 w-4" />
                  <span className="hidden sm:inline">Editar</span>
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(campaign)}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 border-red-200/50 dark:border-red-800/50 transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Excluir</span>
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Top 5 Ranking (apenas para campanhas ativas) */}
        {campaign.status === "ativa" && campaign.top_5_ranking && campaign.top_5_ranking.length > 0 && (
          <div className="bg-gradient-to-br from-muted/30 to-muted/10 rounded-2xl p-6 border border-border/50">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                <Trophy className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <h4 className="font-bold text-base">Ranking Atual</h4>
                <p className="text-xs text-muted-foreground">Top 5 Performers</p>
              </div>
            </div>
            
            <div className="space-y-3">
              {campaign.top_5_ranking.map((ranking) => {
                const posicao = ranking.posicao;
                const medalConfig = MEDAL_CONFIGS[posicao as keyof typeof MEDAL_CONFIGS];
                const isTop3 = posicao <= 3;
                
                return (
                  <div
                    key={ranking.usuario?.id || posicao}
                    className={cn(
                      "group flex items-center gap-4 bg-card/80 backdrop-blur-sm p-4 rounded-xl border-2 transition-all duration-300",
                      isTop3 && medalConfig ? `${medalConfig.borderColor} ${medalConfig.bgColor}` : "border-border/40 bg-muted/30",
                      "hover:shadow-lg hover:scale-[1.02] cursor-pointer"
                    )}
                  >
                    {/* Medal/Position */}
                    <div className={cn(
                      "flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center font-bold text-2xl shadow-md transition-transform group-hover:scale-110",
                      isTop3 && medalConfig 
                        ? `bg-gradient-to-br ${medalConfig.gradient} text-white` 
                        : "bg-muted border-2 border-border text-muted-foreground text-lg"
                    )}>
                      {isTop3 && medalConfig ? medalConfig.emoji : `${posicao}º`}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-base mb-1 truncate">
                        {ranking.usuario?.nome || "Desconhecido"}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <TrendingUp className="h-3.5 w-3.5" />
                        <span className="font-semibold">{ranking.pontuacao?.toFixed(2) || 0}</span>
                        <span>pontos</span>
                      </div>
                    </div>

                    {/* Position Badge */}
                    <div className={cn(
                      "flex-shrink-0 px-4 py-2 rounded-lg font-bold text-sm border-2",
                      isTop3 && medalConfig
                        ? `${medalConfig.bgColor} ${medalConfig.borderColor} ${statusConfig.accentColor}`
                        : "bg-muted/50 border-border text-muted-foreground"
                    )}>
                      #{posicao}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Vencedores (apenas para campanhas encerradas) */}
        {campaign.status === "encerrada" && campaign.vencedores && campaign.vencedores.length > 0 && (
          <div className="bg-gradient-to-br from-yellow-500/5 via-amber-500/5 to-orange-500/5 rounded-2xl p-6 border-2 border-yellow-500/30 shadow-inner">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 rounded-xl bg-yellow-500/20 border border-yellow-500/40">
                <Award className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <h4 className="font-bold text-base">Vencedores da Campanha</h4>
                <p className="text-xs text-muted-foreground">Parabéns aos campeões!</p>
              </div>
            </div>
            
            <div className="flex gap-4 flex-wrap">
              {campaign.vencedores.map((vencedor, idx) => {
                const posicao = (idx + 1) as 1 | 2 | 3;
                const medalConfig = MEDAL_CONFIGS[posicao];
                
                return (
                  <div
                    key={idx}
                    className={cn(
                      "flex items-center gap-3 bg-background/80 backdrop-blur-sm px-5 py-4 rounded-xl border-2 shadow-md hover:shadow-xl transition-all hover:scale-105 cursor-pointer",
                      medalConfig?.borderColor || "border-border"
                    )}
                  >
                    <div className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br shadow-sm",
                      medalConfig?.gradient || "from-gray-400 to-gray-500"
                    )}>
                      <span className="text-2xl">{medalConfig?.emoji}</span>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground font-medium">{posicao}º Lugar</div>
                      <div className="font-bold text-sm">{vencedor}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Premiações */}
        {campaign.premiacoes && Array.isArray(campaign.premiacoes) && campaign.premiacoes.length > 0 && (
          <div className="bg-gradient-to-br from-amber-500/5 to-orange-500/5 rounded-2xl p-6 border border-amber-500/30">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <Target className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h4 className="font-bold text-base">Premiações</h4>
                <p className="text-xs text-muted-foreground">Recompensas por posição</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {campaign.premiacoes.map((premiacao, idx) => (
                <div
                  key={idx}
                  className="group relative flex items-center gap-4 bg-card/80 backdrop-blur-sm p-4 rounded-xl border-2 border-border/40 hover:border-amber-500/40 shadow-sm hover:shadow-lg transition-all hover:scale-[1.03] cursor-pointer overflow-hidden"
                >
                  {/* Decorative gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-2 border-amber-500/30 flex items-center justify-center font-bold text-sm text-amber-600 shadow-sm">
                    {premiacao.posicao}
                  </div>
                  
                  <div className="relative z-10 flex-1 text-sm font-semibold leading-tight">
                    {premiacao.premio}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

