import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, requireOwner } from '@/lib/auth'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth()
  if (error) return error

  const { id } = await params
  const transaction = await prisma.transaction.findUnique({
    where: { id: Number(id) },
    include: { items: true, cashier: { select: { name: true } } },
  })
  if (!transaction) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(transaction)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireOwner()
  if (error) return error

  const { id } = await params
  const { customerName, paymentMethod, bankName } = await req.json()

  const transaction = await prisma.transaction.update({
    where: { id: Number(id) },
    data: { customerName: customerName || 'Guest', paymentMethod, bankName: bankName || null },
    include: { items: true, cashier: { select: { name: true } } },
  })
  return NextResponse.json(transaction)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireOwner()
  if (error) return error

  const { id } = await params

  await prisma.$transaction(async (tx) => {
    const items = await tx.transactionItem.findMany({ where: { transactionId: Number(id) } })
    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      })
    }
    await tx.transaction.delete({ where: { id: Number(id) } })
  })

  return NextResponse.json({ ok: true })
}
