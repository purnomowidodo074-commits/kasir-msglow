import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'

export default async function StockLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.user.role !== 'owner') redirect('/dashboard')
  return <>{children}</>
}
