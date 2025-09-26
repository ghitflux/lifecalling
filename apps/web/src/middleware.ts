import { NextRequest, NextResponse } from "next/server";

// mapas de acesso por prefixo
const RBAC: Record<string, Array<"admin"|"supervisor"|"financeiro"|"calculista"|"atendente">> = {
  "/esteira":      ["admin","supervisor","atendente"],
  "/calculista":   ["admin","supervisor","calculista"],
  "/fechamento":   ["admin","supervisor","atendente"],
  "/financeiro":   ["admin","supervisor","financeiro"],
  "/contratos":    ["admin","supervisor","financeiro"],
  "/dashboard":    ["admin","supervisor"],
  "/usuarios":     ["admin","supervisor"],
  "/config":       ["admin"],
};

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const pathname = url.pathname;

  // sempre libera /login, /_next, assets, _api
  if (pathname.startsWith("/login") || pathname.startsWith("/_next") || pathname.startsWith("/_api") || pathname === "/") {
    return NextResponse.next();
  }

  // exige cookie de sessão (foi setado pela API como 'access')
  const hasAccess = req.cookies.has("access") || req.cookies.has("refresh");
  if (!hasAccess) {
    const to = new URL("/login", req.url);
    to.searchParams.set("next", pathname);
    return NextResponse.redirect(to);
  }

  // RBAC simples via cookie 'role' se você setar no login; caso não tenha, apenas permite
  const roleCookie = req.cookies.get("role")?.value; // opcional
  if (roleCookie) {
    const entry = Object.entries(RBAC).find(([prefix]) => pathname.startsWith(prefix));
    if (entry) {
      const allowed = entry[1];
      if (!allowed.includes(roleCookie as any)) {
        return NextResponse.redirect(new URL("/esteira", req.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
};