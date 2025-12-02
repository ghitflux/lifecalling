"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "./api";

/* ======================
 * Tipos
 * ===================== */
export type Role = "super_admin" | "admin" | "supervisor" | "financeiro" | "calculista" | "atendente" | "fechamento";

export type User = {
  id: number;
  name: string;
  email: string;
  role: Role;
};

type AuthCtx = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, next?: string) => Promise<void>;
  logout: (redirectToLogin?: boolean) => Promise<void>;
  refresh: () => Promise<void>;
  getAccessToken: () => string | null;
};

/* ======================
 * Bootstrap simples (opcional)
 * ===================== */
export function useBootstrapSession() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<User | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<User>("/auth/me");
        if (!cancelled) setMe(res.data);
      } catch (err: any) {
        // Se continuar 401 mesmo após o refresh do interceptor, apenas zera o usuário aqui.
        if (!cancelled) setMe(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return { loading, me };
}

/* ======================
 * Contexto de Autenticação
 * ===================== */
const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    const res = await api.get<User>("/auth/me");
    return res.data;
  };

  const refresh = async () => {
    try {
      const me = await fetchMe(); // o interceptor do axios faz o refresh se precisar
      setUser(me);
    } catch (err: any) {
      // Se ainda falhar (ex.: 401), mantém user como null
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    // Só tenta buscar o usuário se não estivermos na página de login
    const isLoginPage = typeof window !== 'undefined' && window.location.pathname === '/login';

    if (isLoginPage) {
      if (!cancelled) {
        setUser(null);
        setLoading(false);
      }
      return;
    }

    (async () => {
      try {
        const me = await fetchMe();
        if (!cancelled) setUser(me);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email: string, password: string, next?: string) => {
    setLoading(true);
    try {
      await api.post("/auth/login", { email, password }); // cookies HttpOnly são setados pela API

      // Buscar CSRF token após login bem-sucedido
      try {
        await api.get("/auth/csrf");
      } catch (error) {
        console.warn("Failed to fetch CSRF token after login:", error);
      }

      // Busca o usuário atual após login
      const currentUser = await fetchMe();
      setUser(currentUser);

      // redireciona por role, com prioridade para "next" se fornecido
      let redirectTo = next;
      if (!redirectTo) {
        const role = currentUser.role;
        switch (role) {
          case "atendente":
            redirectTo = "/esteira";
            break;
          case "calculista":
            redirectTo = "/calculista";
            break;
          case "fechamento":
            redirectTo = "/fechamento";
            break;
          case "financeiro":
            redirectTo = "/financeiro";
            break;
          case "supervisor":
            redirectTo = "/dashboard";
            break;
          case "admin":
          case "super_admin":
          default:
            redirectTo = "/dashboard";
        }
      }
      router.push(redirectTo!);
    } catch (error) {
      setLoading(false);
      throw error; // propaga o erro para o componente de login
    } finally {
      setLoading(false);
    }
  };

  const logout = async (redirectToLogin = true) => {
    try {
      await api.post("/auth/logout", {}); // invalida refresh no servidor
    } finally {
      setUser(null);
      if (redirectToLogin) router.replace("/login");
    }
  };

  const getAccessToken = () => {
    // Tenta obter o token do cookie de acesso (se existir)
    if (typeof window !== 'undefined') {
      const cookies = document.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);
      return cookies.access || null;
    }
    return null;
  };

  const value = useMemo<AuthCtx>(
    () => ({ user, loading, login, logout, refresh, getAccessToken }),
    [user, loading]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
