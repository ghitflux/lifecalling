/* packages/ui/src/UserTable.tsx */
import React from "react";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { Card, CardContent } from "./Card";
import { cn } from "./lib/utils";
import { Edit, Trash2, User, Mail, Shield, Calendar } from "lucide-react";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  active: boolean;
  status?: string;
  created_at: string;
  last_login?: string;
  department?: string;
  phone?: string;
}

interface UserTableProps {
  users: User[];
  onEdit?: (user: User) => void;
  onDelete?: (id: number) => void;
  loading?: boolean;
  className?: string;
}

export function UserTable({ users, onEdit, onDelete, loading, className }: UserTableProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (active: boolean) => {
    return (
      <Badge variant={active ? "default" : "secondary"}>
        {active ? 'Ativo' : 'Inativo'}
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    const roleLabels = {
      admin: 'Administrador',
      supervisor: 'Supervisor',
      financeiro: 'Financeiro',
      calculista: 'Calculista',
      atendente: 'Atendente'
    } as const;

    return (
      <Badge variant="outline">
        <Shield className="w-3 h-3 mr-1" />
        {roleLabels[role as keyof typeof roleLabels] || role}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-16 bg-muted rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <User className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-muted-foreground">Nenhum usuário encontrado</p>
          <p className="text-sm text-muted-foreground">Tente ajustar os filtros ou adicionar novos usuários</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header - Desktop only */}
      <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 py-2 text-sm font-medium text-muted-foreground border-b">
        <div className="col-span-3">Usuário</div>
        <div className="col-span-2">Função</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-2">Departamento</div>
        <div className="col-span-2">Criado em</div>
        <div className="col-span-1">Ações</div>
      </div>

      {/* User rows */}
      {users.map((user) => (
        <Card key={user.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            {/* Mobile Layout */}
            <div className="md:hidden space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{user.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    {user.email}
                  </div>
                </div>
                <div className="flex gap-1">
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(user)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(user.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {getRoleBadge(user.role)}
                {getStatusBadge(user.active)}
              </div>
              
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {user.department && (
                  <span>{user.department}</span>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(user.created_at)}
                </div>
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden md:grid md:grid-cols-12 gap-4 items-center">
              <div className="col-span-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </div>
                </div>
              </div>
              
              <div className="col-span-2">
                {getRoleBadge(user.role)}
              </div>

              <div className="col-span-2">
                {getStatusBadge(user.active)}
              </div>
              
              <div className="col-span-2 text-sm">
                {user.department || '-'}
              </div>
              
              <div className="col-span-2 text-sm">
                {formatDate(user.created_at)}
              </div>
              
              <div className="col-span-1 flex gap-1">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(user)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(user.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}