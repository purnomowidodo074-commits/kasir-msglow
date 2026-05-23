'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'

interface TransactionItem {
  id: number
  productName: string
  price: number
  quantity: number
}

interface Transaction {
  id: number
  date: string
  customerName: string
  paymentMethod: string
  bankName?: string | null
  subtotal: number
  discount: number
  tax: number
  total: number
  amountPaid: number
  change: number
  cashier: { name: string }
  items: TransactionItem[]
}

function formatRupiah(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID')
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const IconEdit = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)

const IconTrash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
)

const IconChevron = ({ open }: { open: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
)

const IconSearch = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)

const IconWarning = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)

export default function HistoryPage() {
  const [user, setUser] = useState({ name: '', role: 'cashier' })
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [editTx, setEditTx] = useState<Transaction | null>(null)
  const [deleteTx, setDeleteTx] = useState<Transaction | null>(null)
  const [editForm, setEditForm] = useState({ customerName: '', paymentMethod: '', bankName: '' })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me').then((r) => r.ok ? r.json() : null).then((d) => { if (d) setUser(d) })
    fetch('/api/transactions?all=true')
      .then((r) => r.json())
      .then((data) => { setTransactions(data); setLoading(false) })
  }, [])

  const filtered = transactions.filter((t) => {
    const q = search.toLowerCase()
    return (
      t.customerName.toLowerCase().includes(q) ||
      t.cashier.name.toLowerCase().includes(q) ||
      t.paymentMethod.toLowerCase().includes(q) ||
      String(t.id).includes(q)
    )
  })

  function openEdit(tx: Transaction) {
    setEditTx(tx)
    setEditForm({ customerName: tx.customerName, paymentMethod: tx.paymentMethod, bankName: tx.bankName ?? '' })
  }

  async function handleEdit() {
    if (!editTx) return
    setSaving(true)
    const res = await fetch(`/api/transactions/${editTx.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    if (res.ok) {
      const updated = await res.json()
      setTransactions((prev) => prev.map((t) => t.id === editTx.id ? updated : t))
      setEditTx(null)
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!deleteTx) return
    setDeleting(true)
    const res = await fetch(`/api/transactions/${deleteTx.id}`, { method: 'DELETE' })
    if (res.ok) {
      setTransactions((prev) => prev.filter((t) => t.id !== deleteTx.id))
      setDeleteTx(null)
      if (expandedId === deleteTx.id) setExpandedId(null)
    }
    setDeleting(false)
  }

  const totalAll = filtered.reduce((s, t) => s + t.total, 0)

  return (
    <div className="flex min-h-screen">
      <Sidebar userName={user.name} role={user.role} />
      <main className="flex-1 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Riwayat Transaksi</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {filtered.length} transaksi · Total {formatRupiah(totalAll)}
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <IconSearch />
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari pelanggan, kasir, metode..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-400 text-sm">Memuat data...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-sm">Tidak ada transaksi ditemukan</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 w-8"></th>
                    <th className="px-4 py-3 text-left">ID</th>
                    <th className="px-4 py-3 text-left">Tanggal</th>
                    <th className="px-4 py-3 text-left">Pelanggan</th>
                    <th className="px-4 py-3 text-left">Kasir</th>
                    <th className="px-4 py-3 text-left">Metode</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    {user.role === 'owner' && <th className="px-4 py-3 text-center">Aksi</th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((tx) => (
                    <>
                      <tr
                        key={tx.id}
                        onClick={() => setExpandedId(expandedId === tx.id ? null : tx.id)}
                        className={`border-t border-gray-50 cursor-pointer transition-colors ${expandedId === tx.id ? 'bg-rose-50/50' : 'hover:bg-gray-50'}`}
                      >
                        <td className="px-4 py-3 text-gray-400">
                          <IconChevron open={expandedId === tx.id} />
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-400">#{tx.id}</td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(tx.date)}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{tx.customerName}</td>
                        <td className="px-4 py-3 text-gray-500">{tx.cashier.name}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            tx.paymentMethod === 'tunai' ? 'bg-green-100 text-green-700'
                            : tx.paymentMethod === 'transfer' ? 'bg-blue-100 text-blue-700'
                            : 'bg-purple-100 text-purple-700'
                          }`}>
                            {tx.paymentMethod}{tx.bankName ? ` · ${tx.bankName}` : ''}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-800">{formatRupiah(tx.total)}</td>
                        {user.role === 'owner' && (
                          <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => openEdit(tx)}
                                title="Edit transaksi"
                                className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 hover:text-blue-700 transition"
                              >
                                <IconEdit />
                              </button>
                              <button
                                onClick={() => setDeleteTx(tx)}
                                title="Hapus transaksi"
                                className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition"
                              >
                                <IconTrash />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>

                      {expandedId === tx.id && (
                        <tr key={`${tx.id}-detail`}>
                          <td colSpan={user.role === 'owner' ? 8 : 7} className="px-6 py-4 bg-rose-50/30 border-t border-rose-100">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Item Produk</p>
                                <div className="space-y-1.5">
                                  {tx.items.map((item) => (
                                    <div key={item.id} className="flex justify-between text-sm">
                                      <span className="text-gray-700">
                                        {item.productName}
                                        <span className="text-gray-400 ml-1">×{item.quantity}</span>
                                      </span>
                                      <span className="text-gray-800 font-medium">{formatRupiah(item.price * item.quantity)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Ringkasan Pembayaran</p>
                                <div className="space-y-1.5 text-sm">
                                  <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatRupiah(tx.subtotal)}</span></div>
                                  {tx.discount > 0 && <div className="flex justify-between text-green-600"><span>Diskon</span><span>- {formatRupiah(tx.discount)}</span></div>}
                                  {tx.tax > 0 && <div className="flex justify-between text-gray-600"><span>Pajak</span><span>{formatRupiah(tx.tax)}</span></div>}
                                  <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-1.5">
                                    <span>Total</span><span className="text-rose-600">{formatRupiah(tx.total)}</span>
                                  </div>
                                  <div className="flex justify-between text-gray-500"><span>Dibayar</span><span>{formatRupiah(tx.amountPaid)}</span></div>
                                  <div className="flex justify-between text-gray-500"><span>Kembalian</span><span>{formatRupiah(tx.change)}</span></div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Edit Modal */}
      {editTx && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="font-bold text-gray-800 text-lg mb-1">Edit Transaksi</h2>
            <p className="text-xs text-gray-400 mb-4">#{editTx.id} · {formatDate(editTx.date)}</p>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600">Nama Pelanggan</label>
                <input
                  value={editForm.customerName}
                  onChange={(e) => setEditForm((f) => ({ ...f, customerName: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Metode Pembayaran</label>
                <select
                  value={editForm.paymentMethod}
                  onChange={(e) => setEditForm((f) => ({ ...f, paymentMethod: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-rose-400"
                >
                  <option value="tunai">Tunai</option>
                  <option value="transfer">Transfer</option>
                  <option value="qris">QRIS</option>
                </select>
              </div>
              {editForm.paymentMethod === 'transfer' && (
                <div>
                  <label className="text-sm text-gray-600">Nama Bank</label>
                  <input
                    value={editForm.bankName}
                    onChange={(e) => setEditForm((f) => ({ ...f, bankName: e.target.value }))}
                    placeholder="BCA, BNI, dll"
                    className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setEditTx(null)} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm hover:bg-gray-50">
                Batal
              </button>
              <button
                onClick={handleEdit}
                disabled={saving}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg py-2 text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <IconEdit />
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteTx && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-500 mx-auto mb-4">
              <IconWarning />
            </div>
            <h2 className="font-bold text-gray-800 text-lg text-center mb-1">Hapus Transaksi?</h2>
            <p className="text-sm text-gray-500 text-center mb-0.5">
              #{deleteTx.id} · {deleteTx.customerName}
            </p>
            <p className="text-base font-bold text-rose-600 text-center mb-4">{formatRupiah(deleteTx.total)}</p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-5 text-xs text-amber-700 text-center">
              Stok produk akan dikembalikan otomatis.<br />Tindakan ini <span className="font-bold">tidak bisa dibatalkan</span>.
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDeleteTx(null)} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm hover:bg-gray-50">
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-lg py-2 text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <IconTrash />
                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
