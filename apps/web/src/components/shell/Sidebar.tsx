"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, CollapseIcon } from "@lifecalling/ui";
import { cn } from "@/lib/utils";
import {
  Home, Calculator, Banknote, FileText, BarChart3, Users, Settings, LogOut
} from "lucide-react";
import { useAuth } from "@/lib/auth";

type Role = "admin"|"supervisor"|"financeiro"|"calculista"|"atendente";

type Item = {
  label: string;
  href: string;
  icon: React.ComponentType<any>;
  roles: Role[];
};

const NAV: Item[] = [
  { label: "Supervisão",   href: "/dashboard",  icon: BarChart3,  roles: ["admin","supervisor"] },
  { label: "Atendimento",  href: "/esteira",    icon: Home,       roles: ["admin","supervisor","atendente"] },
  { label: "Calculista",   href: "/calculista", icon: Calculator, roles: ["admin","supervisor","calculista"] },
  { label: "Fechamento",   href: "/fechamento", icon: FileText,   roles: ["admin","supervisor","atendente"] },
  { label: "Financeiro",   href: "/financeiro", icon: Banknote,   roles: ["admin","supervisor","financeiro"] },
  { label: "Contratos",    href: "/contratos",  icon: FileText,   roles: ["admin","supervisor","financeiro"] },
  { label: "Usuários",     href: "/usuarios",   icon: Users,      roles: ["admin","supervisor"] },
  { label: "Configurações",href: "/config",     icon: Settings,   roles: ["admin"] },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const role = user?.role ?? "atendente";
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const pathname = usePathname();

  useEffect(()=>{
    const saved = localStorage.getItem("lc_sidebar");
    if (saved) setCollapsed(saved === "1");
  },[]);
  useEffect(()=>{
    localStorage.setItem("lc_sidebar", collapsed ? "1":"0");
  },[collapsed]);

  return (
    <aside className={cn(
      "h-screen bg-card/70 border-r border-border/50 backdrop-blur-sm sticky top-0 transition-all duration-300 ease-in-out",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="flex items-center justify-between p-3">
        <div className={cn(
          "text-sm font-semibold transition-opacity duration-200",
          collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
        )}>
          Call Center
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 shrink-0"
          onClick={()=>setCollapsed(v=>!v)}
        >
          <span className="sr-only">Toggle Sidebar</span>
          <CollapseIcon collapsed={collapsed} size={14} />
        </Button>
      </div>

      <nav className="px-2 py-2 space-y-1">
        {NAV.filter(i => i.roles.includes(role as Role)).map(({label, href, icon:Icon})=>{
          const active = pathname.startsWith(href);
          return (
            <Link key={href} href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-muted transition-all duration-200",
                active && "bg-muted"
              )}>
              <Icon className="h-4 w-4 shrink-0" />
              <span className={cn(
                "transition-all duration-200",
                collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
              )}>
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-2">
        <Button variant="destructive" className="w-full transition-all duration-200" onClick={() => logout()}>
          <LogOut className="h-4 w-4 shrink-0" />
          <span className={cn(
            "ml-2 transition-all duration-200",
            collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
          )}>
            Sair
          </span>
        </Button>
        <div className={cn(
          "mt-2 text-xs opacity-70 px-1 transition-all duration-200",
          collapsed ? "opacity-0 h-0 overflow-hidden" : "opacity-70"
        )}>
          {user && (
            <>
              Logado como <b>{user.name}</b> — <i>{user.role}</i>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
