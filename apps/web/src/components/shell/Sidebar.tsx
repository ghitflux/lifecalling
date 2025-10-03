"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, CollapseIcon } from "@lifecalling/ui";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  Home, Calculator, Banknote, FileText, BarChart3, Users, LogOut, Upload, User as UserIcon, Trophy
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
  { label: "Dashboard",  href: "/dashboard", icon: BarChart3, roles: ["admin","supervisor","financeiro","calculista"] },
  // Removido: Dashboard/Supervisão
  { label: "Atendimento",  href: "/esteira",    icon: Home,       roles: ["admin","supervisor","atendente","calculista","financeiro"] },
  { label: "Calculista",   href: "/calculista", icon: Calculator, roles: ["admin","supervisor","calculista","financeiro"] },
  { label: "Fechamento",   href: "/fechamento", icon: FileText,   roles: ["admin","supervisor","calculista","financeiro"] },
  { label: "Financeiro",   href: "/financeiro", icon: Banknote,   roles: ["admin","supervisor","financeiro","calculista"] },
  { label: "Rankings",     href: "/rankings",   icon: Trophy,     roles: ["admin","supervisor","financeiro","calculista","atendente"] },
  { label: "Clientes",     href: "/clientes",   icon: UserIcon,   roles: ["admin","supervisor","financeiro","calculista","atendente"] },
  { label: "Importação",   href: "/importacao", icon: Upload,     roles: ["admin","supervisor"] },
  { label: "Usuários",     href: "/usuarios",   icon: Users,      roles: ["admin","supervisor"] },
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
    // Dispatch storage event to notify other components
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'lc_sidebar',
      newValue: collapsed ? "1" : "0"
    }));
  },[collapsed]);

  return (
    <aside className={cn(
      "h-screen bg-card/70 border-r border-border/50 backdrop-blur-sm sticky top-0 transition-all duration-300 ease-in-out",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="flex items-center justify-between p-3">
        <div className={cn(
          "transition-opacity duration-200",
          collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
        )}>
          <Image
            src="/assets/lifeservice.png"
            alt="Life Service"
            width={140}
            height={40}
            className="object-contain"
            priority
          />
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

      <div className="mt-auto p-2 space-y-3">
        {/* User Info */}
        <div className={cn(
          "text-xs opacity-70 px-1 transition-all duration-200 border-t border-border/50 pt-3",
          collapsed ? "opacity-0 h-0 overflow-hidden" : "opacity-70"
        )}>
          {user && (
            <>
              Logado como <b>{user.name}</b> — <i>{user.role}</i>
            </>
          )}
        </div>

        {/* Logout Button */}
        <Button variant="destructive" className="w-full transition-all duration-200" onClick={() => logout()}>
          <LogOut className="h-4 w-4 shrink-0" />
          <span className={cn(
            "ml-2 transition-all duration-200",
            collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
          )}>
            Sair
          </span>
        </Button>
      </div>
    </aside>
  );
}
