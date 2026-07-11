import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  TrendingUp, ShoppingBag, Table2,
  Clock
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { getOrderStatusColor, getOrderStatusLabel } from '@/lib/utils'

async function fetchDashboardData() {
  const today = new Date().toISOString().split('T')[0]

  const [ordersRes, todayRes, tablesRes] = await Promise.all([
    supabase.from('orders')
      .select('id, total, order_status, created_at')
      .not('order_status', 'eq', 'cancelled')
      .order('created_at', { ascending: false })
      .limit(200),
    supabase.from('orders')
      .select('id, total, order_status')
      .gte('created_at', `${today}T00:00:00`)
      .not('order_status', 'eq', 'cancelled'),
    supabase.from('tables').select('id, is_active'),
  ])

  const orders = ordersRes.data || []
  const todayOrders = todayRes.data || []
  const tables = tablesRes.data || []

  const totalRevenue = orders
    .filter((o) => o.order_status === 'selesai' || o.order_status === 'paid')
    .reduce((sum, o) => sum + o.total, 0)

  const todayRevenue = todayOrders
    .filter((o) => o.order_status === 'selesai' || o.order_status === 'paid')
    .reduce((sum, o) => sum + o.total, 0)

  // Chart: last 7 days
  const chartData = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    const dayOrders = orders.filter((o) => o.created_at.startsWith(key))
    const rev = dayOrders.filter((o) => ['selesai', 'paid'].includes(o.order_status)).reduce((s, o) => s + o.total, 0)
    chartData.push({
      day: d.toLocaleDateString('id-ID', { weekday: 'short' }),
      revenue: rev,
      orders: dayOrders.length,
    })
  }

  return {
    totalRevenue,
    todayRevenue,
    totalOrders: orders.length,
    todayOrders: todayOrders.length,
    activeTables: tables.filter((t) => t.is_active).length,
    recentOrders: orders.slice(0, 5),
    chartData,
    pendingOrders: orders.filter((o) => ['waiting_cash_payment', 'waiting_payment', 'paid', 'diproses', 'dimasak', 'siap_diantar'].includes(o.order_status)).length,
  }
}

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: fetchDashboardData,
    refetchInterval: 30000,
  })

  const stats = [
    {
      label: 'Total Pendapatan',
      value: formatCurrency(data?.totalRevenue || 0),
      sub: `Hari ini: ${formatCurrency(data?.todayRevenue || 0)}`,
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Total Pesanan',
      value: data?.totalOrders || 0,
      sub: `Hari ini: ${data?.todayOrders || 0} pesanan`,
      icon: ShoppingBag,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Pesanan Aktif',
      value: data?.pendingOrders || 0,
      sub: 'Sedang diproses',
      icon: Clock,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      label: 'Meja Aktif',
      value: data?.activeTables || 0,
      sub: 'Terdaftar',
      icon: Table2,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Selamat datang di Ayomi Pesan</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card>
              <CardContent className="pt-4 pb-4">
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-7 w-24" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                      <p className="text-xl font-bold mt-0.5">{stat.value}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{stat.sub}</p>
                    </div>
                    <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center`}>
                      <stat.icon className={`w-4 h-4 ${stat.color}`} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Pendapatan 7 Hari Terakhir</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data?.chartData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v) => [formatCurrency(Number(v) || 0), 'Pendapatan']}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Bar dataKey="revenue" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Pesanan Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : !data?.recentOrders?.length ? (
            <p className="text-sm text-muted-foreground text-center py-6">Belum ada pesanan</p>
          ) : (
            <div className="space-y-2">
              {data.recentOrders.map((order: { id: string; order_status: string; total: number; created_at: string }) => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">
                      {(order as { order_number?: string }).order_number || order.id.slice(0, 8)}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(order.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold">{formatCurrency(order.total)}</span>
                    <Badge className={`text-xs ${getOrderStatusColor(order.order_status)}`} variant="secondary">
                      {getOrderStatusLabel(order.order_status)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
