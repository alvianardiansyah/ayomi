import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import type { UserRole } from '@/types'
import LoadingScreen from './LoadingScreen'

interface Props {
  children: React.ReactNode
  roles: UserRole[]
}

export default function ProtectedRoute({ children, roles }: Props) {
  const { user, loading } = useAuthStore()

  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (!roles.includes(user.role)) {
    const redirects: Record<UserRole, string> = {
      admin: '/admin',
      kasir: '/kasir',
      dapur: '/dapur',
    }
    return <Navigate to={redirects[user.role]} replace />
  }

  return <>{children}</>
}
