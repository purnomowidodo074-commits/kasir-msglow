import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_ROUTES = ['/login', '/api/auth/login']
const OWNER_ROUTES = ['/stock', '/settings', '/users', '/api/settings', '/api/users']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.next()
  }

  const sessionId = request.cookies.get('session_id')?.value
  if (!sessionId) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Role check untuk owner routes dibaca dari cookie tambahan yang di-set saat login
  const userRole = request.cookies.get('user_role')?.value
  if (OWNER_ROUTES.some((r) => pathname.startsWith(r)) && userRole !== 'owner') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
