import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ClipboardList, History, LogOut, Menu as MenuIcon } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { authService } from '@/services/authService'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import toast from 'react-hot-toast'

const navItems = [
  { to: '/kasir', label: 'Pesanan Masuk', icon: ClipboardList, end: true },
  { to: '/kasir/history', label: 'Riwayat', icon: History },
]

export default function KasirLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, setUser } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await authService.signOut()
    setUser(null)
    toast.success('Berhasil logout')
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-56 shrink-0 flex-col bg-sidebar border-r border-sidebar-border">
        <div className="flex items-center gap-3 p-4 border-b border-sidebar-border">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-sm">K</span>
          </div>
          <div>
            <p className="font-bold text-sm text-sidebar-foreground">Kasir</p>
            <p className="text-xs text-sidebar-foreground/60">Ayomi Pesan</p>
          </div>
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-primary text-white text-xs">
                {user?.full_name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{user?.full_name}</p>
              <p className="text-xs text-sidebar-foreground/60">Kasir</p>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={handleLogout} className="hover:text-destructive">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b bg-card flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon-sm" className="md:hidden" onClick={() => setMobileOpen(true)}>
              <MenuIcon className="w-4 h-4" />
            </Button>
            <span className="font-semibold text-sm">Dashboard Kasir</span>
          </div>
          <Button variant="ghost" size="icon-sm" className="md:hidden" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
          </Button>
        </header>

        {/* Mobile Drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-40" onClick={() => setMobileOpen(false)} />
              <motion.div initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }}
                className="fixed left-0 top-0 h-full w-56 z-50 bg-sidebar border-r border-sidebar-border flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
                  <span className="font-bold">Kasir Menu</span>
                  <Button variant="ghost" size="icon-sm" onClick={() => setMobileOpen(false)}>✕</Button>
                </div>
                <nav className="flex-1 p-2 space-y-0.5">
                  {navItems.map((item) => (
                    <NavLink key={item.to} to={item.to} end={item.end}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${isActive ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent'}`
                      }>
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </NavLink>
                  ))}
                </nav>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <main className="flex-1 overflow-y-auto p-4">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
