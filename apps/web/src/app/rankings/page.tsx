"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { KPICard, RankingTable, GradientPanel, ProgressBar, MiniAreaChart, FilterDropdown } from "@lifecalling/ui"; // reuse
import { CampaignModal } from "@/components/CampaignModal";
import { useAuth } from "@/lib/auth";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";

// Dados mockados de campanhas - ATIVO
const MOCK_CAMPANHAS = [
  {
    id: 1,
    nome: "🎄 Campanha de Natal 2024",
    descricao: "Bata a meta em dezembro e ganhe prêmios especiais! Período festivo com premiações incríveis para quem se destacar.",
    periodo: "01/12/2024 - 31/12/2024",
    data_inicio: "2024-12-01",
    data_fim: "2024-12-31",
    status: "ativa",
    premiacoes: [
      { posicao: "1º Lugar", premio: "R$ 5.000 + Viagem para 2 pessoas" },
      { posicao: "2º Lugar", premio: "R$ 3.000 + Voucher de compras R$ 1.000" },
      { posicao: "3º Lugar", premio: "R$ 2.000 + Kit premium de produtos" },
      { posicao: "Top 10", premio: "Bônus de R$ 500 cada" }
    ],
    progresso: 68
  },
  {
    id: 2,
    nome: "🚀 Desafio Q1 2025",
    descricao: "Meta trimestral com premiação progressiva. Início de ano forte com grandes recompensas!",
    periodo: "01/01/2025 - 31/03/2025",
    data_inicio: "2025-01-01",
    data_fim: "2025-03-31",
    status: "proxima",
    premiacoes: [
      { posicao: "1º Lugar", premio: "R$ 8.000 + Eletrodoméstico Premium" },
      { posicao: "2º Lugar", premio: "R$ 5.000 + Smartphone top de linha" },
      { posicao: "3º Lugar", premio: "R$ 3.000 + Tablet + Fone Bluetooth" },
      { posicao: "Top 5", premio: "Bônus de R$ 1.000" }
    ],
    progresso: 0
  },
  {
    id: 3,
    nome: "🛍️ Campanha Black Friday",
    descricao: "Recordes na semana do consumo. Quem vendeu mais na semana mais importante do ano!",
    periodo: "20/11/2024 - 30/11/2024",
    data_inicio: "2024-11-20",
    data_fim: "2024-11-30",
    status: "encerrada",
    premiacoes: [
      { posicao: "1º Lugar", premio: "R$ 3.000 em vale-compras" },
      { posicao: "2º Lugar", premio: "R$ 2.000 em vale-compras" },
      { posicao: "3º Lugar", premio: "R$ 1.000 em vale-compras" },
      { posicao: "4º ao 10º", premio: "R$ 500 em vale-compras" }
    ],
    progresso: 100,
    vencedores: ["Maria Oliveira", "Ana Silva", "Patricia Souza"]
  },
  {
    id: 4,
    nome: "⚡ Sprint de Outubro",
    descricao: "Desafio relâmpago de 15 dias com meta agressiva e prêmios rápidos!",
    periodo: "10/10/2024 - 25/10/2024",
    data_inicio: "2024-10-10",
    data_fim: "2024-10-25",
    status: "encerrada",
    premiacoes: [
      { posicao: "1º Lugar", premio: "R$ 4.000 + Apple Watch" },
      { posicao: "2º Lugar", premio: "R$ 2.500 + AirPods Pro" },
      { posicao: "3º Lugar", premio: "R$ 1.500 + Smart Speaker" }
    ],
    progresso: 100,
    vencedores: ["João Pereira", "Fernanda Costa", "Carlos Santos"]
  },
  {
    id: 5,
    nome: "🏆 Mega Desafio Semestral",
    descricao: "Campanha de longo prazo com as maiores premiações do ano! 6 meses de competição saudável.",
    periodo: "01/07/2024 - 31/12/2024",
    data_inicio: "2024-07-01",
    data_fim: "2024-12-31",
    status: "ativa",
    premiacoes: [
      { posicao: "1º Lugar", premio: "R$ 15.000 + Carro 0km ou Viagem Internacional" },
      { posicao: "2º Lugar", premio: "R$ 10.000 + Notebook top + Smartphone" },
      { posicao: "3º Lugar", premio: "R$ 7.000 + Smart TV 65' + Videogame" },
      { posicao: "4º e 5º", premio: "R$ 5.000 + Kit eletrônicos" },
      { posicao: "Top 20", premio: "Bônus de R$ 1.000" }
    ],
    progresso: 85
  },
  {
    id: 6,
    nome: "🎯 Desafio Novatos 2025",
    descricao: "Campanha exclusiva para atendentes com menos de 6 meses na empresa. Oportunidade de brilhar!",
    periodo: "01/02/2025 - 28/02/2025",
    data_inicio: "2025-02-01",
    data_fim: "2025-02-28",
    status: "proxima",
    premiacoes: [
      { posicao: "1º Lugar", premio: "R$ 3.000 + Mentoria executiva" },
      { posicao: "2º Lugar", premio: "R$ 2.000 + Curso profissionalizante" },
      { posicao: "3º Lugar", premio: "R$ 1.000 + Kit boas-vindas premium" }
    ],
    progresso: 0
  }
];

