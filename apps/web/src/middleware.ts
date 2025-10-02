import { NextRequest, NextResponse } from "next/server";

// mapas de acesso por prefixo
const RBAC: Record<string, Array<"admin"|"supervisor"|"financeiro"|"calculista"|"atendente">> = {
  "/esteira":      ["admin","supervisor","atendente"],
  "/calculista":   ["admin","supervisor","calculista"],
  "/fechamento":   ["admin","supervisor","atendente"],
  "/financeiro":   ["admin","supervisor","financeiro"],
  "/contratos":    ["admin","supervisor","financeiro"],
  "/casos":        ["admin","supervisor","atendente","calculista","financeiro"],
  // "/dashboard":    ["admin","supervisor"], // removido
  "/usuarios":     ["admin","supervisor"],
  "/config":       ["admin"],
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
        console.log(`[Middleware] Role ${roleCookie} not allowed for ${pathname}, redirecting to /esteira`);
        return NextResponse.redirect(new URL("/esteira", req.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
};