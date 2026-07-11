import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { authService } from '@/services/authService'

// Layouts
import AdminLayout from '@/layouts/AdminLayout'
import KasirLayout from '@/layouts/KasirLayout'
import DapurLayout from '@/layouts/DapurLayout'

// Auth
import LoginPage from '@/pages/auth/LoginPage'

// Landing
import LandingPage from '@/pages/LandingPage'

// Customer
import CustomerMenuPage from '@/pages/customer/MenuPage'
import CustomerCartPage from '@/pages/customer/CartPage'
import CustomerCheckoutPage from '@/pages/customer/CheckoutPage'
import CustomerOrderStatusPage from '@/pages/customer/OrderStatusPage'

// Admin
import AdminDashboardPage from '@/pages/admin/DashboardPage'
import AdminMenuPage from '@/pages/admin/MenuPage'
import AdminCategoryPage from '@/pages/admin/CategoryPage'
import AdminTablePage from '@/pages/admin/TablePage'
import AdminUsersPage from '@/pages/admin/UsersPage'
import AdminOrdersPage from '@/pages/admin/OrdersPage'
import AdminReportsPage from '@/pages/admin/ReportsPage'
import AdminSettingsPage from '@/pages/admin/SettingsPage'

// Kasir
import KasirDashboardPage from '@/pages/kasir/DashboardPage'
import KasirHistoryPage from '@/pages/kasir/HistoryPage'

// Dapur
import DapurDashboardPage from '@/pages/dapur/DashboardPage'

import ProtectedRoute from '@/components/shared/ProtectedRoute'
import LoadingScreen from '@/components/shared/LoadingScreen'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
})

export default function App() {
  const { loading, setUser, setLoading } = useAuthStore()

  useEffect(() => {
    authService.getCurrentUser().then((user) => {
      setUser(user)
      setLoading(false)
    })

    const { data: { subscription } } = authService.onAuthStateChange((user) => {
      setUser(user)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [setUser, setLoading])

  if (loading) return <LoadingScreen />

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Auth */}
          <Route path="/login" element={<LoginPage />} />

          {/* Customer (no auth) */}
          <Route path="/menu" element={<CustomerMenuPage />} />
          <Route path="/cart" element={<CustomerCartPage />} />
          <Route path="/checkout" element={<CustomerCheckoutPage />} />
          <Route path="/order-status" element={<CustomerOrderStatusPage />} />

          {/* Admin */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboardPage />} />
            <Route path="menu" element={<AdminMenuPage />} />
            <Route path="categories" element={<AdminCategoryPage />} />
            <Route path="tables" element={<AdminTablePage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>

          {/* Kasir */}
          <Route
            path="/kasir"
            element={
              <ProtectedRoute roles={['kasir', 'admin']}>
                <KasirLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<KasirDashboardPage />} />
            <Route path="history" element={<KasirHistoryPage />} />
          </Route>

          {/* Dapur */}
          <Route
            path="/dapur"
            element={
              <ProtectedRoute roles={['dapur', 'admin']}>
                <DapurLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DapurDashboardPage />} />
          </Route>

          {/* Landing page */}
          <Route path="/" element={<LandingPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { borderRadius: '0.625rem', fontSize: '0.875rem' },
        }}
      />
    </QueryClientProvider>
  )
}