// Dados de fallback para os mini gráficos quando não há dados reais
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
  const [range, setRange] = useState<{from?: string; to?: string}>({});
  const [showNovaCampanhaModal, setShowNovaCampanhaModal] = useState(false);
  const [editingCampanha, setEditingCampanha] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [campanhaToDelete, setCampanhaToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const agents = useQuery({
    queryKey: ["rankings","agents",range],
    queryFn: async () => (await api.get("/rankings/agents", { params: range })).data.items
  });

  const targets = useQuery({
    queryKey: ["rankings","targets"],
    queryFn: async () => (await api.get("/rankings/agents/targets")).data.items
  });

  // Buscar campanhas da API
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

  // Buscar campanhas ativas com rankings
  const campanhasAtivas = useQuery({
    queryKey: ["campanhas", "ativas", "rankings"],
    queryFn: async () => {
      try {
        const response = await api.get("/campanhas/ativas/rankings");
        return response.data.campanhas_ativas;
      } catch (error) {
        console.error("Erro ao buscar campanhas ativas:", error);
        return [];
      }
    }
  });



  // Mutation para criar campanha
  const criarCampanhaMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post("/campanhas", data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidar todas as queries relacionadas a campanhas
      queryClient.invalidateQueries({ queryKey: ["campanhas"] });
      queryClient.invalidateQueries({ queryKey: ["campanhas", "ativas", "rankings"] });
      toast.success("Campanha criada com sucesso!");
      setShowNovaCampanhaModal(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Erro ao criar campanha");
    }
  });

  // Mutation para excluir campanha
  const excluirCampanhaMutation = useMutation({
    mutationFn: async (campanhaId: number) => {
      const response = await api.delete(`/campanhas/${campanhaId}`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidar todas as queries relacionadas a campanhas
      queryClient.invalidateQueries({ queryKey: ["campanhas"] });
      queryClient.invalidateQueries({ queryKey: ["campanhas", "ativas", "rankings"] });
      toast.success("Campanha excluída com sucesso!");
      setShowDeleteModal(false);
      setCampanhaToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Erro ao excluir campanha");
    }
  });

  const handleCriarCampanha = (data: any) => {
    criarCampanhaMutation.mutate(data);
  };

  // Mutation para editar campanha
  const editarCampanhaMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.put(`/campanhas/${data.id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campanhas"] });
      queryClient.invalidateQueries({ queryKey: ["campanhas", "ativas", "rankings"] });
      toast.success("Campanha atualizada com sucesso!");
      setShowEditModal(false);
      setEditingCampanha(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Erro ao atualizar campanha");
    }
  });

  const handleEditarCampanha = (campanha: any) => {
    setEditingCampanha(campanha);
    setShowEditModal(true);
  };

  const handleSalvarEdicao = (data: any) => {
    if (editingCampanha) {
      editarCampanhaMutation.mutate({ ...data, id: (editingCampanha as any).id });
    }
  };

  const handleExcluirCampanha = (campanha: any) => {
    setCampanhaToDelete(campanha);
    setShowDeleteModal(true);
  };

  const confirmarExclusao = () => {
    if (campanhaToDelete) {
      excluirCampanhaMutation.mutate((campanhaToDelete as any).id);
    }
  };

  // Separar campanhas por status
  const campanhasAtivasData = useMemo(() => {
    return campanhasAtivas.data || [];
  }, [campanhasAtivas.data]);

  const campanhasInativas = useMemo(() => {
    return (campanhas.data || []).filter((c: any) => c.status !== "ativa");
  }, [campanhas.data]);

  // calcular "meus números" - buscar dados do usuário atual nos rankings das campanhas ativas
  const me = useMemo(() => {
    if (!user?.id || !campanhasAtivasData.length) return null;

    // Buscar o usuário nos rankings de todas as campanhas ativas
    for (const campanha of campanhasAtivasData) {
      if (campanha.rankings) {
        const userRanking = campanha.rankings.find((r: any) => r.user_id === user.id);
        if (userRanking) {
          return {
            ...userRanking,
            campanha_id: campanha.id,
            campanha_nome: campanha.nome
          };
        }
      }
    }
    return null;
  }, [campanhasAtivasData, user?.id]);

  const myTarget = useMemo(() => {
    return targets.data?.find((t: any) => t.user_id === user?.id);
  }, [targets.data, user?.id]);

  // Query para dados de tendência do usuário (últimos 7 dias)
  const trendData = useQuery({
    queryKey: ["trend-data", user?.id],
    queryFn: async () => {
      const response = await api.get("/users/me/trend-data");
      return response.data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutos,
  });

  // Função para processar dados de tendência
  const getTrendChartData = useMemo(() => {
    if (trendData.data) {
      return {
        contratos: trendData.data.vendas_diarias || FALLBACK_TREND_DATA.contratos,
        consultoria: trendData.data.valor_diario || FALLBACK_TREND_DATA.consultoria
      };
    }
    return FALLBACK_TREND_DATA;
  }, [trendData.data]);

  // Função para calcular tendência percentual
  const calculateTrend = (data: any[]) => {
    if (!data || data.length < 2) return 0;

    const recent = data.slice(-3); // últimos 3 dias
    const previous = data.slice(-6, -3); // 3 dias anteriores

    const recentAvg = recent.reduce((sum, item) => sum + item.value, 0) / recent.length;
    const previousAvg = previous.reduce((sum, item) => sum + item.value, 0) / previous.length;

    if (previousAvg === 0) return recentAvg > 0 ? 100 : 0;

    return ((recentAvg - previousAvg) / previousAvg) * 100;
  };

  // Calcular tendências reais
  const vendasTrend = useMemo(() => {
    return calculateTrend(getTrendChartData.contratos);
  }, [getTrendChartData.contratos]);

  const valorTrend = useMemo(() => {
    return calculateTrend(getTrendChartData.consultoria);
  }, [getTrendChartData.consultoria]);

  const tableData = useMemo(() => {
    // Se há campanhas ativas, usar dados das campanhas
    if (campanhasAtivasData.length > 0) {
      // Combinar rankings de todas as campanhas ativas
      const allRankings: any[] = [];
      campanhasAtivasData.forEach((campanha: any) => {
        if (campanha.rankings) {
          campanha.rankings.forEach((ranking: any) => {
            allRankings.push({
              ...ranking,
              campanha_id: campanha.id,
              campanha_nome: campanha.nome
            });
          });
        }
      });

      // Agrupar por agente e somar pontuações
      const agentMap = new Map();
      allRankings.forEach(ranking => {
        const key = ranking.user_id || ranking.nome_agente;
        if (agentMap.has(key)) {
          const existing = agentMap.get(key);
          existing.pontuacao += ranking.pontuacao || 0;
          existing.valor_vendas += ranking.valor_vendas || 0;
          existing.quantidade_vendas += ranking.quantidade_vendas || 0;
        } else {
          agentMap.set(key, {
            ...ranking,
            pontuacao: ranking.pontuacao || 0,
            valor_vendas: ranking.valor_vendas || 0,
            quantidade_vendas: ranking.quantidade_vendas || 0
          });
        }
      });

      // Converter para array e ordenar por pontuação
      const sortedAgents = Array.from(agentMap.values())
        .sort((a, b) => (b.pontuacao || 0) - (a.pontuacao || 0));

      return sortedAgents.map((row: any, idx: number) => ({
        ...row,
        pos: idx + 1,
        isTop3: idx < 3  // Marcar top 3 para destaque visual
      }));
    }

    // Se não há campanhas ativas, usar dados gerais dos agentes
    if (agents.data && agents.data.length > 0) {
      // Ordenar por consultoria líquida (principal métrica de produtividade)
      const sortedAgents = [...agents.data].sort((a, b) => 
        (b.consultoria_liq || 0) - (a.consultoria_liq || 0)
      );

      return sortedAgents.map((agent: any, idx: number) => ({
        user_id: agent.user_id,
        nome_agente: agent.name,
        pontuacao: agent.consultoria_liq || 0, // Usar consultoria líquida como pontuação
        valor_vendas: agent.consultoria_liq || 0,
        quantidade_vendas: agent.contracts || 0,
        pos: idx + 1,
        isTop3: idx < 3,
        campanha_nome: "Ranking Geral"
      }));
    }

    return [];
  }, [campanhasAtivasData, agents.data]);

  function ProgressCell(row: any) {
    const t = targets.data?.find((x: any) => x.user_id === row.user_id);
    const metaVendas = t?.meta_vendas ?? 50000; // Meta padrão R$ 50.000
    const achieved = metaVendas ? Math.min(100, Math.round(100 * (row.valor_vendas ?? 0) / metaVendas)) : 0;
    const variant = achieved < 50 ? "danger" : achieved < 80 ? "warning" : "success";
    return (
      <div className="min-w-[160px]">
        <ProgressBar value={achieved} max={100} size="sm" variant={variant} />
        <div className="text-xs text-muted-foreground mt-1">
          {achieved}% da meta
        </div>
      </div>
    );
  }

  // Função para renderizar ícone de medalha para top 3
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
              onChange={(e) => setRange(r => ({ ...r, from: e.target.value }))}
              className="w-full px-3 py-2 border rounded text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Até</label>
            <input
              type="date"
              value={range.to ?? ""}
              onChange={(e) => setRange(r => ({ ...r, to: e.target.value }))}
              className="w-full px-3 py-2 border rounded text-sm"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExportCsv("agents")}>Exportar Atendentes (CSV)</Button>
          <Button variant="outline" onClick={() => handleExportCsv("teams")}>Exportar Times (CSV)</Button>
        </div>
      </div>
      {/* card "meus números" */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          title="Minhas vendas"
          value={me?.quantidade_vendas ?? 0}
          gradientVariant="emerald"
          subtitle="Total nas campanhas ativas"
          trend={vendasTrend}
          miniChart={
            <MiniAreaChart
              data={getTrendChartData.contratos}
              dataKey="value"
              xKey="day"
              stroke="#10b981"
              height={60}
            />
          }
        />
        <KPICard
          title="Meu valor em vendas"
          value={`R$ ${(me?.valor_vendas ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          gradientVariant="violet"
          subtitle={`Meta: R$ ${(myTarget?.meta_vendas ?? 50000).toLocaleString('pt-BR')}/mês`}
          trend={valorTrend}
          miniChart={
            <MiniAreaChart
              data={getTrendChartData.consultoria}
              dataKey="value"
              xKey="day"
              stroke="#8b5cf6"
              height={60}
              tooltipFormatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            />
          }
        />
        <GradientPanel>
          <div className="space-y-2">
            <div className="text-sm font-medium">Minha Pontuação</div>
            <div className="text-2xl font-bold text-primary">
              {me?.pontuacao ?? 0} pts
            </div>
            <div className="text-xs text-muted-foreground">
              {me?.campanha_nome ? `Campanha: ${me.campanha_nome}` : 'Nenhuma campanha ativa'}
            </div>
            {me && (
              <div className="text-xs text-muted-foreground">
                Posição no ranking: {tableData.findIndex(agent => agent.user_id === me.user_id) + 1}º lugar
              </div>
            )}
          </div>
        </GradientPanel>
      </div>

      {/* ranking de atendentes */}
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
                { key: "atingimento", header: "Atingimento Meta", render: ProgressCell },
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

          {/* Botão Nova Campanha */}
          <Button
            className="flex items-center gap-2"
            onClick={() => setShowNovaCampanhaModal(true)}
          >
            <Plus className="h-4 w-4" />
            Nova Campanha
          </Button>

          {/* Modal de Nova Campanha */}
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
            <div className="text-center py-12 text-muted-foreground">
              Carregando campanhas ativas...
            </div>
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
              };
              const statusConfig = statusConfigs[campanha.status as keyof typeof statusConfigs] || statusConfigs.ativa;

              return (
                <GradientPanel key={campanha.id}>
                  <div className="space-y-4">
                    {/* Header da campanha */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-bold">{campanha.nome}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                            {statusConfig.label}
                          </span>
                        </div>
                        <p className="text-muted-foreground mt-1">{campanha.descricao}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          📅 {new Date(campanha.data_inicio).toLocaleDateString('pt-BR')} - {new Date(campanha.data_fim).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditarCampanha(campanha)}
                          className="flex items-center gap-2"
                        >
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
                    {campanha.rankings && campanha.rankings.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm">🏆 Ranking Atual</h4>
                        <div className="space-y-2">
                          {campanha.rankings.slice(0, 5).map((ranking: any, idx: number) => {
                            const medals = ["🥇", "🥈", "🥉"];
                            const medal = idx < 3 ? medals[idx] : `${idx + 1}º`;

                            return (
                              <div key={ranking.id} className="flex items-center gap-3 bg-muted/30 p-3 rounded-lg">
                                <div className="flex-shrink-0 w-8 text-center font-bold text-sm">
                                  {medal}
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium text-sm">{ranking.nome_agente}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {ranking.pontuacao} pontos
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-medium">
                                    R$ {ranking.valor_vendas?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {ranking.quantidade_vendas || 0} vendas
                                  </div>
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
                              <div className="flex-shrink-0 w-20 font-bold text-sm text-muted-foreground">
                                {premiacao.posicao}º lugar
                              </div>
                              <div className="flex-1 text-sm font-medium">
                                {premiacao.descricao}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* CTA */}
                  {campanha.status === "ativa" && (
                    <div className="pt-2 border-t">
                      <Button className="w-full" variant="default">
                        Ver Ranking da Campanha →
                      </Button>
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

              const statusConfig = STATUS_CONFIG[campanha.status as keyof typeof STATUS_CONFIG];

              return (
                <GradientPanel key={campanha.id}>
                  <div className="space-y-4">
                    {/* Header da campanha */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-bold">{campanha.nome}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                            {statusConfig.label}
                          </span>
                        </div>
                        <p className="text-muted-foreground mt-1">{campanha.descricao}</p>
                        <p className="text-sm text-muted-foreground mt-1">📅 {campanha.periodo}</p>
                      </div>
                    </div>

                    {/* Vencedores (se encerrada) */}
                    {campanha.status === "encerrada" && campanha.vencedores && (
                      <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                        <h4 className="font-semibold text-sm">🏆 Vencedores</h4>
                        <div className="flex gap-2 flex-wrap">
                          {campanha.vencedores.map((vencedor: string, idx: number) => {
                            const medals = ["🥇", "🥈", "🥉"];
                            return (
                              <div key={idx} className="flex items-center gap-2 bg-background px-3 py-2 rounded-md">
                                <span className="text-lg">{medals[idx]}</span>
                                <span className="font-medium text-sm">{vencedor}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Premiações */}
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">🎯 Premiações</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {campanha.premiacoes.map((premiacao: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-3 bg-muted/30 p-3 rounded-lg">
                            <div className="flex-shrink-0 w-20 font-bold text-sm text-muted-foreground">
                              {premiacao.posicao}
                            </div>
                            <div className="flex-1 text-sm font-medium">
                              {premiacao.premio}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditarCampanha(campanha)}
                        className="flex-1"
                      >
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

      {/* Modal de Edição de Campanha */}
      <CampaignModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        onSubmit={handleSalvarEdicao}
        isLoading={editarCampanhaMutation.isPending}
        mode="edit"
        initialData={editingCampanha}
      />

      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a campanha "{(campanhaToDelete as any)?.nome}"?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={excluirCampanhaMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmarExclusao}
              disabled={excluirCampanhaMutation.isPending}
            >
              {excluirCampanhaMutation.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
