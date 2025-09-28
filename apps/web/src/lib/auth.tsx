"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "./api";

/* ======================
 * Tipos
 * ===================== */
export type Role = "admin" | "supervisor" | "financeiro" | "calculista" | "atendente";

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
    await api.post("/auth/login", { email, password }); // cookies HttpOnly são setados pela API
    await refresh();
    // redireciona para a rota desejada após login
    const redirectTo = next || "/esteira";
    window.location.href = redirectTo; // força um redirecionamento completo para evitar loops
  };

  const logout = async (redirectToLogin = true) => {
    try {
      await api.post("/auth/logout", {}); // invalida refresh no servidor
    } finally {
      setUser(null);
      if (redirectToLogin) router.replace("/login");
    }
  };

  const value = useMemo<AuthCtx>(
    () => ({ user, loading, login, logout, refresh }),
    [user, loading]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
