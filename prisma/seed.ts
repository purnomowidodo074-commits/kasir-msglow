import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hash = (pw: string) => bcrypt.hash(pw, 12)

  await prisma.user.upsert({
    where: { username: 'christy' },
    update: {},
    create: { username: 'christy', name: 'Christy (Owner)', passwordHash: await hash('admin123'), role: 'owner' },
  })
  await prisma.user.upsert({
    where: { username: 'kasir1' },
    update: {},
    create: { username: 'kasir1', name: 'Kasir 1', passwordHash: await hash('kasir123'), role: 'cashier' },
  })
  await prisma.user.upsert({
    where: { username: 'kasir2' },
    update: {},
    create: { username: 'kasir2', name: 'Kasir 2', passwordHash: await hash('kasir123'), role: 'cashier' },
  })

  type Cat = 'skincare' | 'treatment' | 'makeup'
  const products: { name: string; category: Cat; price: number; stock: number }[] = [
    { name: 'Ms Glow Facial Wash', category: 'skincare', price: 85000, stock: 20 },
    { name: 'Ms Glow Toner', category: 'skincare', price: 95000, stock: 15 },
    { name: 'Ms Glow Serum', category: 'skincare', price: 150000, stock: 10 },
    { name: 'Ms Glow Day Cream', category: 'skincare', price: 120000, stock: 18 },
    { name: 'Ms Glow Night Cream', category: 'skincare', price: 120000, stock: 12 },
    { name: 'Ms Glow Sunscreen', category: 'skincare', price: 95000, stock: 25 },
    { name: 'Ms Glow Treatment Acne', category: 'treatment', price: 200000, stock: 8 },
    { name: 'Ms Glow Treatment Whitening', category: 'treatment', price: 250000, stock: 6 },
    { name: 'Ms Glow Treatment Anti Aging', category: 'treatment', price: 300000, stock: 5 },
    { name: 'Ms Glow Lip Cream', category: 'makeup', price: 65000, stock: 30 },
    { name: 'Ms Glow BB Cream', category: 'makeup', price: 85000, stock: 20 },
    { name: 'Ms Glow Eyebrow Pencil', category: 'makeup', price: 45000, stock: 35 },
  ]

  for (const p of products) {
    await prisma.product.create({ data: p }).catch(() => {})
  }

  const settings = [
    { key: 'taxRate', value: '10' },
    { key: 'discountRate', value: '0' },
    { key: 'discountType', value: 'percent' },
    { key: 'storeName', value: 'Ms Glow Skincare' },
    { key: 'storeAddress', value: 'Jl. Kecantikan No. 1' },
    { key: 'storePhone', value: '081234567890' },
  ]

  for (const s of settings) {
    await prisma.setting.upsert({ where: { key: s.key }, update: { value: s.value }, create: s })
  }

  console.log('Seed selesai!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
