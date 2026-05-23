import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireOwner } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function GET() {
  const { error } = await requireOwner()
  if (error) return error

  const users = await prisma.user.findMany({
    select: { id: true, username: true, name: true, role: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(users)
}

export async function POST(req: NextRequest) {
  const { error } = await requireOwner()
  if (error) return error

  const { username, name, password, role } = await req.json()

  if (!username || !name || !password) {
    return NextResponse.json({ error: 'Username, nama, dan password wajib diisi' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { username } })
  if (existing) {
    return NextResponse.json({ error: 'Username sudah digunakan' }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: { username, name, passwordHash, role: role ?? 'cashier' },
    select: { id: true, username: true, name: true, role: true, createdAt: true },
  })
  return NextResponse.json(user, { status: 201 })
}
