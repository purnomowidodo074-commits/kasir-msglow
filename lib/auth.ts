import { getSession } from './session'
import { NextResponse } from 'next/server'

export async function requireAuth() {
  const session = await getSession()
  if (!session) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), session: null }
  }
  return { error: null, session }
}

export async function requireOwner() {
  const { error, session } = await requireAuth()
  if (error) return { error, session: null }
  if (session!.user.role !== 'owner') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }), session: null }
  }
  return { error: null, session }
}
