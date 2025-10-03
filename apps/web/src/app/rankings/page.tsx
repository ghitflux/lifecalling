"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { KPICard, RankingTable, GradientPanel, ProgressBar, MiniAreaChart } from "@lifecalling/ui"; // reuse
import { useAuth } from "@/lib/auth";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

// Dados mockados de campanhas (REMOVIDO - agora vem da API)
const MOCK_CAMPANHAS_OLD = [
  {
    id: 1,
    nome: "Campanha de Natal 2024",
    descricao: "Bata a meta em dezembro e ganhe prêmios especiais!",
    periodo: "01/12/2024 - 31/12/2024",
    status: "ativa",
    premiacoes: [
      { posicao: "1º Lugar", premio: "R$ 5.000 + Viagem para 2 pessoas" },
      { posicao: "2º Lugar", premio: "R$ 3.000 + Voucher de compras" },
      { posicao: "3º Lugar", premio: "R$ 2.000 + Kit premium" },
      { posicao: "Top 10", premio: "Bônus de R$ 500" }
    ],
    progresso: 68
  },
  {
    id: 2,
    nome: "Desafio Q1 2025",
    descricao: "Meta trimestral com premiação progressiva",
    periodo: "01/01/2025 - 31/03/2025",
    status: "proxima",
    premiacoes: [
      { posicao: "1º Lugar", premio: "R$ 8.000 + Eletrodoméstico Premium" },
      { posicao: "2º Lugar", premio: "R$ 5.000 + Smartphone" },
      { posicao: "3º Lugar", premio: "R$ 3.000 + Tablet" }
    ],
    progresso: 0
  },
  {
    id: 3,
    nome: "Campanha Black Friday",
    descricao: "Recordes na semana do consumo",
    periodo: "20/11/2024 - 30/11/2024",
    status: "encerrada",
    premiacoes: [
      { posicao: "1º Lugar", premio: "R$ 3.000 em vale-compras" },
      { posicao: "2º Lugar", premio: "R$ 2.000 em vale-compras" },
      { posicao: "3º Lugar", premio: "R$ 1.000 em vale-compras" }
    ],
    progresso: 100,
    vencedores: ["Maria Oliveira", "Ana Silva", "Patricia Souza"]
  }
];

