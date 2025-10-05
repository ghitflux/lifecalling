"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { KPICard, RankingTable, GradientPanel, ProgressBar, MiniAreaChart } from "@lifecalling/ui";
import { CampaignModal } from "@/components/CampaignModal";
import { useAuth } from "@/lib/auth";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";

// Fallback para mini-gráficos
const FALLBACK_TREND_DATA = {
  contratos: [
    { day: "D1", value: 0 },
    { day: "D2", value: 1 },
    { day: "D3", value: 1 },
    { day: "D4", value: 2 },
    { day: "D5", value: 3 },
    { day: "D6", value: 5 },
    { day: "D7", value: 7 }
  ],
  consultoria: [
    { day: "D1", value: 0 },
    { day: "D2", value: 2500 },
    { day: "D3", value: 3200 },
    { day: "D4", value: 4100 },
    { day: "D5", value: 5800 },
    { day: "D6", value: 7200 },
    { day: "D7", value: 9500 }
  ]
};

export default function RankingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [range, setRange] = useState<{ from?: string; to?: string }>({});
  const [showNovaCampanhaModal, setShowNovaCampanhaModal] = useState(false);
  const [editingCampanha, setEditingCampanha] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [campanhaToDelete, setCampanhaToDelete] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // ---------------- Queries ----------------
  const agents = useQuery({
    queryKey: ["rankings", "agents", range],
    queryFn: async () => {
      const response = await api.get("/rankings/agents", { params: range });
      return response.data.items;
    }
  });

  const targets = useQuery({
    queryKey: ["rankings", "targets"],
    queryFn: async () => (await api.get("/rankings/agents/targets")).data.items
  });

  const campanhas = useQuery({
    queryKey: ["campanhas"],
    queryFn: async () => {
      try {
        const response = await api.get("/campanhas");
        return response.data.items;
      } catch (error) {
        console.error("Erro ao buscar campanhas:", error);
        return [];
      }
    }
  });

  const campanhasAtivas = useQuery({
    queryKey: ["campanhas", "ativas", "rankings"],
    queryFn: async () => {
      try {
        const response = await api.get("/campanhas/ativas/rankings");
        return response.data.campanhas_ativas || [];
      } catch (error) {
        console.error("Erro ao buscar campanhas ativas:", error);
        return [];
      }
    }
  });

  // ---------------- Mutations ----------------
  const criarCampanhaMutation = useMutation({
    mutationFn: async (data: any) => (await api.post("/campanhas", data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campanhas"] });
      queryClient.invalidateQueries({ queryKey: ["campanhas", "ativas", "rankings"] });
      toast.success("Campanha criada com sucesso!");
      setShowNovaCampanhaModal(false);
    },
    onError: (error: any) => toast.error(error.response?.data?.detail || "Erro ao criar campanha")
  });

  const excluirCampanhaMutation = useMutation({
    mutationFn: async (campanhaId: number) => (await api.delete(`/campanhas/${campanhaId}`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campanhas"] });
      queryClient.invalidateQueries({ queryKey: ["campanhas", "ativas", "rankings"] });
      toast.success("Campanha excluída com sucesso!");
      setShowDeleteModal(false);
      setCampanhaToDelete(null);
    },
    onError: (error: any) => toast.error(error.response?.data?.detail || "Erro ao excluir campanha")
  });

  const editarCampanhaMutation = useMutation({
    mutationFn: async (data: any) => (await api.put(`/campanhas/${data.id}`, data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campanhas"] });
      queryClient.invalidateQueries({ queryKey: ["campanhas", "ativas", "rankings"] });
      toast.success("Campanha atualizada com sucesso!");
      setShowEditModal(false);
      setEditingCampanha(null);
    },
    onError: (error: any) => toast.error(error.response?.data?.detail || "Erro ao atualizar campanha")
  });

  const handleCriarCampanha = (data: any) => criarCampanhaMutation.mutate(data);
  const handleEditarCampanha = (campanha: any) => { setEditingCampanha(campanha); setShowEditModal(true); };
  const handleSalvarEdicao = (data: any) => { if (editingCampanha) editarCampanhaMutation.mutate({ ...data, id: editingCampanha.id }); };
  const handleExcluirCampanha = (campanha: any) => { setCampanhaToDelete(campanha); setShowDeleteModal(true); };
  const confirmarExclusao = () => { if (campanhaToDelete) excluirCampanhaMutation.mutate(campanhaToDelete.id); };

  // ---------------- Memós ----------------
  const campanhasAtivasData = useMemo(() => campanhasAtivas.data || [], [campanhasAtivas.data]);

  const campanhasInativas = useMemo(() => {
    return (campanhas.data || []).filter((c: any) => c.status !== "ativa");
  }, [campanhas.data]);

  const trendData = useQuery({
    queryKey: ["trend-data", user?.id],
    queryFn: async () => (await api.get("/users/me/trend-data")).data,
    enabled: !!user,
    staleTime: 5 * 60 * 1000
  });

  const getTrendChartData = useMemo(() => {
    if (trendData.data) {
      return {
        contratos: trendData.data.vendas_diarias || FALLBACK_TREND_DATA.contratos,
        consultoria: trendData.data.valor_diario || FALLBACK_TREND_DATA.consultoria
      };
    }
    return FALLBACK_TREND_DATA;
  }, [trendData.data]);

  const calculateTrend = (data: any[]) => {
    if (!data || data.length < 2) return 0;
    const recent = data.slice(-3);
    const previous = data.slice(-6, -3);
    const recentAvg = recent.reduce((s, i) => s + i.value, 0) / recent.length;
    const previousAvg = previous.reduce((s, i) => s + i.value, 0) / previous.length;
    if (previousAvg === 0) return recentAvg > 0 ? 100 : 0;
    return ((recentAvg - previousAvg) / previousAvg) * 100;
  };

  const vendasTrend = useMemo(() => calculateTrend(getTrendChartData.contratos), [getTrendChartData.contratos]);
  const valorTrend = useMemo(() => calculateTrend(getTrendChartData.consultoria), [getTrendChartData.consultoria]);

  const tableData = useMemo(() => {
    if (agents.data && agents.data.length > 0) {
      const sorted = [...agents.data].sort((a, b) => (b.consultoria_liq || 0) - (a.consultoria_liq || 0));
      return sorted.map((agent: any, idx: number) => ({
        user_id: agent.user_id,
        nome_agente: agent.name,
        pontuacao: agent.consultoria_liq || 0,
        valor_vendas: agent.consultoria_liq || 0,
        quantidade_vendas: agent.contracts || 0,
        pos: idx + 1,
        isTop3: idx < 3,
        campanha_nome: "Ranking Geral"
      }));
    }
    return [];
  }, [agents.data]);

  function ProgressCell(row: any) {
    const t = targets.data?.find((x: any) => x.user_id === row.user_id);
    const metaVendas = t?.meta_vendas ?? 50000;
    const achieved = metaVendas ? Math.min(100, Math.round(100 * (row.valor_vendas ?? 0) / metaVendas)) : 0;
    const variant = achieved < 50 ? "danger" : achieved < 80 ? "warning" : "success";
    return (
      <div className="min-w-[160px]">
        <ProgressBar value={achieved} max={100} size="sm" variant={variant} />
        <div className="text-xs text-muted-foreground mt-1">{achieved}% da meta</div>
      </div>
    );
  }

  function RankCell(row: any) {
    const medals = ["🥇", "🥈", "🥉"];
    const colors = ["text-yellow-500", "text-gray-400", "text-amber-600"];
    if (row.pos <= 3) {
      return (
        <div className="flex items-center gap-2">
          <span className={`text-2xl ${colors[row.pos - 1]}`}>{medals[row.pos - 1]}</span>
          <span className="font-bold text-lg">{row.pos}</span>
        </div>
      );
    }
    return <span>{row.pos}</span>;
  }

  const handleExportCsv = (kind: "agents" | "teams") => {
    const params = new URLSearchParams();
    params.set("kind", kind);
    if (range.from) params.set("from", range.from);
    if (range.to) params.set("to", range.to);
    const url = `${window.location.origin}/rankings/export.csv?${params.toString()}`;
    window.open(url, "_blank");
  };

  const safeDateRange = (c: any) => {
    if (c?.data_inicio && c?.data_fim) {
      try {
        const i = new Date(c.data_inicio).toLocaleDateString("pt-BR");
        const f = new Date(c.data_fim).toLocaleDateString("pt-BR");
        return `${i} - ${f}`;
      } catch {
        /* ignore */
      }
    }
    return c?.periodo ?? "-";
  };

  // “Meus números” baseado no top5 das campanhas ativas (quando existir)
  const me = useMemo(() => {
    if (!user?.id || !campanhasAtivasData.length) return null;
    for (const campanha of campanhasAtivasData) {
      if (campanha.top_5_ranking) {
        const r = campanha.top_5_ranking.find((x: any) => x.usuario?.id === user.id);
        if (r) {
          return {
            user_id: r.usuario?.id,
            nome_agente: r.usuario?.nome,
            pontuacao: r.pontuacao || 0,
            valor_vendas: r.pontuacao || 0,
            quantidade_vendas: 0,
            campanha_id: campanha.id,
            campanha_nome: campanha.nome
          };
        }
      }
    }
    return null;
  }, [campanhasAtivasData, user?.id]);

  const myTarget = useMemo(() => targets.data?.find((t: any) => t.user_id === user?.id), [targets.data, user?.id]);

  // ---------------- Render ----------------
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* header (range + export) */}
      <div className="flex flex-col md:flex-row md:items-end gap-3">
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">De</label>
            <input
              type="date"
              value={range.from ?? ""}
              onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
              className="w-full px-3 py-2 border rounded text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Até</label>
            <input
              type="date"
              value={range.to ?? ""}
              onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
              className="w-full px-3 py-2 border rounded text-sm"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExportCsv("agents")}>Exportar Atendentes (CSV)</Button>
          <Button variant="outline" onClick={() => handleExportCsv("teams")}>Exportar Times (CSV)</Button>
        </div>
      </div>

      {/* KPIs “meus números” */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          title="Minhas vendas"
          value={me?.quantidade_vendas ?? 0}
          gradientVariant="emerald"
          subtitle="Total nas campanhas ativas"
          trend={vendasTrend}
          miniChart={
            <MiniAreaChart data={getTrendChartData.contratos} dataKey="value" xKey="day" stroke="#10b981" height={60} />
          }
        />
        <KPICard
          title="Meu valor em vendas"
          value={`R$ ${(me?.valor_vendas ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          gradientVariant="violet"
          subtitle={`Meta: R$ ${(myTarget?.meta_vendas ?? 50000).toLocaleString("pt-BR")}/mês`}
          trend={valorTrend}
          miniChart={
            <MiniAreaChart
              data={getTrendChartData.consultoria}
              dataKey="value"
              xKey="day"
              stroke="#8b5cf6"
              height={60}
              tooltipFormatter={(value) => `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
            />
          }
        />
        <GradientPanel>
          <div className="space-y-2">
            <div className="text-sm font-medium">Minha Pontuação</div>
            <div className="text-2xl font-bold text-primary">{me?.pontuacao ?? 0} pts</div>
            <div className="text-xs text-muted-foreground">
              {me?.campanha_nome ? `Campanha: ${me.campanha_nome}` : "Nenhuma campanha ativa"}
            </div>
            {me && (
              <div className="text-xs text-muted-foreground">
                Posição no ranking: {tableData.findIndex((a) => a.user_id === me.user_id) + 1}º lugar
              </div>
            )}
          </div>
        </GradientPanel>
      </div>

      {/* Ranking geral */}
      <GradientPanel>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">🏆 Ranking Geral</h2>
            <div className="text-sm text-muted-foreground">
              {campanhasAtivasData.length > 0 ? "Baseado nas campanhas ativas" : "Ranking geral de produtividade"}
            </div>
          </div>
          {tableData.length > 0 ? (
            <RankingTable
              data={tableData}
              columns={[
                { key: "pos", header: "#", render: RankCell },
                { key: "nome_agente", header: "Agente" },
                { key: "pontuacao", header: "Pontuação", format: "number" },
                { key: "valor_vendas", header: "Valor Vendas", format: "currency" },
                { key: "quantidade_vendas", header: "Qtd. Vendas", format: "number" },
                { key: "atingimento", header: "Atingimento Meta", render: ProgressCell }
              ]}
              highlightTop3
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum ranking disponível</p>
              <p className="text-sm mt-1">Aguarde dados de produtividade dos agentes</p>
            </div>
          )}
        </div>
      </GradientPanel>

      {/* Campanhas Ativas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">🔥 Campanhas Ativas</h2>
            <p className="text-sm text-muted-foreground mt-1">Campanhas em andamento - Participe agora!</p>
          </div>
          <Button className="flex items-center gap-2" onClick={() => setShowNovaCampanhaModal(true)}>
            <Plus className="h-4 w-4" />
            Nova Campanha
          </Button>
          <CampaignModal
            open={showNovaCampanhaModal}
            onOpenChange={setShowNovaCampanhaModal}
            onSubmit={handleCriarCampanha}
            isLoading={criarCampanhaMutation.isPending}
            mode="create"
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          {campanhasAtivas.isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Carregando campanhas ativas...</div>
          ) : campanhasAtivasData.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-lg">
              <p className="text-muted-foreground">Nenhuma campanha ativa no momento</p>
              <p className="text-sm text-muted-foreground mt-1">Aguarde as próximas campanhas!</p>
            </div>
          ) : (
            campanhasAtivasData.map((campanha: any) => {
              const statusConfigs = {
                ativa: { bg: "bg-green-500/10", text: "text-green-600", label: "🟢 Ativa" },
                proxima: { bg: "bg-blue-500/10", text: "text-blue-600", label: "🔵 Próxima" },
                encerrada: { bg: "bg-gray-500/10", text: "text-gray-600", label: "⚫ Encerrada" }
              } as const;
              const statusKey = (campanha.status ?? "ativa") as keyof typeof statusConfigs;
              const statusConfig = statusConfigs[statusKey] || statusConfigs.ativa;

              return (
                <GradientPanel key={campanha.id}>
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-bold">{campanha.nome}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                            {statusConfig.label}
                          </span>
                        </div>
                        {campanha.descricao && <p className="text-muted-foreground mt-1">{campanha.descricao}</p>}
                        <p className="text-sm text-muted-foreground mt-1">📅 {safeDateRange(campanha)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditarCampanha(campanha)} className="flex items-center gap-2">
                          <Edit className="h-4 w-4" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExcluirCampanha(campanha)}
                          className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Excluir
                        </Button>
                      </div>
                    </div>

                    {/* Ranking da campanha */}
                    {campanha.top_5_ranking && campanha.top_5_ranking.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm">🏆 Ranking Atual (Top 5)</h4>
                        <div className="space-y-2">
                          {campanha.top_5_ranking.map((ranking: any, idx: number) => {
                            const medals = ["🥇", "🥈", "🥉"];
                            const medal = idx < 3 ? medals[idx] : `${idx + 1}º`;
                            return (
                              <div key={idx} className="flex items-center gap-3 bg-muted/30 p-3 rounded-lg">
                                <div className="flex-shrink-0 w-8 text-center font-bold text-sm">{medal}</div>
                                <div className="flex-1">
                                  <div className="font-medium text-sm">{ranking.usuario?.nome || "Desconhecido"}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {ranking.pontuacao?.toFixed(2) || 0} pontos
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-medium text-muted-foreground">Posição: {ranking.posicao}º</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Premiações */}
                    {campanha.premiacoes && campanha.premiacoes.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">🎯 Premiações</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {campanha.premiacoes.map((premiacao: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-3 bg-muted/30 p-3 rounded-lg">
                              <div className="flex-shrink-0 font-bold text-sm text-muted-foreground">{premiacao.posicao}</div>
                              <div className="flex-1 text-sm font-medium">{premiacao.premio}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {statusKey === "ativa" && (
                      <div className="pt-2 border-t">
                        <Button className="w-full" variant="default">Ver Ranking da Campanha →</Button>
                      </div>
                    )}
                  </div>
                </GradientPanel>
              );
            })
          )}
        </div>
      </div>

      {/* Campanhas Encerradas e Futuras */}
      {campanhasInativas.length > 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold">📋 Campanhas Encerradas e Futuras</h2>
            <p className="text-sm text-muted-foreground mt-1">Histórico e próximas campanhas</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {campanhasInativas.map((campanha: any) => {
              const STATUS_CONFIG = {
                ativa: { bg: "bg-green-500/10", text: "text-green-600", label: "🟢 Ativa" },
                proxima: { bg: "bg-blue-500/10", text: "text-blue-600", label: "🔵 Próxima" },
                encerrada: { bg: "bg-gray-500/10", text: "text-gray-600", label: "⚫ Encerrada" }
              } as const;
              const sKey = campanha.status as keyof typeof STATUS_CONFIG;
              const statusConfig = STATUS_CONFIG[sKey];

              return (
                <GradientPanel key={campanha.id}>
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-bold">{campanha.nome}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                            {statusConfig.label}
                          </span>
                        </div>
                        {campanha.descricao && <p className="text-muted-foreground mt-1">{campanha.descricao}</p>}
                        <p className="text-sm text-muted-foreground mt-1">📅 {campanha.periodo}</p>
                      </div>
                    </div>

                    {campanha.status === "encerrada" && campanha.vencedores && (
                      <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                        <h4 className="font-semibold text-sm">🏆 Vencedores</h4>
                        <div className="flex gap-2 flex-wrap">
                          {campanha.vencedores.map((v: string, idx: number) => {
                            const medals = ["🥇", "🥈", "🥉"];
                            return (
                              <div key={idx} className="flex items-center gap-2 bg-background px-3 py-2 rounded-md">
                                <span className="text-lg">{medals[idx]}</span>
                                <span className="font-medium text-sm">{v}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">🎯 Premiações</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {campanha.premiacoes?.map((premiacao: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-3 bg-muted/30 p-3 rounded-lg">
                            <div className="flex-shrink-0 w-20 font-bold text-sm text-muted-foreground">{premiacao.posicao}</div>
                            <div className="flex-1 text-sm font-medium">{premiacao.premio}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditarCampanha(campanha)} className="flex-1">
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExcluirCampanha(campanha)}
                        className="flex-1 text-red-600 hover:text-red-700"
                      >
                        Excluir
                      </Button>
                    </div>
                  </div>
                </GradientPanel>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal de Edição */}
      <CampaignModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        onSubmit={handleSalvarEdicao}
        isLoading={editarCampanhaMutation.isPending}
        mode="edit"
        initialData={editingCampanha}
      />

      {/* Modal de Exclusão */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a campanha &quot;{campanhaToDelete?.nome}&quot;? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)} disabled={excluirCampanhaMutation.isPending}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmarExclusao} disabled={excluirCampanhaMutation.isPending}>
              {excluirCampanhaMutation.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
