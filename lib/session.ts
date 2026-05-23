import { prisma } from './db'
import { cookies } from 'next/headers'

const SESSION_DURATION_MS = 8 * 60 * 60 * 1000 // 8 hours

export async function createSession(userId: number, role: string) {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)
  const session = await prisma.session.create({
    data: { userId, expiresAt },
  })
  const cookieStore = await cookies()
  cookieStore.set('session_id', session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  })
  // Cookie role untuk middleware (tidak httpOnly agar middleware Edge bisa baca)
  cookieStore.set('user_role', role, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  })
  return session
}

export async function getSession() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('session_id')?.value
  if (!sessionId) return null

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: { select: { id: true, name: true, role: true, username: true } } },
  })

  if (!session || session.expiresAt < new Date()) {
    if (session) await prisma.session.delete({ where: { id: sessionId } })
    return null
  }

  return session
}

export async function deleteSession() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('session_id')?.value
  if (sessionId) {
    await prisma.session.delete({ where: { id: sessionId } }).catch(() => {})
    cookieStore.delete('session_id')
    cookieStore.delete('user_role')
  }
}
