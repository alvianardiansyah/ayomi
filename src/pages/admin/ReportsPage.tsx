import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line,
} from 'recharts'
import toast from 'react-hot-toast'

type Period = 'daily' | 'weekly' | 'monthly'

async function fetchReport(period: Period) {
  const now = new Date()
  let startDate: Date

  if (period === 'daily') {
    startDate = new Date(now)
    startDate.setDate(startDate.getDate() - 29)
  } else if (period === 'weekly') {
    startDate = new Date(now)
    startDate.setDate(startDate.getDate() - 84) // 12 weeks
  } else {
    startDate = new Date(now)
    startDate.setMonth(startDate.getMonth() - 11)
    startDate.setDate(1)
  }

  const { data: orders } = await supabase
    .from('orders')
    .select('id, total, order_status, created_at, order_items(id, menu_id, qty, subtotal, menus(name))')
    .gte('created_at', startDate.toISOString())
    .in('order_status', ['paid', 'selesai'])
    .order('created_at')

  const revenue = (orders || []).reduce((s, o) => s + o.total, 0)
  const count = (orders || []).length

  // Group by period
  const grouped: Record<string, { revenue: number; orders: number }> = {}

  for (const order of orders || []) {
    const d = new Date(order.created_at)
    let key: string
    if (period === 'daily') {
      key = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
    } else if (period === 'weekly') {
      const weekStart = new Date(d)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      key = weekStart.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
    } else {
      key = d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' })
    }
    if (!grouped[key]) grouped[key] = { revenue: 0, orders: 0 }
    grouped[key].revenue += order.total
    grouped[key].orders += 1
  }

  const chartData = Object.entries(grouped).map(([label, v]) => ({ label, ...v }))

  // Top menus
  const menuMap: Record<string, { name: string; qty: number; revenue: number }> = {}
  for (const order of orders || []) {
    for (const item of (order.order_items as unknown as { menu_id: string; qty: number; subtotal: number; menus?: { name: string } }[]) || []) {
      const name = item.menus?.name || item.menu_id
      if (!menuMap[name]) menuMap[name] = { name, qty: 0, revenue: 0 }
      menuMap[name].qty += item.qty
      menuMap[name].revenue += item.subtotal
    }
  }
  const topMenus = Object.values(menuMap).sort((a, b) => b.qty - a.qty).slice(0, 5)

  return { revenue, count, chartData, topMenus, orders: orders || [] }
}

export default function AdminReportsPage() {
  const [period, setPeriod] = useState<Period>('daily')

  const { data, isLoading } = useQuery({
    queryKey: ['reports', period],
    queryFn: () => fetchReport(period),
  })

  const exportCSV = () => {
    if (!data?.orders?.length) {
      toast.error('Tidak ada data untuk diekspor')
      return
    }
    const headers = ['Order ID', 'Tanggal', 'Total', 'Status']
    const rows = data.orders.map((o: { id: string; created_at: string; total: number; order_status: string }) => [
      o.id.slice(0, 8),
      new Date(o.created_at).toLocaleString('id-ID'),
      o.total,
      o.order_status,
    ])
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `laporan-${period}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Laporan CSV diunduh')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold">Laporan</h1>
          <p className="text-sm text-muted-foreground">Analitik penjualan</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-36">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Harian (30 hari)</SelectItem>
              <SelectItem value="weekly">Mingguan (12 minggu)</SelectItem>
              <SelectItem value="monthly">Bulanan (12 bulan)</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-1" /> CSV
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Total Pendapatan</p>
            <p className="text-xl font-bold text-primary">{formatCurrency(data?.revenue || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Total Pesanan</p>
            <p className="text-xl font-bold">{data?.count || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Grafik Pendapatan</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Memuat...</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data?.chartData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(v) => [formatCurrency(Number(v) || 0), 'Pendapatan']}
                  contentStyle={{ fontSize: 11, borderRadius: 8 }}
                />
                <Bar dataKey="revenue" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Orders Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Jumlah Pesanan</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={data?.chartData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              <Line type="monotone" dataKey="orders" stroke="var(--primary)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Menus */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Menu Terlaris</CardTitle>
        </CardHeader>
        <CardContent>
          {!data?.topMenus?.length ? (
            <p className="text-sm text-muted-foreground text-center py-4">Belum ada data</p>
          ) : (
            <div className="space-y-2">
              {data.topMenus.map((m, i) => (
                <div key={m.name} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.qty} terjual</p>
                  </div>
                  <span className="text-sm font-semibold text-primary">{formatCurrency(m.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
