'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { useCart } from '@/hooks/useCart'

interface Product {
  id: number
  name: string
  category: string
  price: number
  stock: number
  imageUrl?: string | null
}

interface SessionUser {
  name: string
  role: string
}

const CATEGORIES = ['semua', 'skincare', 'treatment', 'makeup']

function formatRupiah(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID')
}

export default function TransaksiPage() {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('semua')
  const [showCheckout, setShowCheckout] = useState(false)
  const [receipt, setReceipt] = useState<Record<string, unknown> | null>(null)
  const [settings, setSettings] = useState({ taxRate: '0', discountRate: '0', discountType: 'percent' })
  const { items, addItem, removeItem, updateQuantity, clearCart, subtotal } = useCart()

  useEffect(() => {
    fetch('/api/products').then((r) => r.json()).then(setProducts)
    fetch('/api/settings').then((r) => r.json()).then((s) => {
      setSettings({ taxRate: s.taxRate ?? '0', discountRate: s.discountRate ?? '0', discountType: s.discountType ?? 'percent' })
    })
    fetch('/api/auth/me').then((r) => r.ok ? r.json() : null).then((d) => { if (d) setUser(d) })
  }, [])

  const filtered = products.filter((p) => {
    const matchCat = category === 'semua' || p.category === category
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const taxRate = parseFloat(settings.taxRate) / 100
  const discountRate = parseFloat(settings.discountRate)
  const discount = settings.discountType === 'percent' ? Math.round(subtotal * discountRate / 100) : discountRate
  const tax = Math.round((subtotal - discount) * taxRate)
  const total = subtotal - discount + tax

  async function handleCheckout(form: { customerName: string; paymentMethod: string; bankName?: string; amountPaid: number }) {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, subtotal, discount, tax, total, change: form.amountPaid - total, items }),
    })
    if (res.ok) {
      const tx = await res.json()
      setReceipt({ ...tx, items, subtotal, discount, tax, total, change: form.amountPaid - total, amountPaid: form.amountPaid })
      clearCart()
      setShowCheckout(false)
      fetch('/api/products').then((r) => r.json()).then(setProducts)
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar userName={user?.name ?? ''} role={user?.role ?? 'cashier'} />
      <main className="flex-1 flex gap-0">
        <div className="flex-1 p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Transaksi</h1>
          <div className="flex gap-3 mb-4">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari produk..." className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 flex-1" />
          </div>
          <div className="flex gap-2 mb-4">
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => setCategory(c)} className={`px-3 py-1 rounded-full text-sm capitalize transition ${category === c ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {c}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((p) => (
              <button key={p.id} onClick={() => addItem(p)} disabled={p.stock === 0}
                className="bg-white border border-gray-100 rounded-xl p-3 text-left hover:border-rose-300 hover:shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed">
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imageUrl} alt={p.name} className="w-full h-24 object-cover rounded-lg mb-2" />
                ) : (
                  <div className="w-full h-24 bg-rose-50 rounded-lg mb-2 flex items-center justify-center text-3xl">🧴</div>
                )}
                <p className="text-sm font-medium text-gray-800 line-clamp-2">{p.name}</p>
                <p className="text-xs text-rose-600 font-semibold mt-1">{formatRupiah(p.price)}</p>
                <p className="text-xs text-gray-400">Stok: {p.stock}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="w-72 bg-white border-l border-gray-100 flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-800">Keranjang</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {items.length === 0 && <p className="text-sm text-gray-400 text-center mt-8">Belum ada produk</p>}
            {items.map((item) => (
              <div key={item.productId} className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{item.productName}</p>
                  <p className="text-xs text-rose-500">{formatRupiah(item.price)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-sm hover:bg-gray-200">-</button>
                  <span className="text-sm w-5 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 text-sm hover:bg-rose-200">+</button>
                </div>
                <button onClick={() => removeItem(item.productId)} className="text-red-400 hover:text-red-600 text-sm">✕</button>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-gray-100 space-y-2">
            <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>{formatRupiah(subtotal)}</span></div>
            {discount > 0 && <div className="flex justify-between text-sm text-green-600"><span>Diskon</span><span>- {formatRupiah(discount)}</span></div>}
            {tax > 0 && <div className="flex justify-between text-sm text-gray-600"><span>Pajak ({settings.taxRate}%)</span><span>{formatRupiah(tax)}</span></div>}
            <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-gray-100"><span>Total</span><span className="text-rose-600">{formatRupiah(total)}</span></div>
            <button disabled={items.length === 0} onClick={() => setShowCheckout(true)} className="w-full bg-rose-500 hover:bg-rose-600 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50 mt-2">
              Checkout
            </button>
          </div>
        </div>
      </main>

      {showCheckout && <CheckoutModal total={total} onClose={() => setShowCheckout(false)} onSubmit={handleCheckout} />}
      {receipt && <ReceiptModal receipt={receipt} onClose={() => setReceipt(null)} />}
    </div>
  )
}

function CheckoutModal({ total, onClose, onSubmit }: { total: number; onClose: () => void; onSubmit: (form: { customerName: string; paymentMethod: string; bankName?: string; amountPaid: number }) => void }) {
  const [customerName, setCustomerName] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('tunai')
  const [bankName, setBankName] = useState('')
  const [amountPaid, setAmountPaid] = useState(total)

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <h2 className="font-bold text-gray-800 text-lg mb-4">Checkout</h2>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-600">Nama Pelanggan</label>
            <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Guest" className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-rose-400" />
          </div>
          <div>
            <label className="text-sm text-gray-600">Metode Pembayaran</label>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-rose-400">
              <option value="tunai">Tunai</option>
              <option value="transfer">Transfer</option>
              <option value="qris">QRIS</option>
            </select>
          </div>
          {paymentMethod === 'transfer' && (
            <div>
              <label className="text-sm text-gray-600">Nama Bank</label>
              <input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="BCA, BNI, dll" className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-rose-400" />
            </div>
          )}
          <div>
            <label className="text-sm text-gray-600">Jumlah Bayar</label>
            <input type="number" value={amountPaid} onChange={(e) => setAmountPaid(Number(e.target.value))} min={total} className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-rose-400" />
          </div>
          <div className="flex justify-between font-semibold text-gray-800">
            <span>Kembalian</span>
            <span className={amountPaid - total < 0 ? 'text-red-500' : 'text-green-600'}>Rp {Math.max(0, amountPaid - total).toLocaleString('id-ID')}</span>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm hover:bg-gray-50">Batal</button>
          <button disabled={amountPaid < total} onClick={() => onSubmit({ customerName: customerName || 'Guest', paymentMethod, bankName: bankName || undefined, amountPaid })} className="flex-1 bg-rose-500 hover:bg-rose-600 text-white rounded-lg py-2 text-sm font-semibold disabled:opacity-50">
            Bayar
          </button>
        </div>
      </div>
    </div>
  )
}

function ReceiptModal({ receipt, onClose }: { receipt: Record<string, unknown>; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <h2 className="font-bold text-center text-lg mb-1">Ms Glow</h2>
        <p className="text-center text-xs text-gray-500 mb-3">Struk Pembelian</p>
        <div className="border-t border-dashed border-gray-300 pt-3 space-y-1">
          {(receipt.items as { productName: string; quantity: number; price: number }[]).map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span>{item.productName} x{item.quantity}</span>
              <span>Rp {(item.price * item.quantity).toLocaleString('id-ID')}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-dashed border-gray-300 mt-3 pt-3 space-y-1 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>Rp {(receipt.subtotal as number).toLocaleString('id-ID')}</span></div>
          {(receipt.discount as number) > 0 && <div className="flex justify-between text-green-600"><span>Diskon</span><span>- Rp {(receipt.discount as number).toLocaleString('id-ID')}</span></div>}
          {(receipt.tax as number) > 0 && <div className="flex justify-between"><span>Pajak</span><span>Rp {(receipt.tax as number).toLocaleString('id-ID')}</span></div>}
          <div className="flex justify-between font-bold text-base"><span>Total</span><span>Rp {(receipt.total as number).toLocaleString('id-ID')}</span></div>
          <div className="flex justify-between"><span>Bayar</span><span>Rp {(receipt.amountPaid as number).toLocaleString('id-ID')}</span></div>
          <div className="flex justify-between"><span>Kembalian</span><span>Rp {(receipt.change as number).toLocaleString('id-ID')}</span></div>
        </div>
        <p className="text-center text-xs text-gray-400 mt-3">Terima kasih telah berbelanja!</p>
        <div className="flex gap-2 mt-4">
          <button onClick={() => window.print()} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm hover:bg-gray-50">🖨️ Print</button>
          <button onClick={onClose} className="flex-1 bg-rose-500 text-white rounded-lg py-2 text-sm font-semibold hover:bg-rose-600">Tutup</button>
        </div>
      </div>
    </div>
  )
}
