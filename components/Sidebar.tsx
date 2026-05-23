'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/transaksi', label: 'Transaksi', icon: '🛒' },
  { href: '/history', label: 'Riwayat', icon: '🕒' },
  { href: '/stock', label: 'Stok Produk', icon: '📦', ownerOnly: true },
  { href: '/settings', label: 'Pengaturan', icon: '⚙️', ownerOnly: true },
  { href: '/users', label: 'Pengguna', icon: '👥', ownerOnly: true },
]

interface SidebarProps {
  userName: string
  role: string
}

export default function Sidebar({ userName, role }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const visibleNav = navItems.filter((item) => !item.ownerOnly || role === 'owner')

  return (
    <aside className="w-56 min-h-screen bg-white border-r border-gray-100 flex flex-col shadow-sm">
      <div className="p-4 border-b border-gray-100 flex items-center gap-2">
        <Image src="/logo-msglow.png" alt="Ms Glow" width={36} height={36} className="object-contain" />
        <span className="font-bold text-rose-600 text-sm">Ms Glow Kasir</span>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {visibleNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
              pathname === item.href
                ? 'bg-rose-50 text-rose-600 font-semibold'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-100">
        <p className="text-xs text-gray-500 px-3 mb-1">{userName}</p>
        <p className="text-xs text-gray-400 px-3 mb-2 capitalize">{role}</p>
        <button
          onClick={handleLogout}
          className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-red-50 hover:text-red-500 transition"
        >
          <span>🚪</span> Keluar
        </button>
      </div>
    </aside>
  )
}
