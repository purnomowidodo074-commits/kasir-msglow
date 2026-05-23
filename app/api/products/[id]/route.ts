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

  try {
    await prisma.product.delete({ where: { id: Number(id) } })
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    // P2003 = foreign key constraint — produk punya riwayat transaksi
    if (typeof e === 'object' && e !== null && 'code' in e && (e as { code: string }).code === 'P2003') {
      return NextResponse.json(
        { error: 'Produk tidak dapat dihapus karena memiliki riwayat transaksi.' },
        { status: 409 }
      )
    }
    throw e
  }
}
