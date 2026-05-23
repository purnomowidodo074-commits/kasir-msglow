import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const all = searchParams.get('all') === 'true'
  const days = Number(searchParams.get('days') ?? 7)

  const where = all ? {} : (() => {
    const since = new Date()
    since.setDate(since.getDate() - days)
    return { date: { gte: since } }
  })()

  const transactions = await prisma.transaction.findMany({
    where,
    include: { items: true, cashier: { select: { name: true } } },
    orderBy: { date: 'desc' },
  })
  return NextResponse.json(transactions)
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth()
  if (error) return error

  const body = await req.json()
  const { customerName, paymentMethod, bankName, subtotal, discount, tax, total, amountPaid, change, items } = body

  const transaction = await prisma.$transaction(async (tx) => {
    const t = await tx.transaction.create({
      data: {
        cashierId: session!.user.id,
        customerName: customerName || 'Guest',
        paymentMethod,
        bankName,
        subtotal: Number(subtotal),
        discount: Number(discount ?? 0),
        tax: Number(tax ?? 0),
        total: Number(total),
        amountPaid: Number(amountPaid),
        change: Number(change ?? 0),
        items: {
          create: items.map((item: { productId: number; productName: string; price: number; quantity: number }) => ({
            productId: item.productId,
            productName: item.productName,
            price: Number(item.price),
            quantity: Number(item.quantity),
          })),
        },
      },
      include: { items: true },
    })

    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      })
    }

    return t
  })

  return NextResponse.json(transaction, { status: 201 })
}
