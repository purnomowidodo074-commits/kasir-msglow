import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, requireOwner } from '@/lib/auth'

export async function GET() {
  const { error } = await requireAuth()
  if (error) return error

  const settings = await prisma.setting.findMany()
  const map: Record<string, string> = {}
  settings.forEach((s) => (map[s.key] = s.value))
  return NextResponse.json(map)
}

export async function PUT(req: NextRequest) {
  const { error } = await requireOwner()
  if (error) return error

  const body: Record<string, string> = await req.json()

  await prisma.$transaction(
    Object.entries(body).map(([key, value]) =>
      prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } })
    )
  )

  return NextResponse.json({ ok: true })
}
