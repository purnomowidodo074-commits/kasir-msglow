import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireOwner } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireOwner()
  if (error) return error

  const { id } = await params
  const { name, password, role } = await req.json()

  const data: { name?: string; role?: 'owner' | 'cashier'; passwordHash?: string } = {}
  if (name) data.name = name
  if (role) data.role = role
  if (password) data.passwordHash = await bcrypt.hash(password, 12)

  const user = await prisma.user.update({
    where: { id: Number(id) },
    data,
    select: { id: true, username: true, name: true, role: true, createdAt: true },
  })
  return NextResponse.json(user)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireOwner()
  if (error) return error

  const { id } = await params
  if (Number(id) === session!.user.id) {
    return NextResponse.json({ error: 'Tidak bisa menghapus akun sendiri' }, { status: 400 })
  }

  await prisma.user.delete({ where: { id: Number(id) } })
  return NextResponse.json({ ok: true })
}
