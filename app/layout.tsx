import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Kasir Ms Glow',
  description: 'Sistem Kasir MS Glow Skincare',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="antialiased bg-gray-50 text-gray-900">{children}</body>
    </html>
  )
}
