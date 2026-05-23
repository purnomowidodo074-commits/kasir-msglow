import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireOwner } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireOwner()
  if (error) return error

  const { id } = await params
  const { name, category, price, stock, imageUrl } = await req.json()

  const product = await prisma.product.update({
    where: { id: Number(id) },
    data: { name, category, price: Number(price), stock: Number(stock), imageUrl },
  })
  return NextResponse.json(product)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireOwner()
  if (error) return error

  const { id } = await params
  await prisma.product.delete({ where: { id: Number(id) } })
  return NextResponse.json({ ok: true })
}
