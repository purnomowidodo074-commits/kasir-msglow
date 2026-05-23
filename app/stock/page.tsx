'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'

interface Product {
  id: number
  name: string
  category: string
  price: number
  stock: number
  imageUrl?: string | null
}

const CATEGORIES = ['skincare', 'treatment', 'makeup']

function formatRupiah(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID')
}

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? ''
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? ''

export default function StockPage() {
  const [user, setUser] = useState({ name: '', role: 'owner' })
  const [products, setProducts] = useState<Product[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState({ name: '', category: 'skincare', price: '', stock: '', imageUrl: '' })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/products').then((r) => r.json()).then(setProducts)
    fetch('/api/auth/me').then((r) => r.ok ? r.json() : null).then((d) => { if (d) setUser(d) })
  }, [])

  function openAdd() {
    setEditing(null)
    setForm({ name: '', category: 'skincare', price: '', stock: '', imageUrl: '' })
    setShowModal(true)
  }

  function openEdit(p: Product) {
    setEditing(p)
    setForm({ name: p.name, category: p.category, price: String(p.price), stock: String(p.stock), imageUrl: p.imageUrl ?? '' })
    setShowModal(true)
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !CLOUD_NAME || !UPLOAD_PRESET) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('upload_preset', UPLOAD_PRESET)
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: fd })
    const data = await res.json()
    setForm((f) => ({ ...f, imageUrl: data.secure_url }))
    setUploading(false)
  }

  async function handleSave() {
    setSaving(true)
    const body = { name: form.name, category: form.category, price: Number(form.price), stock: Number(form.stock), imageUrl: form.imageUrl || null }
    const res = editing
      ? await fetch(`/api/products/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      : await fetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (res.ok) {
      const updated = await res.json()
      setProducts((prev) => editing ? prev.map((p) => p.id === editing.id ? updated : p) : [...prev, updated])
      setShowModal(false)
    }
    setSaving(false)
  }

  async function handleDelete(id: number) {
    if (!confirm('Hapus produk ini?')) return
    setDeleteError(null)
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setDeleteError(data.error ?? 'Gagal menghapus produk.')
      return
    }
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar userName={user.name} role={user.role} />
      <main className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Stok Produk</h1>
          <button onClick={openAdd} className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-semibold">+ Tambah Produk</button>
        </div>

        {deleteError && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex justify-between items-center">
            <span>{deleteError}</span>
            <button onClick={() => setDeleteError(null)} className="text-red-400 hover:text-red-600 ml-4 font-bold">×</button>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Produk</th>
                <th className="px-4 py-3 text-left">Kategori</th>
                <th className="px-4 py-3 text-right">Harga</th>
                <th className="px-4 py-3 text-right">Stok</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 flex items-center gap-3">
                    {p.imageUrl
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={p.imageUrl} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                      : <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center text-lg">🧴</div>}
                    <span className="font-medium text-gray-800">{p.name}</span>
                  </td>
                  <td className="px-4 py-3 capitalize text-gray-500">{p.category}</td>
                  <td className="px-4 py-3 text-right">{formatRupiah(p.price)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-semibold ${p.stock < 3 ? 'text-red-500' : 'text-gray-800'}`}>{p.stock}</span>
                  </td>
                  <td className="px-4 py-3 text-center space-x-2">
                    <button onClick={() => openEdit(p)} className="text-blue-500 hover:text-blue-700 text-xs border border-blue-200 px-2 py-1 rounded">Edit</button>
                    <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-700 text-xs border border-red-200 px-2 py-1 rounded">Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
              <h2 className="font-bold text-gray-800 text-lg mb-4">{editing ? 'Edit Produk' : 'Tambah Produk'}</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-600">Nama Produk</label>
                  <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-rose-400" />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Kategori</label>
                  <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-rose-400">
                    {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-gray-600">Harga (Rp)</label>
                    <input type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-rose-400" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Stok</label>
                    <input type="number" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-rose-400" />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Foto Produk</label>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" disabled={!CLOUD_NAME} />
                  {!CLOUD_NAME && <p className="text-xs text-gray-400 mt-1">Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME untuk upload foto</p>}
                  {uploading && <p className="text-xs text-blue-500 mt-1">Mengupload...</p>}
                  {form.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.imageUrl} alt="preview" className="mt-2 h-20 rounded-lg object-cover" />
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={() => setShowModal(false)} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm hover:bg-gray-50">Batal</button>
                <button onClick={handleSave} disabled={saving || !form.name || !form.price} className="flex-1 bg-rose-500 hover:bg-rose-600 text-white rounded-lg py-2 text-sm font-semibold disabled:opacity-50">
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
