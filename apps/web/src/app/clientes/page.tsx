"use client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@lifecalling/ui";
import { api } from "@/lib/api";
import Link from "next/link";
import { Search, User, FileText, Users } from "lucide-react";

export default function Clientes() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["/clients", page, pageSize, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
      });

      if (searchTerm) {
        params.append("q", searchTerm);
      }

      const response = await api.get(`/clients?${params.toString()}`);
      return response.data;
    },
  });

  const clients = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            Clientes
          </h1>
          <p className="text-muted-foreground">
            Clientes importados do sistema de folha de pagamento
          </p>
        </div>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CPF ou matrícula..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1); // Reset para primeira página ao buscar
              }}
              className="pl-10"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {total} {total === 1 ? 'cliente' : 'clientes'}
          </div>
        </div>
      </Card>

      {/* Lista de Clientes */}
      {isLoading ? (
        <div className="grid gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2 mb-1"></div>
              <div className="h-3 bg-muted rounded w-1/4"></div>
            </Card>
          ))}
        </div>
      ) : clients.length === 0 ? (
        <Card className="p-8 text-center">
          <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">
            {searchTerm ? "Nenhum cliente encontrado" : "Nenhum cliente importado"}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm
              ? "Tente ajustar os filtros de busca"
              : "Importe um arquivo de folha de pagamento para ver os clientes aqui"}
          </p>
          {!searchTerm && (
            <Button asChild>
              <Link href="/importacao">
                <FileText className="h-4 w-4 mr-2" />
                Importar Dados
              </Link>
            </Button>
          )}
        </Card>
      ) : (
        <>
          <div className="grid gap-4">
            {clients.map((client: any) => (
              <Card key={client.id} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{client.nome}</h3>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {client.contratos} contrato{client.contratos !== 1 ? 's' : ''}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">CPF:</span> {formatCPF(client.cpf)}
                      </div>
                      <div>
                        <span className="font-medium">Matrícula:</span> {client.matricula}
                      </div>
                      <div>
                        <span className="font-medium">Órgão:</span> {client.orgao || "—"}
                      </div>
                    </div>

                    {client.created_at && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Importado em {new Date(client.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </div>

                  <div className="ml-4">
                    <Button asChild>
                      <Link href={`/clientes/${client.id}`}>
                        Ver Detalhes
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Paginação */}
          {total > 0 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={total}
              itemsPerPage={pageSize}
              onPageChange={setPage}
              onItemsPerPageChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
              itemsPerPageOptions={[20, 50, 100]}
            />
          )}
        </>
      )}
    </div>
  );
}