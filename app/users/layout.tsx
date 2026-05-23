import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'

export default async function UsersLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.user.role !== 'owner') redirect('/dashboard')
  return <>{children}</>
}
