"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, CollapseIcon } from "@lifecalling/ui";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  Home, Calculator, Banknote, FileText, BarChart3, Users, LogOut, Upload, User as UserIcon, Trophy, HelpCircle, Shield, Smartphone, ChevronDown, ChevronRight
} from "lucide-react";
import { useAuth } from "@/lib/auth";

type Role = "super_admin" | "admin" | "supervisor" | "financeiro" | "calculista" | "atendente" | "fechamento";

type Item = {
  label: string;
  href: string;
  icon: React.ComponentType<any>;
  roles: Role[];
  subItems?: { label: string; href: string }[];
};

const NAV: Item[] = [
  { label: "Atendimento", href: "/esteira", icon: Home, roles: ["super_admin", "admin", "supervisor", "atendente"] },
  { label: "Dashboard", href: "/dashboard", icon: BarChart3, roles: ["super_admin", "admin", "supervisor"] },
  { label: "Rankings", href: "/rankings", icon: Trophy, roles: ["super_admin", "admin", "supervisor", "financeiro", "calculista", "atendente", "fechamento"] },
  { label: "Calculista", href: "/calculista", icon: Calculator, roles: ["super_admin", "admin", "supervisor", "calculista"] },
  { label: "Fechamento", href: "/fechamento", icon: FileText, roles: ["super_admin", "admin", "supervisor", "fechamento"] },
  { label: "Financeiro", href: "/financeiro", icon: Banknote, roles: ["super_admin", "admin", "supervisor", "financeiro"] },
  { label: "Clientes", href: "/clientes", icon: UserIcon, roles: ["super_admin", "admin", "supervisor", "financeiro", "calculista", "atendente", "fechamento"] },
  { label: "Auditoria", href: "/admin/auditoria/sla", icon: Shield, roles: ["super_admin", "admin", "supervisor"] },
  { label: "Importação", href: "/importacao", icon: Upload, roles: ["super_admin", "admin"] },
  { label: "Usuários", href: "/usuarios", icon: Users, roles: ["super_admin", "admin"] },
  {
    label: "Life Mobile",
    href: "/life-mobile",
    icon: Smartphone,
    roles: ["super_admin"],
    subItems: [
      { label: "Dashboard", href: "/life-mobile" },
      { label: "Clientes", href: "/life-mobile/clientes" },
      { label: "Simulações", href: "/life-mobile/simulacoes" }
    ]
  },
  { label: "FAQ", href: "/faq", icon: HelpCircle, roles: ["super_admin", "admin", "supervisor", "financeiro", "calculista", "atendente", "fechamento"] },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const role = user?.role ?? "atendente";
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(["Life Mobile"]); // Default expand Life Mobile for visibility
  const pathname = usePathname();

  const toggleMenu = (label: string) => {
    if (collapsed) setCollapsed(false);
    setExpandedMenus(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  };

  useEffect(() => {
    const saved = localStorage.getItem("lc_sidebar");
    if (saved) setCollapsed(saved === "1");
  }, []);
  useEffect(() => {
    localStorage.setItem("lc_sidebar", collapsed ? "1" : "0");
    // Dispatch storage event to notify other components
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'lc_sidebar',
      newValue: collapsed ? "1" : "0"
    }));
  }, [collapsed]);

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
          onClick={() => setCollapsed(v => !v)}
        >
          <span className="sr-only">Toggle Sidebar</span>
          <CollapseIcon collapsed={collapsed} size={14} />
        </Button>
      </div>

      <nav className="px-2 py-2 space-y-1">
        {NAV.filter(i => i.roles.includes(role as Role)).map((item) => {
          const { label, href, icon: Icon, subItems } = item;
          const active = pathname === href || (subItems ? pathname.startsWith(href) : false);
          const isExpanded = expandedMenus.includes(label);
          const hasSubItems = subItems && subItems.length > 0;

          return (
            <div key={href}>
              <div
                onClick={() => hasSubItems ? toggleMenu(label) : null}
                className={cn(
                  "flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-all duration-200 cursor-pointer hover:bg-muted",
                  active && !hasSubItems && "bg-muted",
                  active && hasSubItems && "text-blue-600"
                )}
              >
                <Link href={hasSubItems ? "#" : href} className="flex items-center gap-3 flex-1" onClick={(e) => hasSubItems && e.preventDefault()}>
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className={cn(
                    "transition-all duration-200",
                    collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
                  )}>
                    {label}
                  </span>
                </Link>
                {hasSubItems && !collapsed && (
                  <div className="text-gray-400">
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </div>
                )}
              </div>

              {hasSubItems && isExpanded && !collapsed && (
                <div className="mt-1 ml-4 space-y-1 border-l border-border/50 pl-2">
                  {subItems.map((sub) => {
                    const subActive = pathname === sub.href;
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className={cn(
                          "block rounded-lg px-3 py-2 text-sm transition-all duration-200 hover:bg-muted hover:text-foreground",
                          subActive ? "bg-muted font-medium text-blue-600" : "text-muted-foreground"
                        )}
                      >
                        {sub.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
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
