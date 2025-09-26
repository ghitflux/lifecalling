"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { API } from "@/lib/api";

export type Role = "admin"|"supervisor"|"financeiro"|"calculista"|"atendente";
type User = { id:number; name:string; email:string; role:Role };

type AuthCtx = {
  user: User|null;
  loading: boolean;
  login: (email:string, password:string)=>Promise<void>;
  logout: ()=>Promise<void>;
  refresh: ()=>Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }:{ children: React.ReactNode }) {
  const [user, setUser] = useState<User|null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const me = await API.get<User>("/auth/me");
      setUser(me.data);
    } catch { setUser(null); }
    finally { setLoading(false); }
  };

  useEffect(()=>{ refresh(); }, []);

  const login = async (email:string, password:string) => {
    setLoading(true);
    await API.post<User>("/auth/login", { email, password });
    await refresh();
  };

  const logout = async () => {
    await API.post("/auth/logout", {});
    setUser(null);
  };

  const value = useMemo(()=>({ user, loading, login, logout, refresh }), [user, loading]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(Ctx);
  if(!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};