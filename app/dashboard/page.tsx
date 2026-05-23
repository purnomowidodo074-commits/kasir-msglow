import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import SalesChart from '@/components/SalesChart'

function formatRupiah(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID')
}

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [todayTx, allProducts, recentTx] = await Promise.all([
    prisma.transaction.findMany({ where: { date: { gte: today } } }),
    prisma.product.findMany(),
    prisma.transaction.findMany({
      take: 10,
      orderBy: { date: 'desc' },
      include: { cashier: { select: { name: true } } },
    }),
  ])

  const todaySales = todayTx.reduce((sum, t) => sum + t.total, 0)
  const todayCount = todayTx.length
  const lowStock = allProducts.filter((p) => p.stock < 3)

  const chartData = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    d.setHours(0, 0, 0, 0)
    const next = new Date(d)
    next.setDate(next.getDate() + 1)
    const dayTx = await prisma.transaction.findMany({ where: { date: { gte: d, lt: next } } })
    chartData.push({
      label: d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' }),
      total: dayTx.reduce((sum, t) => sum + t.total, 0),
    })
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar userName={session.user.name} role={session.user.role} />
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Penjualan Hari Ini</p>
            <p className="text-2xl font-bold text-rose-600 mt-1">{formatRupiah(todaySales)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Transaksi Hari Ini</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{todayCount}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Produk Stok Rendah</p>
            <p className="text-2xl font-bold text-amber-500 mt-1">{lowStock.length}</p>
          </div>
        </div>

        {lowStock.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="font-semibold text-amber-700 mb-1">⚠️ Stok Rendah</p>
            <p className="text-sm text-amber-600">{lowStock.map((p) => p.name).join(', ')}</p>
          </div>
        )}

        {session.user.role === 'owner' && (
          <>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6">
              <h2 className="font-semibold text-gray-700 mb-4">Penjualan 7 Hari Terakhir</h2>
              <SalesChart data={chartData} />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-700">Transaksi Terbaru</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3 text-left">Tanggal</th>
                      <th className="px-4 py-3 text-left">Kasir</th>
                      <th className="px-4 py-3 text-left">Metode</th>
                      <th className="px-4 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTx.map((t) => (
                      <tr key={t.id} className="border-t border-gray-50 hover:bg-gray-50">
                        <td className="px-4 py-3">
                          {new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-4 py-3">{t.cashier.name}</td>
                        <td className="px-4 py-3 capitalize">{t.paymentMethod}</td>
                        <td className="px-4 py-3 text-right font-medium">{formatRupiah(t.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
