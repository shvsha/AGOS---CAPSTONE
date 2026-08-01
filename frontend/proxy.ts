import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ROLE_ROUTES: Record<string, string> = {
  Admin:    '/admin/dashboard',
  MENRO:    '/menro/map',
  MENRO_Staff: '/menro/map',
}

const PROTECTED_PREFIXES = ['/admin', '/menro']
const PRIVACY_CONSENT_PATH = '/privacy-consent'
const CHANGE_PASSWORD_PATH = '/change-password'

function parseUserCookie(raw: string) {
  const decoded = decodeURIComponent(raw)
    .replace(/\\054/g, ',')
    .replace(/\\"/g, '"')
    .replace(/^"|"$/g, '')
  return JSON.parse(decoded)
}

// where a user should land next, given the gates that still apply to them
function nextStepFor(user: any): string | null {
  if (!user.privacy_agreed_at) return PRIVACY_CONSENT_PATH
  if (user.must_change_password) return CHANGE_PASSWORD_PATH
  return ROLE_ROUTES[user.user_role] ?? null
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
  const isPrivacyConsentPage = pathname === PRIVACY_CONSENT_PATH

  if (!token && (isProtected || isChangePasswordPage || isPrivacyConsentPage)) {
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

  // gate 1: privacy consent, before anything else
  if (token && user && !user.privacy_agreed_at && !isPrivacyConsentPage) {
    return NextResponse.redirect(new URL(PRIVACY_CONSENT_PATH, request.url))
  }

  // block access to consent page once it's already been given
  if (token && user && user.privacy_agreed_at && isPrivacyConsentPage) {
    const next = nextStepFor(user)
    if (next) return NextResponse.redirect(new URL(next, request.url))
  }

  // gate 2: mandatory password change
  if (token && user?.privacy_agreed_at && user?.must_change_password && !isChangePasswordPage) {
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
    const next = nextStepFor(user)
    if (next) return NextResponse.redirect(new URL(next, request.url))
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
