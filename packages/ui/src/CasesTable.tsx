/* packages/ui/src/CasesTable.tsx */
import React, { useState, useMemo } from "react";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { Card, CardContent } from "./Card";
import { Input } from "./Input";
import { cn } from "./lib/utils";
import { 
  Eye, 
  User, 
  Calendar, 
  Phone, 
  FileText, 
  Search, 
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Pause
} from "lucide-react";

interface Client {
  id: number;
  name: string;
  cpf: string;
  matricula: string;
  orgao?: string;
  telefone_preferencial?: string;
}

interface Case {
  id: number;
  status: string;
  client: Client;
  created_at: string;
  assigned_to?: string;
  telefone_preferencial?: string;
  observacoes?: string;
  banco?: string;
}

interface CasesTableProps {
  cases: Case[];
  onViewCase?: (caseId: number) => void;
  loading?: boolean;
  className?: string;
  showFilters?: boolean;
}

export function CasesTable({ 
  cases, 
  onViewCase, 
  loading, 
  className,
  showFilters = true 
}: CasesTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      novo: { variant: "secondary" as const, label: "Novo", icon: Clock },
      em_andamento: { variant: "default" as const, label: "Em Andamento", icon: Clock },
      aguardando_simulacao: { variant: "outline" as const, label: "Aguardando Simulação", icon: Pause },
      simulacao_aprovada: { variant: "default" as const, label: "Simulação Aprovada", icon: CheckCircle },
      contrato_enviado: { variant: "default" as const, label: "Contrato Enviado", icon: FileText },
      finalizado: { variant: "default" as const, label: "Finalizado", icon: CheckCircle },
      cancelado: { variant: "destructive" as const, label: "Cancelado", icon: XCircle },
      rejeitado: { variant: "destructive" as const, label: "Rejeitado", icon: XCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      variant: "secondary" as const,
      label: status,
      icon: AlertCircle
    };

    const IconComponent = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const filteredCases = useMemo(() => {
    return cases.filter(case_ => {
      // Filtro de busca
      const matchesSearch = searchTerm === "" || 
        case_.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        case_.client.cpf.includes(searchTerm) ||
        case_.client.matricula.toLowerCase().includes(searchTerm.toLowerCase()) ||
        case_.id.toString().includes(searchTerm);

      // Filtro de status
      const matchesStatus = statusFilter === "all" || case_.status === statusFilter;

      // Filtro de data
      let matchesDate = true;
      if (dateFilter !== "all") {
        const caseDate = new Date(case_.created_at);
        const now = new Date();
        
        switch (dateFilter) {
          case "today":
            matchesDate = caseDate.toDateString() === now.toDateString();
            break;
          case "week":
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            matchesDate = caseDate >= weekAgo;
            break;
          case "month":
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            matchesDate = caseDate >= monthAgo;
            break;
        }
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [cases, searchTerm, statusFilter, dateFilter]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-20 bg-muted rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Filtros */}
      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar por nome, CPF, matrícula ou ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <div className="relative">
                  <select 
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-[180px] px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none pr-8"
                  >
                    <option value="all">Todos os Status</option>
                    <option value="novo">Novo</option>
                    <option value="em_andamento">Em Andamento</option>
                    <option value="aguardando_simulacao">Aguardando Simulação</option>
                    <option value="simulacao_aprovada">Simulação Aprovada</option>
                    <option value="contrato_enviado">Contrato Enviado</option>
                    <option value="finalizado">Finalizado</option>
                    <option value="cancelado">Cancelado</option>
                    <option value="rejeitado">Rejeitado</option>
                  </select>
                  <Filter className="w-4 h-4 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400" />
                </div>

                <div className="relative">
                  <select 
                    value={dateFilter} 
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-[150px] px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none pr-8"
                  >
                    <option value="all">Todos</option>
                    <option value="today">Hoje</option>
                    <option value="week">Última Semana</option>
                    <option value="month">Último Mês</option>
                  </select>
                  <Calendar className="w-4 h-4 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultados */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {filteredCases.length} de {cases.length} atendimentos
        </p>
      </div>

      {filteredCases.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">Nenhum atendimento encontrado</p>
            <p className="text-sm text-muted-foreground">Tente ajustar os filtros ou verificar novamente</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Header - Desktop only */}
          <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 py-2 text-sm font-medium text-muted-foreground border-b">
            <div className="col-span-1">ID</div>
            <div className="col-span-3">Cliente</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Órgão</div>
            <div className="col-span-2">Criado em</div>
            <div className="col-span-1">Atendente</div>
            <div className="col-span-1">Ações</div>
          </div>

          {/* Case rows */}
          {filteredCases.map((case_) => (
            <Card key={case_.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                {/* Mobile Layout */}
                <div className="md:hidden space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground">#{case_.id}</span>
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{case_.client.name}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        CPF: {case_.client.cpf} • Mat: {case_.client.matricula}
                      </div>
                      {case_.client.telefone_preferencial && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <Phone className="h-3 w-3" />
                          {case_.client.telefone_preferencial}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {onViewCase && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewCase(case_.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {getStatusBadge(case_.status)}
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {case_.client.orgao && (
                      <span>{case_.client.orgao}</span>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(case_.created_at)}
                    </div>
                    {case_.assigned_to && (
                      <span>Atendente: {case_.assigned_to}</span>
                    )}
                  </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden md:grid md:grid-cols-12 gap-4 items-center">
                  <div className="col-span-1">
                    <span className="text-sm font-mono">#{case_.id}</span>
                  </div>
                  
                  <div className="col-span-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{case_.client.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {case_.client.cpf} • {case_.client.matricula}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-span-2">
                    {getStatusBadge(case_.status)}
                  </div>
                  
                  <div className="col-span-2 text-sm">
                    {case_.client.orgao || '-'}
                  </div>
                  
                  <div className="col-span-2 text-sm">
                    {formatDate(case_.created_at)}
                  </div>
                  
                  <div className="col-span-1 text-sm">
                    {case_.assigned_to || '-'}
                  </div>
                  
                  <div className="col-span-1 flex gap-1">
                    {onViewCase && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewCase(case_.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}