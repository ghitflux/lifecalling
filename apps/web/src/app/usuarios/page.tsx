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
  Input,
} from "@lifecalling/ui";

import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";



/**
 * IMPORTANTE:
 * - Evitamos conflito de tipos com o `User` do pacote UI.
 * - Definimos um tipo local `AppUser` e fazemos mapeamentos para o tipo
 *   esperado pelos componentes do UI (via `toUiUser` / `fromUiUser`).
 */

interface AppUser {
  id: number;
  name: string;
  email: string;
  role: string;
  active: boolean;
  status?: string; // compat (usamos default quando faltar)
  created_at: string;
  last_login?: string | null;
  department?: string;
  phone?: string;
}

interface UserStats {
  total_users: number;
  active_users: number;
  inactive_users: number;
  admin_users: number;
}

// Normalização vinda da API para o App
const mapApiUser = (u: any): AppUser => ({
  id: u.id,
  name: u.name ?? u.nome ?? "",
  email: u.email ?? "",
  role: u.role ?? u.permissao ?? "user",
  active: u.active ?? u.is_active ?? (u.status ? String(u.status).toLowerCase() === "active" : true),
  status: u.status ?? (u.active ?? u.is_active ? "active" : "inactive"),
  created_at: u.created_at ?? u.createdAt ?? new Date().toISOString(),
  last_login: u.last_login ?? u.lastLogin ?? null,
  department: u.department ?? u.dept ?? undefined,
  phone: u.phone ?? u.telefone ?? undefined,
});

// Mapeia AppUser -> shape aceito pelos componentes do UI
const toUiUser = (u: AppUser) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  // UI normalmente espera `status` como string obrigatória
  status: u.status ?? (u.active ? "active" : "inactive"),
  created_at: u.created_at,
  last_login: u.last_login ?? null,
  department: u.department ?? "",
  phone: u.phone ?? "",
  // alguns componentes também exibem flags booleanas
  active: u.active,
});

// (Opcional) mapeia dados vindos do form do UI -> AppUser parcial para API
const fromUiUser = (u: any): Partial<AppUser> => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  status: u.status,
  // mantém coerência entre status e active
  active: typeof u.active === "boolean" ? u.active : String(u.status).toLowerCase() === "active",
  department: u.department || undefined,
  phone: u.phone || undefined,
});

export default function UsuariosPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);

  // Estado para busca simples
  const [searchTerm, setSearchTerm] = useState("");

  // Queries
  const { data: users = [], isLoading: usersLoading } = useQuery<AppUser[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await api.get("/users");
      const raw = response.data?.items ?? response.data?.results ?? response.data ?? [];
      return Array.isArray(raw) ? raw.map(mapApiUser) : [];
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
    mutationFn: async (userData: Partial<AppUser>) => {
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
      toast.error(error?.response?.data?.detail || "Erro ao criar usuário");
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, ...userData }: Partial<AppUser> & { id: number }) => {
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
      toast.error(error?.response?.data?.detail || "Erro ao atualizar usuário");
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
      toast.error(error?.response?.data?.detail || "Erro ao remover usuário");
    },
  });

  // Busca simples por nome ou email
  const filteredUsers: AppUser[] = useMemo(() => {
    if (!searchTerm) return users;
    
    return users.filter(user => {
      const searchable = `${user.name} ${user.email}`.toLowerCase();
      return searchable.includes(searchTerm.toLowerCase());
    });
  }, [users, searchTerm]);

  // Cálculo local das estatísticas como fallback
  const localStats = useMemo(() => {
    const total_users = users.length;
    const active_users = users.filter(user => user.active).length;
    const inactive_users = users.filter(user => !user.active).length;
    const admin_users = users.filter(user => 
      user.role === "admin" || user.role === "administrator" || user.role === "administrador"
    ).length;

    return {
      total_users,
      active_users,
      inactive_users,
      admin_users,
    };
  }, [users]);

  // Usa stats da API se disponível, senão usa cálculo local
  const displayStats = stats || localStats;

  // Handlers
  const handleCreateUser = (userData: Partial<AppUser>) => {
    createUserMutation.mutate(userData);
  };

  const handleUpdateUser = (userData: Partial<AppUser>) => {
    if (editingUser) {
      updateUserMutation.mutate({ ...userData, id: editingUser.id });
    }
  };

  const handleDeleteUser = (id: number) => {
    if (confirm("Tem certeza que deseja remover este usuário?")) {
      deleteUserMutation.mutate(id);
    }
  };

  const handleEditUser = (user: AppUser) => {
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
          <p className="text-muted-foreground">Gerencie usuários, permissões e acessos do sistema</p>
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
      {displayStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <UserCard title="Total de Usuários" value={displayStats.total_users} icon={<Users className="h-4 w-4" />} trend={{ value: 12, isPositive: true }} />
          <UserCard title="Usuários Ativos" value={displayStats.active_users} icon={<UserCheck className="h-4 w-4" />} trend={{ value: 8, isPositive: true }} />
          <UserCard title="Usuários Inativos" value={displayStats.inactive_users} icon={<UserX className="h-4 w-4" />} trend={{ value: 3, isPositive: false }} />
          <UserCard title="Administradores" value={displayStats.admin_users} icon={<Shield className="h-4 w-4" />} trend={{ value: 1, isPositive: true }} />
        </div>
      )}

      {/* Campo de Busca */}
      <div className="mb-6">
        <Input
          placeholder="Buscar por nome ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Resultados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              Usuários
              {searchTerm && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({filteredUsers.length} de {users.length} usuários)
                </span>
              )}
            </span>
          </CardTitle>
          <CardDescription>
            {searchTerm
              ? `Mostrando ${filteredUsers.length} usuários encontrados`
              : `Lista completa de ${users.length} usuários do sistema`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Passamos o shape esperado pelo UI para evitar conflitos de tipo */}
          <UserTable
            users={filteredUsers.map(toUiUser) as any}
            onEdit={canManageUsers ? ((u: any) => handleEditUser(mapApiUser(u))) : undefined}
            onDelete={canManageUsers ? handleDeleteUser : undefined}
            loading={usersLoading}
          />
        </CardContent>
      </Card>

      {/* Form Modal */}
      {showForm && (
        <UserForm
          user={editingUser ? (toUiUser(editingUser) as any) : undefined}
          onSubmit={(formData: any) => {
            const payload = fromUiUser(formData);
            editingUser ? handleUpdateUser(payload) : handleCreateUser(payload);
          }}
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
