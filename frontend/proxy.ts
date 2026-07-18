import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ROLE_ROUTES: Record<string, string> = {
  Admin:    '/admin/dashboard',
  MENRO:    '/menro/map',
  MENRO_Staff: '/menro/map',
  Barangay: '/barangay/map',
}

const PROTECTED_PREFIXES = ['/admin', '/menro', '/barangay']
const CHANGE_PASSWORD_PATH = '/change-password'

function parseUserCookie(raw: string) {
  const decoded = decodeURIComponent(raw)
    .replace(/\\054/g, ',')
    .replace(/\\"/g, '"')
    .replace(/^"|"$/g, '')
  return JSON.parse(decoded)
}

export function proxy(request: NextRequest) {
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
  const isChangePasswordPage = pathname === CHANGE_PASSWORD_PATH

  if (!token && (isProtected || isChangePasswordPage)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  let user: any = null
  if (userRaw) {
    try {
      user = parseUserCookie(userRaw)
    } catch {
      user = null
    }
  }

  // force mandatory password change before anything else
  if (token && user?.must_change_password && !isChangePasswordPage) {
    return NextResponse.redirect(new URL(CHANGE_PASSWORD_PATH, request.url))
  }

  // block access to change-password page once it's no longer required
  if (token && user && !user.must_change_password && isChangePasswordPage) {
    const dashboard = ROLE_ROUTES[user.user_role]
    if (dashboard) {
      return NextResponse.redirect(new URL(dashboard, request.url))
    }
  }

  if (token && isLoginPage && user) {
    if (user.must_change_password) {
      return NextResponse.redirect(new URL(CHANGE_PASSWORD_PATH, request.url))
    }
    const dashboard = ROLE_ROUTES[user.user_role]
    if (dashboard) {
      return NextResponse.redirect(new URL(dashboard, request.url))
    }
  }

  if (token && isProtected && user) {
    const allowedPrefix = ROLE_ROUTES[user.user_role]?.split('/').slice(0, 2).join('/')
    const actualPrefix = '/' + pathname.split('/')[1]

    if (allowedPrefix && actualPrefix !== allowedPrefix) {
      const dashboard = ROLE_ROUTES[user.user_role]
      return NextResponse.redirect(new URL(dashboard, request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}