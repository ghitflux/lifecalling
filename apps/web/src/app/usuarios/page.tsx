"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Users, UserCheck, UserX, Shield } from "lucide-react";
import { toast } from "sonner";

import {
  UserTable,
  UserForm,
  UserCard,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  FilterComponent,
  useFilters,
  type FilterOption
} from "@lifecalling/ui";

import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  active: boolean;
  status?: string; // Para compatibilidade com tabela
  created_at: string;
  last_login?: string;
  department?: string;
  phone?: string;
}

interface UserStats {
  total_users: number;
  active_users: number;
  inactive_users: number;
  admin_users: number;
}

export default function UsuariosPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Configuração dos filtros
  const filterOptions: FilterOption[] = [
    {
      key: 'role',
      label: 'Função',
      type: 'select',
      options: [
        { value: 'admin', label: 'Administrador' },
        { value: 'supervisor', label: 'Supervisor' },
        { value: 'user', label: 'Usuário' },
        { value: 'viewer', label: 'Visualizador' }
      ],
      placeholder: 'Selecionar função'
    },
    {
      key: 'active',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'true', label: 'Ativo' },
        { value: 'false', label: 'Inativo' }
      ],
      placeholder: 'Selecionar status'
    },
    {
      key: 'department',
      label: 'Departamento',
      type: 'select',
      options: [
        { value: 'ti', label: 'TI' },
        { value: 'rh', label: 'Recursos Humanos' },
        { value: 'financeiro', label: 'Financeiro' },
        { value: 'operacional', label: 'Operacional' },
        { value: 'juridico', label: 'Jurídico' }
      ],
      placeholder: 'Selecionar departamento'
    },
    {
      key: 'created_date',
      label: 'Data de Criação',
      type: 'daterange',
      placeholder: 'Período de criação'
    },
    {
      key: 'has_login',
      label: 'Já fez login',
      type: 'boolean'
    }
  ];

  // Hook de filtros
  const {
    // filters, // removed – not exposed by useFilters
    searchTerm,
    setFilter,
    removeFilter,
    clearAllFilters,
    setSearchTerm,
    activeFiltersCount,
    hasActiveFilters,
    getFilteredData
  } = useFilters({
    onFiltersChange: (newFilters) => {
      console.log('Filtros atualizados:', newFilters);
    },
    onSearch: (term) => {
      console.log('Busca atualizada:', term);
    }
  });

  // Queries
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await api.get("/users");
      return response.data?.items || [];
    },
    refetchInterval: 30000,
  });

  const { data: stats } = useQuery<UserStats>({
    queryKey: ["users", "stats"],
    queryFn: async () => {
      const response = await api.get("/users/stats/summary");
      return response.data;
    },
    refetchInterval: 60000,
  });

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: async (userData: Partial<User>) => {
      const response = await api.post("/users", userData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["users", "stats"] });
      toast.success("Usuário criado com sucesso!");
      setShowForm(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Erro ao criar usuário");
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, ...userData }: Partial<User> & { id: number }) => {
      const response = await api.put(`/users/${id}`, userData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["users", "stats"] });
      toast.success("Usuário atualizado com sucesso!");
      setEditingUser(null);
      setShowForm(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Erro ao atualizar usuário");
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["users", "stats"] });
      toast.success("Usuário removido com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Erro ao remover usuário");
    },
  });

  // Função personalizada de filtro para usuários
  const filterUsers = (user: User, filters: any, searchTerm: string): boolean => {
    // Filtro de busca por texto
    if (searchTerm) {
      const searchableText = `${user.name} ${user.email} ${user.department || ''}`.toLowerCase();
      if (!searchableText.includes(searchTerm.toLowerCase())) {
        return false;
      }
    }

    // Filtro por função
    if (filters.role && user.role !== filters.role) {
      return false;
    }

    // Filtro por status ativo/inativo
    if (filters.active !== undefined && filters.active !== '') {
      const isActive = filters.active === 'true';
      if (user.active !== isActive) {
        return false;
      }
    }

    // Filtro por departamento
    if (filters.department && user.department !== filters.department) {
      return false;
    }

    // Filtro por data de criação
    if (filters.created_date && filters.created_date.start && filters.created_date.end) {
      const userDate = new Date(user.created_at);
      const startDate = new Date(filters.created_date.start);
      const endDate = new Date(filters.created_date.end);
      if (userDate < startDate || userDate > endDate) {
        return false;
      }
    }

    // Filtro por login
    if (typeof filters.has_login === 'boolean') {
      const hasLogin = Boolean(user.last_login);
      if (hasLogin !== filters.has_login) {
        return false;
      }
    }

    return true;
  };

  // Dados filtrados
  const filteredUsers = useMemo(() => {
    return getFilteredData(users, filterUsers);
  }, [users, getFilteredData]);

  // Handlers
  const handleCreateUser = (userData: Partial<User>) => {
    createUserMutation.mutate(userData);
  };

  const handleUpdateUser = (userData: Partial<User>) => {
    if (editingUser) {
      updateUserMutation.mutate({ ...userData, id: editingUser.id });
    }
  };

  const handleDeleteUser = (id: number) => {
    if (confirm("Tem certeza que deseja remover este usuário?")) {
      deleteUserMutation.mutate(id);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const canManageUsers = user?.role === "admin" || user?.role === "supervisor";

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie usuários, permissões e acessos do sistema
          </p>
        </div>
        {canManageUsers && (
          <Button
            onClick={() => {
              setEditingUser(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Novo Usuário
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <UserCard
            title="Total de Usuários"
            value={stats.total_users}
            icon={<Users className="h-4 w-4" />}
            trend={{ value: 12, isPositive: true }}
          />
          <UserCard
            title="Usuários Ativos"
            value={stats.active_users}
            icon={<UserCheck className="h-4 w-4" />}
            trend={{ value: 8, isPositive: true }}
          />
          <UserCard
            title="Usuários Inativos"
            value={stats.inactive_users}
            icon={<UserX className="h-4 w-4" />}
            trend={{ value: 3, isPositive: false }}
          />
          <UserCard
            title="Administradores"
            value={stats.admin_users}
            icon={<Shield className="h-4 w-4" />}
            trend={{ value: 1, isPositive: true }}
          />
        </div>
      )}

      {/* Filtros */}
      <FilterComponent
        filters={filterOptions}
        onFiltersChange={(newFilters) => {
          Object.entries(newFilters).forEach(([key, value]) => {
            setFilter(key, value);
          });
        }}
        onSearch={setSearchTerm}
        searchPlaceholder="Buscar por nome, email ou departamento..."
        showSearch={true}
        showFilterCount={true}
        className="mb-6"
      />

      {/* Resultados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              Usuários
              {hasActiveFilters && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({filteredUsers.length} de {users.length} usuários)
                </span>
              )}
            </span>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
              >
                Limpar Filtros
              </Button>
            )}
          </CardTitle>
          <CardDescription>
            {hasActiveFilters
              ? `Mostrando ${filteredUsers.length} usuários filtrados`
              : `Lista completa de ${users.length} usuários do sistema`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserTable
            users={filteredUsers}
            onEdit={canManageUsers ? handleEditUser : undefined}
            onDelete={canManageUsers ? handleDeleteUser : undefined}
            loading={usersLoading}
          />
        </CardContent>
      </Card>

      {/* Form Modal */}
      {showForm && (
        <UserForm
          user={editingUser}
          onSubmit={editingUser ? handleUpdateUser : handleCreateUser}
          onCancel={() => {
            setShowForm(false);
            setEditingUser(null);
          }}
          loading={createUserMutation.isPending || updateUserMutation.isPending}
        />
      )}
    </div>
  );
}
