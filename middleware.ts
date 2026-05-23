import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

const PUBLIC_ROUTES = ['/login', '/api/auth/login']
const OWNER_ROUTES = ['/stock', '/settings', '/users', '/api/settings', '/api/users']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.next()
  }

  const sessionId = request.cookies.get('session_id')?.value
  if (!sessionId) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: { select: { role: true } } },
  })

  if (!session || session.expiresAt < new Date()) {
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('session_id')
    return response
  }

  if (OWNER_ROUTES.some((r) => pathname.startsWith(r)) && session.user.role !== 'owner') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
