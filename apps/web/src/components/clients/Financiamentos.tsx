'use client'
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CreditCard, Calendar, Building2, Hash, TrendingUp } from "lucide-react";

interface Financiamento {
  id: number;
  financiamento_code: string;
  total_parcelas: number;
  parcelas_pagas: number;
  valor_parcela_ref: string;
  orgao_pagamento: string;
  orgao_pagamento_nome?: string;  // Nome do órgão pagador
  referencia: string;
  entity_code: string;
  entity_name: string;
  status_code: string;
  status_description: string;
  cargo?: string;
  orgao?: string;
  lanc?: string;
}

interface FinanciamentosProps {
  clientId: number;
}

export default function Financiamentos({ clientId }: FinanciamentosProps) {
  const { data: financiamentos = [], isLoading, error } = useQuery({
    queryKey: ["client-financiamentos", clientId],
    queryFn: async () => {
      const response = await api.get(`/clients/${clientId}/financiamentos`);
      return response.data as Financiamento[];
    },
  });

  const getStatusBadge = (status: string, description: string) => {
    const colorMap: Record<string, string> = {
      "1": "bg-green-100 text-green-800 border-green-200", // Lançado e Efetivado
      "2": "bg-yellow-100 text-yellow-800 border-yellow-200", // Sem margem temporariamente
      "3": "bg-red-100 text-red-800 border-red-200", // Outros motivos
      "4": "bg-blue-100 text-blue-800 border-blue-200", // Valor diferente
      "5": "bg-orange-100 text-orange-800 border-orange-200", // Problemas técnicos
      "6": "bg-red-100 text-red-800 border-red-200", // Com erros
      "S": "bg-gray-100 text-gray-800 border-gray-200", // Suspensão
    };

    const colorClass = colorMap[status] || "bg-gray-100 text-gray-800";

    return (
      <Badge className={`${colorClass} text-xs font-medium`} title={description}>
        {status}
      </Badge>
    );
  };

  // Normalizar valor: "30.00" ou "30,00" = 30 reais
  const normalizeValue = (value: string): number => {
    if (!value) return 0;

    // Remove espaços
    let normalized = value.trim();

    // Se contém vírgula e ponto, assume formato BR (1.234,56)
    if (normalized.includes(',') && normalized.includes('.')) {
      normalized = normalized.replace(/\./g, '').replace(',', '.');
    }
    // Se contém apenas vírgula, substitui por ponto
    else if (normalized.includes(',')) {
      normalized = normalized.replace(',', '.');
    }
    // Se contém apenas ponto, mantém como está (assume formato US)

    return parseFloat(normalized) || 0;
  };

  const formatCurrency = (value: string) => {
    const num = normalizeValue(value);
    return num.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    });
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <CreditCard className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Contratos</h3>
        </div>
        <div className="text-center py-8">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-48 mx-auto mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <CreditCard className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Contratos</h3>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <p>Erro ao carregar financiamentos</p>
        </div>
      </Card>
    );
  }

  if (financiamentos.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <CreditCard className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Contratos</h3>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Nenhum contrato encontrado</p>
          <p className="text-sm">Este cliente ainda não possui contratos importados</p>
        </div>
      </Card>
    );
  }

  // Agrupar por referência para mostrar seções
  const financiamentosPorRef = financiamentos.reduce((acc, fin) => {
    if (!acc[fin.referencia]) {
      acc[fin.referencia] = [];
    }
    acc[fin.referencia].push(fin);
    return acc;
  }, {} as Record<string, Financiamento[]>);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <CreditCard className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Contratos</h3>
        </div>
        <Badge variant="outline" className="text-xs">
          {financiamentos.length} registros
        </Badge>
      </div>

      <div className="space-y-6">
        {Object.entries(financiamentosPorRef)
          .sort(([a], [b]) => b.localeCompare(a)) // Mais recente primeiro
          .map(([referencia, items]) => (
            <div key={referencia} className="space-y-3">
              <div className="flex items-center gap-2 border-b pb-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                <h4 className="font-medium text-sm">Referência: {referencia}</h4>
                <Badge variant="secondary" className="text-xs ml-auto">
                  {items.length} financiamentos
                </Badge>
              </div>

              <div className="overflow-x-auto">
                <div className="min-w-full">
                  <div className="grid grid-cols-8 gap-4 p-3 bg-muted/50 rounded-t-lg text-sm font-medium text-muted-foreground">
                    <div>STATUS</div>
                    <div>FIN.</div>
                    <div>BANCO ENTIDADE</div>
                    <div>TOTAL</div>
                    <div>PAGO</div>
                    <div>VALOR</div>
                    <div>ÓRGÃO PAGTO</div>
                    <div>ENTIDADE</div>
                  </div>
                  <div className="divide-y divide-border">
                    {items.map((fin) => (
                      <div key={fin.id} className="grid grid-cols-8 gap-4 p-3 hover:bg-muted/50 transition-colors">
                        <div>
                          {getStatusBadge(fin.status_code, fin.status_description)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1">
                            <Hash className="h-3 w-3 text-muted-foreground" />
                            <span className="font-mono text-sm">{fin.financiamento_code}</span>
                          </div>
                        </div>
                        <div>
                          <Badge variant="secondary" className="text-xs">
                            {fin.orgao || '-'}
                          </Badge>
                        </div>
                        <div>
                          <span className="font-medium">{fin.total_parcelas}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3 text-green-500" />
                            <span>{fin.parcelas_pagas}</span>
                          </div>
                        </div>
                        <div>
                          <span className="font-semibold text-green-600">
                            {formatCurrency(fin.valor_parcela_ref)}
                          </span>
                        </div>
                        <div>
                          {/* Mostrar nome do órgão se disponível, senão apenas código */}
                          {fin.orgao_pagamento_nome ? (
                            <div className="text-sm" title={`${fin.orgao_pagamento} - ${fin.orgao_pagamento_nome}`}>
                              <span className="font-medium">{fin.orgao_pagamento}</span>
                              {' - '}
                              <span className="text-muted-foreground">{fin.orgao_pagamento_nome}</span>
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              {fin.orgao_pagamento}
                            </Badge>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{fin.entity_name}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>
    </Card>
  );
}