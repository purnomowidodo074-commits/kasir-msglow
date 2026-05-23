'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'

export default function SettingsPage() {
  const [user, setUser] = useState({ name: '', role: 'owner' })
  const [form, setForm] = useState({
    taxRate: '0',
    discountRate: '0',
    discountType: 'percent',
    storeName: 'Ms Glow',
    storeAddress: '',
    storePhone: '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/settings').then((r) => r.json()).then((s) => setForm((f) => ({ ...f, ...s })))
    fetch('/api/auth/me').then((r) => r.ok ? r.json() : null).then((d) => { if (d) setUser(d) })
  }, [])

  async function handleSave() {
    setSaving(true)
    await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar userName={user.name} role={user.role} />
      <main className="flex-1 p-6 max-w-xl">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Pengaturan</h1>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-700">Informasi Toko</h2>
          {(['storeName', 'storeAddress', 'storePhone'] as const).map((field) => (
            <div key={field}>
              <label className="text-sm text-gray-600 capitalize">{field === 'storeName' ? 'Nama Toko' : field === 'storeAddress' ? 'Alamat' : 'Telepon'}</label>
              <input value={form[field]} onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-rose-400" />
            </div>
          ))}

          <div className="border-t border-gray-100 pt-4">
            <h2 className="font-semibold text-gray-700 mb-3">Pajak & Diskon</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-600">Pajak (%)</label>
                <input type="number" value={form.taxRate} onChange={(e) => setForm((f) => ({ ...f, taxRate: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-rose-400" />
              </div>
              <div>
                <label className="text-sm text-gray-600">Diskon</label>
                <input type="number" value={form.discountRate} onChange={(e) => setForm((f) => ({ ...f, discountRate: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-rose-400" />
              </div>
            </div>
            <div className="mt-3">
              <label className="text-sm text-gray-600">Jenis Diskon</label>
              <select value={form.discountType} onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-rose-400">
                <option value="percent">Persen (%)</option>
                <option value="fixed">Nominal (Rp)</option>
              </select>
            </div>
          </div>

          <button onClick={handleSave} disabled={saving} className="w-full bg-rose-500 hover:bg-rose-600 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50">
            {saved ? '✓ Tersimpan' : saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
        </div>
      </main>
    </div>
  )
}
