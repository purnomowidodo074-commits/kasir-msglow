import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, requireOwner } from '@/lib/auth'

export async function GET() {
  const { error } = await requireAuth()
  if (error) return error

  const products = await prisma.product.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json(products)
}

export async function POST(req: NextRequest) {
  const { error } = await requireOwner()
  if (error) return error

  const { name, category, price, stock, imageUrl } = await req.json()

  if (!name || !category || price == null) {
    return NextResponse.json({ error: 'Field name, category, price wajib diisi' }, { status: 400 })
  }

  const product = await prisma.product.create({
    data: { name, category, price: Number(price), stock: Number(stock ?? 0), imageUrl },
  })
  return NextResponse.json(product, { status: 201 })
}
