'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'

interface User {
  id: number
  username: string
  name: string
  role: string
  createdAt: string
}

export default function UsersPage() {
  const [currentUser, setCurrentUser] = useState({ name: '', role: 'owner' })
  const [users, setUsers] = useState<User[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [form, setForm] = useState({ username: '', name: '', password: '', role: 'cashier' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/users').then((r) => r.json()).then(setUsers)
    fetch('/api/auth/me').then((r) => r.ok ? r.json() : null).then((d) => { if (d) setCurrentUser(d) })
  }, [])

  function openAdd() {
    setEditing(null)
    setForm({ username: '', name: '', password: '', role: 'cashier' })
    setError('')
    setShowModal(true)
  }

  function openEdit(u: User) {
    setEditing(u)
    setForm({ username: u.username, name: u.name, password: '', role: u.role })
    setError('')
    setShowModal(true)
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    const res = editing
      ? await fetch(`/api/users/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: form.name, password: form.password || undefined, role: form.role }) })
      : await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error)
    } else {
      setUsers((prev) => editing ? prev.map((u) => u.id === editing.id ? data : u) : [...prev, data])
      setShowModal(false)
    }
    setSaving(false)
  }

  async function handleDelete(id: number) {
    if (!confirm('Hapus pengguna ini?')) return
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
    if (res.ok) setUsers((prev) => prev.filter((u) => u.id !== id))
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar userName={currentUser.name} role={currentUser.role} />
      <main className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Pengguna</h1>
          <button onClick={openAdd} className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-semibold">+ Tambah Pengguna</button>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Nama</th>
                <th className="px-4 py-3 text-left">Username</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Dibuat</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{u.name}</td>
                  <td className="px-4 py-3 text-gray-500">@{u.username}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${u.role === 'owner' ? 'bg-rose-100 text-rose-600' : 'bg-gray-100 text-gray-600'}`}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(u.createdAt).toLocaleDateString('id-ID')}</td>
                  <td className="px-4 py-3 text-center space-x-2">
                    <button onClick={() => openEdit(u)} className="text-blue-500 hover:text-blue-700 text-xs border border-blue-200 px-2 py-1 rounded">Edit</button>
                    <button onClick={() => handleDelete(u.id)} className="text-red-500 hover:text-red-700 text-xs border border-red-200 px-2 py-1 rounded">Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
              <h2 className="font-bold text-gray-800 text-lg mb-4">{editing ? 'Edit Pengguna' : 'Tambah Pengguna'}</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-600">Nama Lengkap</label>
                  <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-rose-400" />
                </div>
                {!editing && (
                  <div>
                    <label className="text-sm text-gray-600">Username</label>
                    <input value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-rose-400" />
                  </div>
                )}
                <div>
                  <label className="text-sm text-gray-600">{editing ? 'Password Baru (kosong = tidak diubah)' : 'Password'}</label>
                  <input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-rose-400" />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Role</label>
                  <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-rose-400">
                    <option value="cashier">Kasir</option>
                    <option value="owner">Owner</option>
                  </select>
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={() => setShowModal(false)} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm hover:bg-gray-50">Batal</button>
                <button onClick={handleSave} disabled={saving} className="flex-1 bg-rose-500 hover:bg-rose-600 text-white rounded-lg py-2 text-sm font-semibold disabled:opacity-50">
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
