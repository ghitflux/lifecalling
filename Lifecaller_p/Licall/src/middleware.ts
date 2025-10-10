import { auth } from '@/lib/auth'
import { canAccessRoute } from '@/lib/rbac'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl

  // Páginas públicas
  const publicRoutes = ['/signin']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // API routes do NextAuth são sempre permitidas
  if (pathname.startsWith('/api/auth/')) {
    return NextResponse.next()
  }

  // Usuário não autenticado
  if (!req.auth?.user) {
    const signInUrl = new URL('/signin', req.url)
    return NextResponse.redirect(signInUrl)
  }

  const userRole = req.auth.user.role

  // Verificar permissões de rota
  if (!canAccessRoute(pathname, userRole)) {
    const homeUrl = new URL('/', req.url)
    return NextResponse.redirect(homeUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}