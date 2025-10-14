import { NextRequest, NextResponse } from "next/server";

// mapas de acesso por prefixo
const RBAC: Record<string, Array<"admin"|"supervisor"|"financeiro"|"calculista"|"atendente"|"fechamento">> = {
  "/esteira":      ["admin","supervisor","atendente"],
  "/calculista":   ["admin","supervisor","calculista"],
  "/fechamento":   ["admin","supervisor","fechamento"],
  "/financeiro":   ["admin","supervisor","financeiro"],
  "/contratos":    ["admin","supervisor","financeiro"],
  "/casos":        ["admin","supervisor","atendente","calculista","financeiro","fechamento"],
  "/dashboard":    ["admin","supervisor","financeiro","calculista"],
  "/usuarios":     ["admin","supervisor"],
  "/config":       ["admin"],
  "/rankings":     ["admin","supervisor","financeiro","calculista","atendente","fechamento"],
  "/faq":          ["admin","supervisor","financeiro","calculista","atendente","fechamento"],
};

// rota padrão por role para evitar loops de redirecionamento
const DEFAULT_ROUTE: Record<string, string> = {
  admin: "/dashboard",
  supervisor: "/dashboard",
  atendente: "/esteira",
  calculista: "/calculista",
  financeiro: "/financeiro",
  fechamento: "/fechamento",
};

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const pathname = url.pathname;

  // Adiciona logs para debug (removível em produção)
  console.log(`[Middleware] ${req.method} ${pathname}`);

  // sempre libera /login, /_next, assets, /api
  if (pathname.startsWith("/login") || pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname.startsWith("/assets") || pathname === "/") {
    return NextResponse.next();
  }

  // Verifica presença de tokens de autenticação
  const accessToken = req.cookies.get("access")?.value;
  const refreshToken = req.cookies.get("refresh")?.value;
  const roleToken = req.cookies.get("role")?.value;
  const hasValidToken = accessToken || refreshToken;

  // Logs detalhados para debug
  console.log(`[Middleware] Cookies received:`, {
    access: accessToken ? `${accessToken.substring(0, 10)}...` : 'none',
    refresh: refreshToken ? `${refreshToken.substring(0, 10)}...` : 'none',
    role: roleToken || 'none',
    hasValid: hasValidToken,
    allCookies: Object.fromEntries(req.cookies.getAll().map(c => [c.name, c.value.substring(0, 10) + '...']))
  });

  if (!hasValidToken) {
    console.log(`[Middleware] No valid tokens found, redirecting to login. Path: ${pathname}`);
    const to = new URL("/login", req.url);
    to.searchParams.set("next", pathname);
    return NextResponse.redirect(to);
  } else {
    console.log(`[Middleware] Valid tokens found, allowing access to: ${pathname}`);
  }

  // RBAC simples via cookie 'role' se você setar no login; caso não tenha, apenas permite
  const roleCookie = req.cookies.get("role")?.value;
  if (roleCookie) {
    const entry = Object.entries(RBAC).find(([prefix]) => pathname.startsWith(prefix));
    if (entry) {
      const allowed = entry[1];
      if (!allowed.includes(roleCookie as any)) {
        const target = DEFAULT_ROUTE[roleCookie] || "/esteira";
        // evita loop: se já estamos no target, apenas libera
        if (pathname !== target) {
          console.log(`[Middleware] Role ${roleCookie} not allowed for ${pathname}, redirecting to ${target}`);
          return NextResponse.redirect(new URL(target, req.url));
        }
        console.log(`[Middleware] Role ${roleCookie} already at default route ${target}, allowing access`);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
};