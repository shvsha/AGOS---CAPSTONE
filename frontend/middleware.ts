import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ROLE_ROUTES: Record<string, string> = {
  Admin:    '/admin/dashboard',
  MENRO:    '/menro/map',
  Barangay: '/barangay/map',
}

const PROTECTED_PREFIXES = ['/admin', '/menro', '/barangay']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const token    = request.cookies.get('access_token')?.value
  const userRaw  = request.cookies.get('user')?.value

  const isLoginPage = pathname === '/login' || pathname === '/'
  const isProtected = PROTECTED_PREFIXES.some(p => pathname.startsWith(p))

  if (!token && isProtected) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (token && isLoginPage && userRaw) {
    try {
      const user = JSON.parse(decodeURIComponent(userRaw))
      const dashboard = ROLE_ROUTES[user.user_role]
      if (dashboard) {
        return NextResponse.redirect(new URL(dashboard, request.url))
      }
    } catch {
      return NextResponse.next()
    }
  }

  if (token && isProtected && userRaw) {
    try {
      const user = JSON.parse(decodeURIComponent(userRaw))
      const allowedPrefix = ROLE_ROUTES[user.user_role]?.split('/').slice(0, 2).join('/')
      
      const actualPrefix = '/' + pathname.split('/')[1]

      if (allowedPrefix && actualPrefix !== allowedPrefix) {
        const dashboard = ROLE_ROUTES[user.user_role]
        return NextResponse.redirect(new URL(dashboard, request.url))
      }
    } catch {
      return NextResponse.next()
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}