// Dados mockados de tendência para os mini gráficos (últimos 7 dias)
const MOCK_TREND_DATA = {
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
    queryFn: async () => (await api.get("/campanhas")).data.items
  });

  // Estado do formulário de nova campanha
  const [novaCampanha, setNovaCampanha] = useState({
    nome: "",
    descricao: "",
    data_inicio: "",
    data_fim: "",
    status: "proxima",
    premiacoes: [
      { posicao: "1º Lugar", premio: "" },
      { posicao: "2º Lugar", premio: "" },
      { posicao: "3º Lugar", premio: "" }
    ]
  });

  // Mutation para criar campanha
  const criarCampanhaMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post("/campanhas", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campanhas"] });
      toast.success("Campanha criada com sucesso!");
      setShowNovaCampanhaModal(false);
      // Resetar formulário
      setNovaCampanha({
        nome: "",
        descricao: "",
        data_inicio: "",
        data_fim: "",
        status: "proxima",
        premiacoes: [
          { posicao: "1º Lugar", premio: "" },
          { posicao: "2º Lugar", premio: "" },
          { posicao: "3º Lugar", premio: "" }
        ]
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Erro ao criar campanha");
    }
  });

  const handleCriarCampanha = () => {
    // Validações
    if (!novaCampanha.nome || !novaCampanha.descricao || !novaCampanha.data_inicio || !novaCampanha.data_fim) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    // Validar premiações
    const premiacoesValidas = novaCampanha.premiacoes.filter(p => p.premio.trim() !== "");
    if (premiacoesValidas.length === 0) {
      toast.error("Adicione pelo menos uma premiação");
      return;
    }

    criarCampanhaMutation.mutate({
      ...novaCampanha,
      premiacoes: premiacoesValidas
    });
  };

  const adicionarPremiacao = () => {
    setNovaCampanha({
      ...novaCampanha,
      premiacoes: [...novaCampanha.premiacoes, { posicao: "", premio: "" }]
    });
  };

  const removerPremiacao = (index: number) => {
    setNovaCampanha({
      ...novaCampanha,
      premiacoes: novaCampanha.premiacoes.filter((_, i) => i !== index)
    });
  };

  const atualizarPremiacao = (index: number, field: "posicao" | "premio", value: string) => {
    const novasPremiacoes = [...novaCampanha.premiacoes];
    novasPremiacoes[index][field] = value;
    setNovaCampanha({ ...novaCampanha, premiacoes: novasPremiacoes });
  };

  // calcular “meus números”
  const me = agents.data?.find((r:any)=> r.user_id === user?.id);
  const myTarget = useMemo(() => {
    return targets.data?.find((t: any) => t.user_id === user?.id);
  }, [targets.data, user?.id]);

  const tableData = useMemo(() => {
    const base = agents.data ?? [];
    return base.map((row: any, idx: number) => ({
      ...row,
      pos: idx + 1,
      isTop3: idx < 3  // Marcar top 3 para destaque visual
    }));
  }, [agents.data]);

  function ProgressCell(row: any) {
    const t = targets.data?.find((x: any) => x.user_id === row.user_id);
    const metaConsultoria = t?.meta_consultoria ?? 10000; // Meta padrão R$ 10.000
    const achieved = metaConsultoria ? Math.min(100, Math.round(100 * (row.consultoria_liq ?? 0) / metaConsultoria)) : 0;
    const variant = achieved < 50 ? "danger" : achieved < 80 ? "warning" : "success";
    return (
      <div className="min-w-[160px]">
        <ProgressBar value={achieved} max={100} size="sm" variant={variant} />
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
          <div>
            <label className="text-xs text-muted-foreground">De</label>
            <Input type="date" value={range.from ?? ""} onChange={(e) => setRange(r => ({ ...r, from: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Até</label>
            <Input type="date" value={range.to ?? ""} onChange={(e) => setRange(r => ({ ...r, to: e.target.value }))} />
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
          title="Meus contratos"
          value={me?.contracts ?? 0}
          gradientVariant="emerald"
          subtitle="Total no período"
          trend={12.5}
          miniChart={
            <MiniAreaChart
              data={MOCK_TREND_DATA.contratos}
              dataKey="value"
              xKey="day"
              stroke="#10b981"
              height={80}
            />
          }
        />
        <KPICard
          title="Minha consultoria líquida"
          value={`R$ ${(me?.consultoria_liq ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          gradientVariant="violet"
          subtitle={`Meta: R$ 10.000/mês`}
          trend={18.7}
          miniChart={
            <MiniAreaChart
              data={MOCK_TREND_DATA.consultoria}
              dataKey="value"
              xKey="day"
              stroke="#8b5cf6"
              height={80}
              tooltipFormatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            />
          }
        />
        <GradientPanel>
          <div className="space-y-2">
            <div className="text-sm font-medium">Atingimento de Meta</div>
            <div className="text-xs text-muted-foreground mb-2">Meta: R$ 10.000/mês</div>
            <ProgressBar
              value={Math.min(100, Math.round(100 * (me?.consultoria_liq ?? 0) / 10000))}
              max={100}
              size="md"
              variant={
                Math.round(100 * (me?.consultoria_liq ?? 0) / 10000) < 50
                  ? "danger"
                  : Math.round(100 * (me?.consultoria_liq ?? 0) / 10000) < 80
                  ? "warning"
                  : "success"
              }
              showLabel
              label="Consultoria Líquida"
            />
          </div>
        </GradientPanel>
      </div>

      {/* ranking de atendentes */}
      <GradientPanel>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">🏆 Ranking de Atendentes</h2>
            <div className="text-sm text-muted-foreground">Meta: R$ 10.000/mês</div>
          </div>
          <RankingTable
            data={tableData}
            columns={[
              { key: "pos", header: "#", render: RankCell },
              { key: "name", header: "Atendente" },
              { key: "contracts", header: "Contratos", format: "number" },
              { key: "consultoria_liq", header: "Consult. Líq.", format: "currency" },
              { key: "ticket_medio", header: "Ticket Médio", format: "currency" },
              { key: "atingimento", header: "Atingimento Meta", render: ProgressCell },
              { key: "trend_consult", header: "Δ Consult.", format: "signedCurrency" },
            ]}
            highlightTop3
          />
        </div>
      </GradientPanel>

      {/* Campanhas de Engajamento com Premiações */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">🎁 Campanhas de Engajamento</h2>
            <p className="text-sm text-muted-foreground mt-1">Participe e ganhe prêmios incríveis!</p>
          </div>

          {/* Botão Nova Campanha */}
          <Dialog open={showNovaCampanhaModal} onOpenChange={setShowNovaCampanhaModal}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nova Campanha
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Nova Campanha</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Nome */}
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome da Campanha *</Label>
                  <Input
                    id="nome"
                    value={novaCampanha.nome}
                    onChange={(e) => setNovaCampanha({ ...novaCampanha, nome: e.target.value })}
                    placeholder="Ex: Campanha de Natal 2024"
                  />
                </div>

                {/* Descrição */}
                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição *</Label>
                  <Textarea
                    id="descricao"
                    value={novaCampanha.descricao}
                    onChange={(e) => setNovaCampanha({ ...novaCampanha, descricao: e.target.value })}
                    placeholder="Descreva os objetivos da campanha..."
                    rows={3}
                  />
                </div>

                {/* Datas */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="data_inicio">Data de Início *</Label>
                    <Input
                      id="data_inicio"
                      type="date"
                      value={novaCampanha.data_inicio}
                      onChange={(e) => setNovaCampanha({ ...novaCampanha, data_inicio: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="data_fim">Data de Fim *</Label>
                    <Input
                      id="data_fim"
                      type="date"
                      value={novaCampanha.data_fim}
                      onChange={(e) => setNovaCampanha({ ...novaCampanha, data_fim: e.target.value })}
                    />
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={novaCampanha.status}
                    onChange={(e) => setNovaCampanha({ ...novaCampanha, status: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 bg-background"
                  >
                    <option value="proxima">Próxima</option>
                    <option value="ativa">Ativa</option>
                    <option value="encerrada">Encerrada</option>
                  </select>
                </div>

                {/* Premiações */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Premiações *</Label>
                    <Button type="button" size="sm" variant="outline" onClick={adicionarPremiacao}>
                      <Plus className="h-3 w-3 mr-1" />
                      Adicionar
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {novaCampanha.premiacoes.map((premiacao, idx) => (
                      <div key={idx} className="flex gap-2 items-start">
                        <div className="flex-1 grid grid-cols-3 gap-2">
                          <Input
                            placeholder="Posição"
                            value={premiacao.posicao}
                            onChange={(e) => atualizarPremiacao(idx, "posicao", e.target.value)}
                          />
                          <Input
                            placeholder="Prêmio"
                            className="col-span-2"
                            value={premiacao.premio}
                            onChange={(e) => atualizarPremiacao(idx, "premio", e.target.value)}
                          />
                        </div>
                        {novaCampanha.premiacoes.length > 1 && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => removerPremiacao(idx)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Botões */}
                <div className="flex gap-2 justify-end pt-4 border-t">
                  <Button variant="outline" onClick={() => setShowNovaCampanhaModal(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCriarCampanha} disabled={criarCampanhaMutation.isPending}>
                    {criarCampanhaMutation.isPending ? "Criando..." : "Criar Campanha"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {campanhas.isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Carregando campanhas...
            </div>
          ) : (campanhas.data || []).length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-lg">
              <p className="text-muted-foreground">Nenhuma campanha cadastrada</p>
              <p className="text-sm text-muted-foreground mt-1">Clique em "Nova Campanha" para criar</p>
            </div>
          ) : (
            (campanhas.data || []).map((campanha: any) => {
            const statusConfig = {
              ativa: { bg: "bg-green-500/10", text: "text-green-600", label: "🟢 Ativa" },
              proxima: { bg: "bg-blue-500/10", text: "text-blue-600", label: "🔵 Próxima" },
              encerrada: { bg: "bg-gray-500/10", text: "text-gray-600", label: "⚫ Encerrada" }
            }[campanha.status];

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

                  {/* Progresso (se campanha ativa) */}
                  {campanha.status === "ativa" && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Progresso da campanha</span>
                        <span className="text-muted-foreground">{campanha.progresso}%</span>
                      </div>
                      <ProgressBar
                        value={campanha.progresso}
                        max={100}
                        size="md"
                        variant={campanha.progresso < 50 ? "warning" : "success"}
                        showLabel
                      />
                    </div>
                  )}

                  {/* Vencedores (se encerrada) */}
                  {campanha.status === "encerrada" && campanha.vencedores && (
                    <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                      <h4 className="font-semibold text-sm">🏆 Vencedores</h4>
                      <div className="flex gap-2">
                        {campanha.vencedores.map((vencedor, idx) => {
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
                      {campanha.premiacoes.map((premiacao, idx) => (
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
    </div>
  );
}
